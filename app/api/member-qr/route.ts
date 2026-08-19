import { NextResponse } from "next/server"

import { sql } from "@/lib/db-singleton"
import { createMemberQrValue } from "@/lib/member-qr"
import { getMembershipAccess } from "@/lib/membership-status"
import { getSessionUser } from "@/lib/session-helpers"

export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Morate biti prijavljeni" }, { status: 401 })

  try {
    const members = await sql`
      SELECT id, first_name, last_name, email, expiry_date, membership_configured, qr_code_id
      FROM members
      WHERE email = ${user.email}
      LIMIT 1
    `

    if (members.length === 0) {
      return NextResponse.json({ error: "Nalog nije povezan sa članom kluba" }, { status: 404 })
    }

    const member = members[0]
    const access = member.membership_configured
      ? getMembershipAccess(member.expiry_date)
      : { expiryDate: null, allowed: false }

    return NextResponse.json({
      qrValue: createMemberQrValue(String(member.qr_code_id)),
      member: {
        id: member.id,
        firstName: member.first_name,
        lastName: member.last_name,
        expiryDate: access.expiryDate,
        allowed: access.allowed,
        membershipConfigured: Boolean(member.membership_configured),
      },
    })
  } catch (error) {
    console.error("[GARD018] Member QR fetch failed:", error)
    return NextResponse.json({ error: "Greška pri učitavanju QR koda" }, { status: 500 })
  }
}
