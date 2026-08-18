import { sql } from "@/lib/db-singleton" // Use singleton DB connection
import { NextResponse } from "next/server"
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { checkAdminAuth } from "@/lib/auth-helpers"

const messageLimiter = rateLimit({
  limit: 5,
  windowMs: 60 * 60 * 1000,
})

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, "").slice(0, 1000)
}

function sanitizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null
  return phone
    .trim()
    .replace(/[^\d+\s()-]/g, "")
    .slice(0, 20)
}

export async function GET() {
  try {
    const auth = await checkAdminAuth()
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error || "Nemate pristup" }, { status: auth.isAuthenticated ? 403 : 401 })
    }

    const messages = await sql`SELECT * FROM messages ORDER BY created_at DESC`
    return NextResponse.json({ messages })
  } catch (error) {
    console.error("[v0] Error fetching messages:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const rateLimitResult = await messageLimiter(ip)

    if (!rateLimitResult.success) {
      console.log("[v0] Rate limit exceeded for IP:", ip)
      return rateLimitResponse(rateLimitResult.reset)
    }

    const { name, email, phone, message } = await request.json()

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Ime, email i poruka su obavezni" }, { status: 400 })
    }

    if (typeof name !== "string" || typeof email !== "string" || typeof message !== "string") {
      return NextResponse.json({ error: "Nevažeći tip podataka" }, { status: 400 })
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Nevažeći email format" }, { status: 400 })
    }

    const sanitizedName = sanitizeInput(name)
    const sanitizedEmail = sanitizeInput(email.toLowerCase())
    const sanitizedMessage = sanitizeInput(message)
    const sanitizedPhone = sanitizePhone(phone)

    if (sanitizedName.length < 2 || sanitizedName.length > 100) {
      return NextResponse.json({ error: "Ime mora biti između 2 i 100 karaktera" }, { status: 400 })
    }

    if (sanitizedMessage.length < 10 || sanitizedMessage.length > 1000) {
      return NextResponse.json({ error: "Poruka mora biti između 10 i 1000 karaktera" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO messages (name, email, phone, message)
      VALUES (${sanitizedName}, ${sanitizedEmail}, ${sanitizedPhone}, ${sanitizedMessage})
      RETURNING *
    `

    console.log("[v0] Message created successfully from:", sanitizedEmail)

    return NextResponse.json({ message: result[0] })
  } catch (error) {
    console.error("[v0] Error sending message:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: "Greška pri slanju poruke. Pokušajte ponovo." }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await checkAdminAuth()
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error || "Nemate pristup" }, { status: auth.isAuthenticated ? 403 : 401 })
    }

    const { id, status } = await request.json()

    if (!id || !status) {
      return NextResponse.json({ error: "ID i status su obavezni" }, { status: 400 })
    }

    if (!["read", "unread"].includes(status)) {
      return NextResponse.json({ error: "Nevažeći status" }, { status: 400 })
    }

    await sql`UPDATE messages SET status = ${status} WHERE id = ${id}`

    console.log("[v0] Message status updated:", { id, status })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error updating message:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: "Greška pri ažuriranju poruke" }, { status: 500 })
  }
}
