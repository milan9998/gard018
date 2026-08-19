import { NextResponse } from "next/server"

import { checkAdminAuth } from "@/lib/auth-helpers"
import { sql } from "@/lib/db-singleton"
import { verifyMemberQrValue } from "@/lib/member-qr"
import { getMembershipAccess } from "@/lib/membership-status"

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
      SELECT id, first_name, last_name, email, expiry_date, membership_configured
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
    const access = member.membership_configured
      ? getMembershipAccess(member.expiry_date)
      : { expiryDate: null, allowed: false }
    const result = !member.membership_configured
      ? "membership_not_configured"
      : access.allowed
        ? "active"
        : "expired"
    const checkInExpiryDate = access.expiryDate ?? member.expiry_date
    const checkInResult = access.allowed ? "active" : "expired"

    const checkIns = await sql`
      INSERT INTO training_check_ins (member_id, scanned_by, allowed, result, membership_expiry)
      VALUES (${member.id}, ${auth.email}, ${access.allowed}, ${checkInResult}, ${checkInExpiryDate})
      RETURNING id, scanned_at
    `

    return NextResponse.json({
      allowed: access.allowed,
      reason: result,
      message: !member.membership_configured
        ? "Članarina još nije podešena"
        : access.allowed
          ? "Član može da trenira"
          : "Članarina je istekla",
      checkInId: checkIns[0].id,
      checkedAt: checkIns[0].scanned_at,
      member: {
        id: member.id,
        firstName: member.first_name,
        lastName: member.last_name,
        email: member.email,
        expiryDate: access.expiryDate,
        membershipConfigured: Boolean(member.membership_configured),
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
