import { checkAdminAuth } from "@/lib/auth-helpers"
import { NextResponse } from "next/server"
import { sql } from "@/lib/db-singleton"
import { isProtectedAdmin } from "@/lib/admin-constants"

export async function GET() {
  try {
    const auth = await checkAdminAuth()
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error || "Nemate pristup" }, { status: auth.isAuthenticated ? 403 : 401 })
    }

    const admins = await sql`SELECT * FROM admins ORDER BY created_at DESC`
    return NextResponse.json({ admins })
  } catch (error) {
    console.error("Error fetching admins:", error)
    return NextResponse.json({ error: "Failed to fetch admins" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await checkAdminAuth()
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error || "Nemate pristup" }, { status: auth.isAuthenticated ? 403 : 401 })
    }

    const { email, grantedBy } = await request.json()

    if (!email || !grantedBy) {
      return NextResponse.json({ error: "Email and grantedBy are required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO admins (email, granted_by)
      VALUES (${email}, ${grantedBy})
      ON CONFLICT (email) DO NOTHING
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Admin already exists" }, { status: 409 })
    }

    return NextResponse.json({ admin: result[0] })
  } catch (error) {
    console.error("Error adding admin:", error)
    return NextResponse.json({ error: "Failed to add admin" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await checkAdminAuth()
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error || "Nemate pristup" }, { status: auth.isAuthenticated ? 403 : 401 })
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    if (isProtectedAdmin(String(email))) {
      return NextResponse.json({ error: "Ovaj admin je zaštićen i ne može biti obrisan." }, { status: 403 })
    }

    await sql`DELETE FROM admins WHERE email = ${email}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing admin:", error)
    return NextResponse.json({ error: "Failed to remove admin" }, { status: 500 })
  }
}
