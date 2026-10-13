import { NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/auth-helpers";
import { belgradeDateToday, isValidDateOnly } from "@/lib/membership-status";
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
    const memberId = Number((await params).id);
    const body = await request.json().catch(() => ({}));
    const paidDate = typeof body.paid_date === "string" ? body.paid_date : "";

    if (
      !Number.isSafeInteger(memberId) || memberId <= 0 ||
      !isValidDateOnly(paidDate)
    ) {
      return NextResponse.json(
        { error: "Izaberite ispravan datum uplate" },
        { status: 400 },
      );
    }

    const today = belgradeDateToday();
    const result = await sql`
      WITH pending AS (
        SELECT MIN(attended_on) AS first_date
        FROM training_attendances
        WHERE member_id = ${memberId} AND was_overdue AND settled_at IS NULL
      ), dates AS (
        SELECT COALESCE(first_date, ${paidDate}::date) AS start_date FROM pending
      ), updated AS (
        UPDATE members m
        SET start_date = dates.start_date,
            expiry_date = (dates.start_date + INTERVAL '1 month')::date,
            membership_configured = TRUE,
            status = CASE WHEN (dates.start_date + INTERVAL '1 month')::date >= ${today}::date
                          THEN 'active' ELSE 'expired' END,
            updated_at = CURRENT_TIMESTAMP
        FROM dates
        WHERE m.id = ${memberId}
        RETURNING m.id, m.first_name, m.last_name, m.email, m.start_date, m.expiry_date, m.status
      ), settled AS (
        UPDATE training_attendances
        SET settled_at = CURRENT_TIMESTAMP
        WHERE member_id = ${memberId} AND was_overdue AND settled_at IS NULL
          AND attended_on <= (SELECT expiry_date FROM updated)
        RETURNING id
      )
      SELECT updated.*, (SELECT COUNT(*)::int FROM settled) AS settled_overdue_count
      FROM updated
    `;

    if (result.length === 0)
      return NextResponse.json(
        { error: "Član nije pronađen" },
        { status: 404 },
      );

    return NextResponse.json({
      success: true,
      member: result[0],
      message: `Članarina važi od ${String(result[0].start_date).split("-").reverse().join(".")} do ${String(result[0].expiry_date).split("-").reverse().join(".")}.`,
    });
  } catch (error) {
    console.error("[GARD018] Membership renewal failed:", error);
    return NextResponse.json(
      { error: "Greška pri obnovi članarine" },
      { status: 500 },
    );
  }
}
