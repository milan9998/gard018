import { NextResponse } from "next/server"
import { sql } from "@/lib/db-singleton"
import { hashPasswordBcrypt, verifyPassword } from "@/lib/password-utils"
import { getSession, setSession } from "@/lib/session"

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Niste prijavljeni" }, { status: 401 })

    const email = session.user.email
    if (!email) return NextResponse.json({ error: "Nevažeća sesija" }, { status: 401 })

    const body = await request.json()
    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : ""
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : ""
    const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : ""

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: "Trenutna i nova lozinka su obavezne" }, { status: 400 })
    }
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "Lozinke se ne poklapaju" }, { status: 400 })
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Nova lozinka mora imati najmanje 8 karaktera" }, { status: 400 })
    }
    if (currentPassword === newPassword) {
      return NextResponse.json({ error: "Nova lozinka mora biti drugačija" }, { status: 400 })
    }

    const users = await sql`
      SELECT id, password_hash, password_hash_type
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `
    if (users.length === 0) return NextResponse.json({ error: "Korisnik nije pronađen" }, { status: 404 })

    const valid = await verifyPassword(currentPassword, users[0].password_hash, users[0].password_hash_type)
    if (!valid) return NextResponse.json({ error: "Trenutna lozinka nije ispravna" }, { status: 400 })

    const newHash = await hashPasswordBcrypt(newPassword)
    await sql`
      UPDATE users
      SET password_hash = ${newHash},
          password_hash_type = 'bcrypt',
          must_change_password = FALSE,
          password_changed_at = CURRENT_TIMESTAMP
      WHERE id = ${users[0].id}
    `

    const updatedSession = {
      user: {
        ...session.user,
        email,
        mustChangePassword: false,
      },
    }

    await setSession(updatedSession)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[GARD018] Password change failed:", error)
    return NextResponse.json({ error: "Greška pri promeni lozinke" }, { status: 500 })
  }
}
