import { NextResponse } from "next/server"

import { checkAdminAuth } from "@/lib/auth-helpers"
import { sql } from "@/lib/db-singleton"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkAdminAuth()
  if (!auth.isAdmin) {
    return NextResponse.json({ error: auth.error || "Nemate pristup" }, { status: auth.isAuthenticated ? 403 : 401 })
  }

  const memberId = Number((await params).id)
  if (!Number.isSafeInteger(memberId) || memberId <= 0) {
    return NextResponse.json({ error: "Nevažeći ID člana" }, { status: 400 })
  }

  try {
    const members = await sql`
      SELECT id, first_name, last_name, email, start_date, expiry_date
      FROM members WHERE id = ${memberId} LIMIT 1
    `
    if (!members.length) return NextResponse.json({ error: "Član nije pronađen" }, { status: 404 })

    const months = await sql`
      SELECT TO_CHAR(attended_on, 'YYYY-MM') AS month,
             COUNT(*)::int AS training_count,
             COUNT(*) FILTER (WHERE was_overdue)::int AS overdue_count
      FROM training_attendances
      WHERE member_id = ${memberId}
      GROUP BY TO_CHAR(attended_on, 'YYYY-MM')
      ORDER BY month DESC
    `
    return NextResponse.json({ member: members[0], months }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("[GARD018] Monthly training counts failed:", error)
    return NextResponse.json({ error: "Pregled treninga nije dostupan" }, { status: 500 })
  }
}
