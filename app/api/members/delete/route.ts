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

    const memberEmail = String(member[0].email).trim().toLowerCase()

    // A self-registered member has two records: one in `members` and one in
    // `users`. Remove the login record as well, otherwise the deleted email
    // remains blocked from registering again. These tables are intentionally
    // not linked by a foreign key, so both deletes must be explicit.
    await sql`
      DELETE FROM password_reset_tokens
      WHERE LOWER(email) = ${memberEmail}
    `

    await sql`
      DELETE FROM users
      WHERE LOWER(email) = ${memberEmail}
    `

    await sql`
      DELETE FROM members WHERE id = ${memberId}
    `

    return NextResponse.json({ success: true, message: "Član uspešno obrisan" })
  } catch (error) {
    console.error("[v0] Error deleting member:", error)
    return NextResponse.json({ error: "Greška pri brisanju člana" }, { status: 500 })
  }
}
