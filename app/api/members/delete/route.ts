import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db-singleton"
import { checkAdminAuth } from "@/lib/auth-helpers"

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

    // Delete member
    await sql`
      DELETE FROM members WHERE id = ${memberId}
    `

    return NextResponse.json({ success: true, message: "Član uspešno obrisan" })
  } catch (error) {
    console.error("[v0] Error deleting member:", error)
    return NextResponse.json({ error: "Greška pri brisanju člana" }, { status: 500 })
  }
}
