import { NextResponse } from "next/server"
import { checkAdminAuth } from "@/lib/auth-helpers"
import { sql } from "@/lib/db-singleton"
import { belgradeDateToday } from "@/lib/membership-status"

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkAdminAuth()
  if (!auth.isAdmin) {
    return NextResponse.json({ error: auth.error || "Nemate pristup" }, { status: auth.isAuthenticated ? 403 : 401 })
  }

  const memberId = Number((await params).id)
  if (!Number.isSafeInteger(memberId) || memberId <= 0) {
    return NextResponse.json({ error: "Nevažeći ID člana" }, { status: 400 })
  }

  try {
    const today = belgradeDateToday()
    const result = await sql`
      WITH pending AS (
        SELECT MIN(attended_on) AS first_date
        FROM training_attendances
        WHERE member_id = ${memberId} AND was_overdue AND settled_at IS NULL
      ), dates AS (
        SELECT m.id, pending.first_date,
               COALESCE(pending.first_date, GREATEST(m.expiry_date, ${today}::date)) AS base_date
        FROM members m CROSS JOIN pending
        WHERE m.id = ${memberId}
      ), updated AS (
        UPDATE members m
        SET start_date = COALESCE(dates.first_date, m.start_date),
            expiry_date = (dates.base_date + INTERVAL '1 month')::date,
            membership_configured = TRUE,
            status = CASE WHEN (dates.base_date + INTERVAL '1 month')::date >= ${today}::date
                          THEN 'active' ELSE 'expired' END,
            updated_at = CURRENT_TIMESTAMP
        FROM dates
        WHERE m.id = dates.id
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
    `

    if (!result.length) return NextResponse.json({ error: "Član nije pronađen" }, { status: 404 })
    const member = result[0]
    return NextResponse.json({
      success: true,
      expiry_date: member.expiry_date,
      member,
      message: member.settled_overdue_count > 0
        ? `Članarina važi od ${String(member.start_date).split("-").reverse().join(".")} do ${String(member.expiry_date).split("-").reverse().join(".")}.`
        : `Članarina je produžena do ${String(member.expiry_date).split("-").reverse().join(".")}.`,
    })
  } catch (error) {
    console.error("[GARD018] Membership extension failed:", error)
    return NextResponse.json({ error: "Greška pri produženju članarine" }, { status: 500 })
  }
}
