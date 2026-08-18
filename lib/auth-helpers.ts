import { sql } from "@/lib/db-singleton" // Use singleton DB connection
import { getSession } from "@/lib/session"

export async function checkAdminAuth(): Promise<{
  isAuthenticated: boolean
  isAdmin: boolean
  email: string | null
  error?: string
}> {
  try {
    const session = await getSession()

    if (!session) {
      return {
        isAuthenticated: false,
        isAdmin: false,
        email: null,
        error: "Niste prijavljeni",
      }
    }

    const userEmail = session.user?.email

    if (!userEmail) {
      return {
        isAuthenticated: false,
        isAdmin: false,
        email: null,
        error: "Nevažeća sesija",
      }
    }

    const adminCheck = await sql`
      SELECT id FROM admins WHERE email = ${userEmail}
    `

    if (adminCheck.length === 0) {
      return {
        isAuthenticated: true,
        isAdmin: false,
        email: userEmail,
        error: "Nemate admin privilegije",
      }
    }

    return {
      isAuthenticated: true,
      isAdmin: true,
      email: userEmail,
    }
  } catch (error) {
    console.error("[v0] Auth check error:", error)
    return {
      isAuthenticated: false,
      isAdmin: false,
      email: null,
      error: "Greška pri proveri autentifikacije",
    }
  }
}
