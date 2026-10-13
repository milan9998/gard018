import { NextResponse } from "next/server"

import { checkAdminAuth } from "@/lib/auth-helpers"
import { sql } from "@/lib/db-singleton"
import { belgradeDateToday } from "@/lib/membership-status"

export async function POST(request: Request) {
  const auth = await checkAdminAuth()
  if (!auth.isAdmin) {
    return NextResponse.json({ error: auth.error || "Nemate pristup" }, { status: auth.isAuthenticated ? 403 : 401 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const checkInId = String(body.checkInId ?? "")
    if (!/^\d{1,19}$/.test(checkInId) || BigInt(checkInId) <= BigInt(0) || BigInt(checkInId) > BigInt("9223372036854775807")) {
      return NextResponse.json({ error: "Nevažeća provera QR koda" }, { status: 400 })
    }

    const today = belgradeDateToday()
    const rows = await sql`
      WITH eligible AS (
        SELECT c.member_id, c.id, m.expiry_date, m.membership_configured
        FROM training_check_ins c
        JOIN members m ON m.id = c.member_id
        WHERE c.id = ${checkInId}
          AND c.scanned_by = ${auth.email}
          AND c.allowed = FALSE
          AND c.result = 'expired'
          AND (c.scanned_at AT TIME ZONE 'Europe/Belgrade')::date = ${today}::date
          AND (m.membership_configured = FALSE OR m.expiry_date < ${today}::date
               OR EXISTS (SELECT 1 FROM training_attendances t WHERE t.member_id = m.id
                          AND t.was_overdue AND t.settled_at IS NULL))
        FOR UPDATE OF m
      ), inserted AS (
        INSERT INTO training_attendances
          (member_id, attended_on, was_overdue, source_check_in_id, approved_by)
        SELECT member_id, ${today}, TRUE, id, ${auth.email}
        FROM eligible
        WHERE TRUE
        ON CONFLICT DO NOTHING
        RETURNING id, member_id
      ), extended AS (
        UPDATE members m
        SET start_date = CASE WHEN NOT e.membership_configured OR e.expiry_date < ${today}::date
                              THEN ${today}::date ELSE m.start_date END,
            expiry_date = CASE WHEN NOT e.membership_configured OR e.expiry_date < ${today}::date
                               THEN (${today}::date + INTERVAL '1 month')::date ELSE m.expiry_date END,
            membership_configured = TRUE,
            status = 'active', updated_at = CURRENT_TIMESTAMP
        FROM eligible e
        WHERE m.id = e.member_id AND EXISTS (SELECT 1 FROM inserted i WHERE i.member_id = m.id)
        RETURNING m.expiry_date
      )
      SELECT EXISTS (SELECT 1 FROM eligible) AS eligible,
             EXISTS (SELECT 1 FROM inserted) AS attendance_recorded,
             (SELECT expiry_date FROM extended) AS expiry_date
    `

    if (!rows[0].eligible) {
      return NextResponse.json({ error: "Provera više nije važeća za današnji dan. Skenirajte QR kod ponovo." }, { status: 409 })
    }

    return NextResponse.json({
      attendanceRecorded: rows[0].attendance_recorded,
      alreadyRecorded: !rows[0].attendance_recorded,
      expiryDate: rows[0].expiry_date,
      hasDebt: true,
      message: rows[0].attendance_recorded
        ? "Trening je dozvoljen i evidentiran kao prekoračenje."
        : "Trening je već evidentiran za danas.",
    })
  } catch (error) {
    console.error("[GARD018] Allow overdue training failed:", error)
    return NextResponse.json({ error: "Trening nije evidentiran. Pokušajte ponovo." }, { status: 500 })
  }
}
