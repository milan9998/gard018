import { NextResponse } from "next/server"

import { checkAdminAuth } from "@/lib/auth-helpers"
import { sql } from "@/lib/db-singleton"

export async function GET() {
  const auth = await checkAdminAuth()
  if (!auth.isAdmin) {
    return NextResponse.json({ error: auth.error || "Nemate pristup" }, { status: auth.isAuthenticated ? 403 : 401 })
  }

  try {
    const members = await sql`
      SELECT m.id, m.first_name, m.last_name, m.email,
             COUNT(a.id)::int AS training_count,
             COUNT(a.id) FILTER (WHERE a.was_overdue)::int AS overdue_count
      FROM members m
      LEFT JOIN training_attendances a ON a.member_id = m.id
      GROUP BY m.id, m.first_name, m.last_name, m.email
      ORDER BY m.last_name, m.first_name, m.id
    `
    return NextResponse.json({ members }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("[GARD018] Training counts failed:", error)
    return NextResponse.json({ error: "Broj treninga nije dostupan" }, { status: 500 })
  }
}
