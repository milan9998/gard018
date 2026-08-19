import { NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/auth-helpers";
import { addCalendarMonthToDate } from "@/lib/date-only";
import { isValidDateOnly } from "@/lib/membership-status";
import { sql } from "@/lib/db-singleton";

export async function POST(
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
    const body = await request.json().catch(() => ({}));
    const paidDate = typeof body.paid_date === "string" ? body.paid_date : "";
    const expiryDate = addCalendarMonthToDate(paidDate);

    if (
      !Number.isInteger(memberId) ||
      !isValidDateOnly(paidDate) ||
      !expiryDate
    ) {
      return NextResponse.json(
        { error: "Izaberite ispravan datum uplate" },
        { status: 400 },
      );
    }

    const result = await sql`
        UPDATE members
        SET start_date = ${paidDate},
            expiry_date = ${expiryDate},
            membership_configured = TRUE,
            status = 'active',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${memberId}
      RETURNING id, first_name, last_name, email, start_date, expiry_date, status
    `;

    if (result.length === 0)
      return NextResponse.json(
        { error: "Član nije pronađen" },
        { status: 404 },
      );

    return NextResponse.json({
      success: true,
      member: result[0],
      message: `Članarina važi od ${paidDate.split("-").reverse().join(".")} do ${expiryDate.split("-").reverse().join(".")}.`,
    });
  } catch (error) {
    console.error("[GARD018] Membership renewal failed:", error);
    return NextResponse.json(
      { error: "Greška pri obnovi članarine" },
      { status: 500 },
    );
  }
}
