import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sql } from "@/lib/db-singleton"
import { isProtectedAdmin } from "@/lib/admin-constants"
import { getSession } from "@/lib/session"

export async function POST() {
  try {
    const cookieStore = await cookies()
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const userEmail = session.user.email

    if (!userEmail) {
      return NextResponse.json({ error: "Nevažeća sesija" }, { status: 401 })
    }

    if (isProtectedAdmin(userEmail)) {
      return NextResponse.json({ error: "Trenerov nalog ne može biti obrisan." }, { status: 403 })
    }

    // Delete from members table (email automation)
    await sql`DELETE FROM members WHERE email = ${userEmail}`

    // Delete from admins table if exists
    await sql`DELETE FROM admins WHERE email = ${userEmail}`

    // Delete the login account itself. Without this, the user could still sign
    // in after choosing the permanent account deletion option.
    await sql`DELETE FROM users WHERE email = ${userEmail}`

    // Clear session cookie
    cookieStore.delete("session")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting account:", error)
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
  }
}
