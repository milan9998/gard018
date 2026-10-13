import { NextResponse } from "next/server"

import { checkAdminAuth } from "@/lib/auth-helpers"
import { sql } from "@/lib/db-singleton"
import { verifyMemberQrValue } from "@/lib/member-qr"
import { belgradeDateToday, getMembershipAccess } from "@/lib/membership-status"

export async function POST(request: Request) {
  const auth = await checkAdminAuth()
  if (!auth.isAdmin) {
    return NextResponse.json({ error: auth.error || "Nemate pristup" }, { status: auth.isAuthenticated ? 403 : 401 })
  }

  try {
    const body = await request.json()
    const qrCodeId = verifyMemberQrValue(body.code)

    if (!qrCodeId) {
      return NextResponse.json(
        { allowed: false, reason: "invalid_qr", message: "QR kod nije važeći" },
        { status: 400 },
      )
    }

    const members = await sql`
      SELECT id, first_name, last_name, email, expiry_date, membership_configured,
             EXISTS (SELECT 1 FROM training_attendances t WHERE t.member_id = members.id
                     AND t.was_overdue AND t.settled_at IS NULL) AS has_debt
      FROM members
      WHERE qr_code_id = ${qrCodeId}
      LIMIT 1
    `

    if (members.length === 0) {
      return NextResponse.json(
        { allowed: false, reason: "member_not_found", message: "Član nije pronađen" },
        { status: 404 },
      )
    }

    const member = members[0]
    const periodAccess = member.membership_configured
      ? getMembershipAccess(member.expiry_date)
      : { expiryDate: null, allowed: false }
    const access = { ...periodAccess, allowed: periodAccess.allowed && !member.has_debt }
    const result = member.has_debt ? "debt" : !member.membership_configured
      ? "membership_not_configured"
      : access.allowed
        ? "active"
        : "expired"
    const checkInExpiryDate = access.expiryDate ?? member.expiry_date
    const checkInResult = access.allowed ? "active" : "expired"

    const today = belgradeDateToday()
    const checkIns = await sql`
      WITH check_in AS (
        INSERT INTO training_check_ins (member_id, scanned_by, allowed, result, membership_expiry)
        VALUES (${member.id}, ${auth.email}, ${access.allowed}, ${checkInResult}, ${checkInExpiryDate})
        RETURNING id, scanned_at
      ), existing_attendance AS (
        SELECT id FROM training_attendances
        WHERE member_id = ${member.id} AND attended_on = ${today}
      ), attendance AS (
        INSERT INTO training_attendances
          (member_id, attended_on, was_overdue, source_check_in_id, approved_by)
        SELECT ${member.id}, ${today}, FALSE, check_in.id, ${auth.email}
        FROM check_in
        WHERE ${access.allowed}
        ON CONFLICT (member_id, attended_on) DO NOTHING
        RETURNING id
      )
      SELECT check_in.id, check_in.scanned_at,
             EXISTS (SELECT 1 FROM attendance) AS attendance_recorded,
             EXISTS (SELECT 1 FROM existing_attendance) AS already_recorded
      FROM check_in
    `

    return NextResponse.json({
      allowed: access.allowed,
      reason: result,
      message: member.has_debt ? "Član ima dugovanje" : !member.membership_configured
        ? "Članarina još nije podešena"
        : access.allowed
          ? "Član može da trenira"
          : "Članarina je istekla",
      checkInId: checkIns[0].id,
      checkedAt: checkIns[0].scanned_at,
      attendanceRecorded: checkIns[0].attendance_recorded,
      alreadyRecorded: checkIns[0].already_recorded || (access.allowed && !checkIns[0].attendance_recorded),
      member: {
        id: member.id,
        firstName: member.first_name,
        lastName: member.last_name,
        email: member.email,
        expiryDate: access.expiryDate,
        membershipConfigured: Boolean(member.membership_configured),
        hasDebt: Boolean(member.has_debt),
      },
    })
  } catch (error) {
    console.error("[GARD018] QR scan failed:", error)
    return NextResponse.json(
      { allowed: false, reason: "server_error", message: "Provera trenutno nije moguća" },
      { status: 500 },
    )
  }
}
