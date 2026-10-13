import { NextResponse } from "next/server"
import { checkAdminAuth } from "@/lib/auth-helpers"
import { sql } from "@/lib/db-singleton"

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkAdminAuth()
  if (!auth.isAdmin) return NextResponse.json({ error: auth.error || "Nemate pristup" }, { status: auth.isAuthenticated ? 403 : 401 })
  const id = Number((await params).id)
  if (!Number.isSafeInteger(id) || id <= 0) return NextResponse.json({ error: "Nevažeći član" }, { status: 400 })
  try {
    const rows = await sql`
      WITH member AS (SELECT id FROM members WHERE id = ${id} FOR UPDATE), settled AS (
        UPDATE training_attendances SET settled_at = CURRENT_TIMESTAMP
        WHERE member_id = ${id} AND was_overdue AND settled_at IS NULL
          AND EXISTS (SELECT 1 FROM member)
        RETURNING id
      )
      SELECT EXISTS (SELECT 1 FROM member) AS found, (SELECT COUNT(*) FROM settled) AS settled_count
    `
    if (!rows[0].found) return NextResponse.json({ error: "Član nije pronađen" }, { status: 404 })
    return NextResponse.json({ success: true, message: "Dugovanje je izmireno. Datumi članarine su sačuvani." })
  } catch (error) {
    console.error("[GARD018] Settle debt failed:", error)
    return NextResponse.json({ error: "Greška pri izmirivanju dugovanja" }, { status: 500 })
  }
}
