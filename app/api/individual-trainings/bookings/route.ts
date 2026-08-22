import { NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/auth-helpers";
import { sql } from "@/lib/db-singleton";
import { getSessionUser } from "@/lib/session-helpers";
import { belgradeDateToday } from "@/lib/membership-status";
import { isDateWithinInclusivePeriod } from "@/lib/individual-training-access";
import {
  formatTrainingDate,
  sendPushToAdmins,
  sendPushToMember,
} from "@/lib/push-notifications";

export async function GET() {
  const auth = await checkAdminAuth();
  if (!auth.isAdmin) {
    return NextResponse.json(
      { error: auth.error || "Nemate pristup" },
      { status: auth.isAuthenticated ? 403 : 401 },
    );
  }

  try {
    const bookings = await sql`
      SELECT
        b.id,
        b.status,
        b.created_at,
        s.id AS slot_id,
        s.starts_at,
        s.ends_at,
        m.id AS member_id,
        m.first_name,
        m.last_name,
        m.email
      FROM individual_training_bookings b
      JOIN individual_training_slots s ON s.id = b.slot_id
      JOIN members m ON m.id = b.member_id
      WHERE b.status IN ('pending', 'booked')
        AND s.status = 'open'
        AND s.starts_at >= (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Belgrade')
      ORDER BY s.starts_at ASC, m.last_name ASC
    `;

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("[GARD018] Individual bookings fetch failed:", error);
    return NextResponse.json(
      { error: "Greška pri učitavanju rezervacija" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json(
      { error: "Morate biti prijavljeni" },
      { status: 401 },
    );

  const adminAuth = await checkAdminAuth();
  if (adminAuth.isAdmin) {
    return NextResponse.json(
      {
        error:
          "Admin pregleda termine i rezervacije, ali ne rezerviše trening.",
      },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();
    const slotId = Number(body.slotId);
    if (!Number.isInteger(slotId))
      return NextResponse.json({ error: "Nevažeći termin" }, { status: 400 });

    const memberResult = await sql`
      SELECT id, first_name, last_name, individual_training_paid, individual_start_date, individual_expiry_date
      FROM members
      WHERE email = ${user.email}
      LIMIT 1
    `;

    if (memberResult.length === 0) {
      return NextResponse.json(
        { error: "Vaš nalog nije povezan sa članstvom" },
        { status: 403 },
      );
    }

    const member = memberResult[0];
    if (
      !member.individual_training_paid ||
      !member.individual_start_date ||
      !member.individual_expiry_date
    ) {
      return NextResponse.json(
        {
          error:
            "Individualni trening nije aktiviran za vaš nalog. Potrebno je da uplatite individualni trening kod admina.",
        },
        { status: 403 },
      );
    }

    const today = belgradeDateToday();
    const startDate = String(member.individual_start_date).slice(0, 10);
    const expiryDate = String(member.individual_expiry_date).slice(0, 10);

    if (today < startDate) {
      return NextResponse.json(
        {
          error: `Period individualnog treninga još nije počeo. Važi od ${startDate.split("-").reverse().join(".")}.`,
        },
        { status: 403 },
      );
    }

    if (today > expiryDate) {
      return NextResponse.json(
        {
          error:
            "Period individualnog treninga je istekao. Potrebno je da obnovite uplatu kod admina.",
        },
        { status: 403 },
      );
    }

    const slotResult = await sql`
      SELECT
        id,
        status,
        starts_at,
        (starts_at >= (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Belgrade')) AS is_future
      FROM individual_training_slots
      WHERE id = ${slotId}
      LIMIT 1
    `;
    if (slotResult.length === 0 || slotResult[0].status !== "open") {
      return NextResponse.json(
        { error: "Termin nije dostupan" },
        { status: 404 },
      );
    }

    if (!slotResult[0].is_future) {
      return NextResponse.json(
        { error: "Termin je već počeo ili je prošao" },
        { status: 400 },
      );
    }

    if (
      !isDateWithinInclusivePeriod(
        slotResult[0].starts_at,
        startDate,
        expiryDate,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Ovaj termin nije u vašem aktivnom periodu individualnog treninga.",
        },
        { status: 403 },
      );
    }

    const existing = await sql`
      SELECT id, status FROM individual_training_bookings
      WHERE slot_id = ${slotId} AND member_id = ${member.id} AND status IN ('pending', 'booked')
      LIMIT 1
    `;
    if (existing.length > 0) {
      return NextResponse.json(
        {
          error:
            existing[0].status === "pending"
              ? "Već ste poslali zahtev za ovaj termin"
              : "Ovaj trening je već potvrđen",
        },
        { status: 409 },
      );
    }

    const result = await sql`
      INSERT INTO individual_training_bookings (slot_id, member_id, status)
      VALUES (${slotId}, ${member.id}, 'pending')
      ON CONFLICT (slot_id, member_id)
      DO UPDATE SET
        status = 'pending',
        created_at = CURRENT_TIMESTAMP,
        reviewed_at = NULL,
        reviewed_by = NULL
      WHERE individual_training_bookings.status IN ('cancelled', 'rejected')
      RETURNING id, slot_id, member_id, status, created_at
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Ovaj termin nije moguće ponovo rezervisati" },
        { status: 409 },
      );
    }

    await sendPushToAdmins({
      title: "Novi zahtev za individualni trening",
      body: `${member.first_name} ${member.last_name} traži termin ${formatTrainingDate(slotResult[0].starts_at)}.`,
      url: "/admin/individualni-treninzi",
      tag: `individual-request-${result[0].id}`,
    });

    return NextResponse.json(
      {
        booking: result[0],
        message: "Zahtev je poslat i čeka odobrenje trenera.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[GARD018] Individual booking creation failed:", error);
    return NextResponse.json(
      { error: "Greška pri rezervaciji termina" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json(
      { error: "Morate biti prijavljeni" },
      { status: 401 },
    );

  try {
    const { bookingId } = await request.json();
    const id = Number(bookingId);
    if (!Number.isInteger(id))
      return NextResponse.json(
        { error: "Nevažeća rezervacija" },
        { status: 400 },
      );

    const result = await sql`
      UPDATE individual_training_bookings b
      SET status = 'cancelled'
      FROM members m, individual_training_slots s
      WHERE b.id = ${id}
        AND b.member_id = m.id
        AND s.id = b.slot_id
        AND m.email = ${user.email}
        AND b.status IN ('pending', 'booked')
        AND s.starts_at >= ((CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Belgrade')::date + INTERVAL '1 day')
      RETURNING b.id
    `;

    if (result.length === 0)
      return NextResponse.json(
        { error: "Otkazivanje nije moguće posle ponoći dana pre treninga." },
        { status: 409 },
      );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[GARD018] Individual booking cancellation failed:", error);
    return NextResponse.json(
      { error: "Greška pri otkazivanju rezervacije" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await checkAdminAuth();
  if (!auth.isAdmin) {
    return NextResponse.json(
      { error: auth.error || "Nemate pristup" },
      { status: auth.isAuthenticated ? 403 : 401 },
    );
  }

  try {
    const body = await request.json();
    const bookingId = Number(body.bookingId);
    const action = body.action;

    if (!Number.isInteger(bookingId) || !["approve", "reject", "cancel"].includes(action)) {
      return NextResponse.json(
        { error: "Nevažeći zahtev za rezervaciju" },
        { status: 400 },
      );
    }

    const nextStatus = action === "approve" ? "booked" : action === "cancel" ? "cancelled" : "rejected";
    const expectedStatus = action === "cancel" ? "booked" : "pending";
    const result = await sql`
      UPDATE individual_training_bookings b
      SET
        status = ${nextStatus},
        reviewed_at = CURRENT_TIMESTAMP,
        reviewed_by = ${auth.email}
      FROM members m, individual_training_slots s
      WHERE b.id = ${bookingId}
        AND b.status = ${expectedStatus}
        AND b.member_id = m.id
        AND b.slot_id = s.id
      RETURNING b.id, b.slot_id, b.member_id, b.status, b.reviewed_at,
        m.email, m.first_name, m.last_name, s.starts_at
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Zahtev je već obrađen ili ne postoji" },
        { status: 409 },
      );
    }

    await sendPushToMember(result[0].email, {
      title:
        action === "approve"
          ? "Admin je potvrdio individualni trening"
          : action === "cancel"
            ? "Admin je otkazao individualni trening"
            : "Admin nije prihvatio zahtev za trening",
      body:
        action === "approve"
          ? `Admin je potvrdio vaš termin ${formatTrainingDate(result[0].starts_at)}.`
          : action === "cancel"
            ? `Admin je otkazao vaš termin ${formatTrainingDate(result[0].starts_at)}. Kontaktirajte klub za dogovor.`
            : `Admin nije prihvatio vaš zahtev za termin ${formatTrainingDate(result[0].starts_at)}. Možete izabrati drugi termin.`,
      url: "/individualni-treninzi",
      tag: `individual-review-${result[0].id}`,
    });

    return NextResponse.json({ booking: result[0] });
  } catch (error) {
    console.error("[GARD018] Individual booking review failed:", error);
    return NextResponse.json(
      { error: "Greška pri obradi zahteva" },
      { status: 500 },
    );
  }
}
