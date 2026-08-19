import { NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/auth-helpers";
import { sql } from "@/lib/db-singleton";
import { addCalendarMonthToDate } from "@/lib/date-only";
import { belgradeDateToday, isValidDateOnly } from "@/lib/membership-status";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await checkAdminAuth();
  if (!auth.isAdmin) {
    return NextResponse.json(
      { error: auth.error || "Nemate pristup" },
      { status: auth.isAuthenticated ? 403 : 401 },
    );
  }

  try {
    const memberId = Number.parseInt((await params).id, 10);
    const body = await request.json();

    if (!Number.isInteger(memberId) || typeof body.paid !== "boolean") {
      return NextResponse.json(
        { error: "Nevažeći član ili status uplate" },
        { status: 400 },
      );
    }

    if (!body.paid) {
      const result = await sql`
        UPDATE members
        SET individual_training_paid = FALSE,
            individual_start_date = NULL,
            individual_expiry_date = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${memberId}
        RETURNING id, first_name, last_name, email, individual_training_paid, individual_start_date, individual_expiry_date
      `;

      if (result.length === 0)
        return NextResponse.json(
          { error: "Član nije pronađen" },
          { status: 404 },
        );
      return NextResponse.json({ member: result[0] });
    }

    const startDate =
      typeof body.start_date === "string" && body.start_date
        ? body.start_date
        : belgradeDateToday();
    const expiryDate =
      typeof body.expiry_date === "string" && body.expiry_date
        ? body.expiry_date
        : addCalendarMonthToDate(startDate);

    if (
      !isValidDateOnly(startDate) ||
      !expiryDate ||
      !isValidDateOnly(expiryDate) ||
      expiryDate < startDate
    ) {
      return NextResponse.json(
        { error: "Unesite ispravan period individualnog treninga" },
        { status: 400 },
      );
    }

    const result = await sql`
      UPDATE members
      SET individual_training_paid = TRUE,
          individual_start_date = ${startDate},
          individual_expiry_date = ${expiryDate},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${memberId}
      RETURNING id, first_name, last_name, email, individual_training_paid, individual_start_date, individual_expiry_date
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Član nije pronađen" },
        { status: 404 },
      );
    }

    return NextResponse.json({ member: result[0] });
  } catch (error) {
    console.error("[GARD018] Individual payment update failed:", error);
    return NextResponse.json(
      { error: "Greška pri ažuriranju individualne uplate" },
      { status: 500 },
    );
  }
}
