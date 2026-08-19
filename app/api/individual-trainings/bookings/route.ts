import { NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/auth-helpers";
import { sql } from "@/lib/db-singleton";
import { getSessionUser } from "@/lib/session-helpers";
import { belgradeDateToday } from "@/lib/membership-status";
import { isDateWithinInclusivePeriod } from "@/lib/individual-training-access";

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
      WHERE b.status = 'booked'
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
      SELECT id, individual_training_paid, individual_start_date, individual_expiry_date
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
      SELECT id FROM individual_training_bookings
      WHERE slot_id = ${slotId} AND member_id = ${member.id} AND status = 'booked'
      LIMIT 1
    `;
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Već ste rezervisali ovaj termin" },
        { status: 409 },
      );
    }

    const result = await sql`
      INSERT INTO individual_training_bookings (slot_id, member_id)
      VALUES (${slotId}, ${member.id})
      ON CONFLICT (slot_id, member_id)
      DO UPDATE SET
        status = 'booked',
        created_at = CURRENT_TIMESTAMP
      WHERE individual_training_bookings.status = 'cancelled'
      RETURNING id, slot_id, member_id, status, created_at
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Ovaj termin nije moguće ponovo rezervisati" },
        { status: 409 },
      );
    }

    return NextResponse.json({ booking: result[0] }, { status: 201 });
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
      FROM members m
      WHERE b.id = ${id} AND b.member_id = m.id AND m.email = ${user.email} AND b.status = 'booked'
      RETURNING b.id
    `;

    if (result.length === 0)
      return NextResponse.json(
        { error: "Rezervacija nije pronađena" },
        { status: 404 },
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
