import { sql } from "@/lib/db-singleton"
import { getSession } from "@/lib/session"

export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return Response.json({ isAdmin: false })
    }

    const userEmail = session.user?.email

    if (!userEmail) {
      return Response.json({ isAdmin: false })
    }

    const result = await sql`SELECT * FROM admins WHERE email = ${userEmail}`

    return Response.json({ isAdmin: result.length > 0 })
  } catch (error) {
    console.error("Error checking admin status:", error)
    return Response.json({ isAdmin: false })
  }
}
