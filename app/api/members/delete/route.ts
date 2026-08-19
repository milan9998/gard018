import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db-singleton"
import { checkAdminAuth } from "@/lib/auth-helpers"
import { isProtectedAdmin } from "@/lib/admin-constants"

export async function DELETE(request: NextRequest) {
  try {
    const auth = await checkAdminAuth()
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error || "Nemate admin privilegije" }, { status: auth.isAuthenticated ? 403 : 401 })
    }

    // Get member ID from request
    const { memberId } = await request.json()

    if (!memberId) {
      return NextResponse.json({ error: "ID člana je obavezan" }, { status: 400 })
    }

    const member = await sql`
      SELECT email FROM members WHERE id = ${memberId} LIMIT 1
    `

    if (member.length === 0) {
      return NextResponse.json({ error: "Član nije pronađen" }, { status: 404 })
    }

    if (isProtectedAdmin(String(member[0].email))) {
      return NextResponse.json(
        { error: "Ovaj nalog je zaštićen trener i ne može biti obrisan" },
        { status: 403 },
      )
    }

    // A self-registered member has two records: one in `members` and one in
    // `users`. Remove the login record as well, otherwise the deleted email
    // remains blocked from registering again. These tables are intentionally
    // not linked by a foreign key, so both deletes must be explicit. A single
    // data-modifying statement keeps the cleanup atomic.
    await sql.query(
      `WITH deleted_member AS (
         DELETE FROM members
         WHERE id = $1
         RETURNING email
       ), deleted_tokens AS (
         DELETE FROM password_reset_tokens
         WHERE LOWER(email) = LOWER((SELECT email FROM deleted_member))
       ), deleted_user AS (
         DELETE FROM users
         WHERE LOWER(email) = LOWER((SELECT email FROM deleted_member))
       )
       SELECT 1`,
      [memberId],
    )

    return NextResponse.json({ success: true, message: "Član uspešno obrisan" })
  } catch (error) {
    console.error("[v0] Error deleting member:", error)
    return NextResponse.json({ error: "Greška pri brisanju člana" }, { status: 500 })
  }
}
