import { NextResponse } from "next/server"
import { sql } from "@/lib/db-singleton" // Use singleton DB connection
import bcrypt from "bcryptjs"
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { belgradeDateToday } from "@/lib/membership-status"
import { createEmailVerification, sendEmailVerification } from "@/lib/email-verification"

const registerLimiter = rateLimit({
  limit: 3,
  windowMs: 60 * 60 * 1000,
})

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove < and > characters
    .slice(0, 255) // Limit length
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const rateLimitResult = await registerLimiter(ip)

    if (!rateLimitResult.success) {
      console.log("[v0] Registration rate limit exceeded for IP:", ip)
      return rateLimitResponse(rateLimitResult.reset)
    }

    const body = await request.json()
    const { email, password, firstName, lastName } = body

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: "Sva polja su obavezna" }, { status: 400 })
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Nevažeća email adresa" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Lozinka mora imati najmanje 8 karaktera" }, { status: 400 })
    }

    const sanitizedEmail = sanitizeInput(email.toLowerCase())
    const sanitizedFirstName = sanitizeInput(firstName)
    const sanitizedLastName = sanitizeInput(lastName)

    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${sanitizedEmail}
    `

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "Korisnik sa ovom email adresom već postoji" }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const verification = createEmailVerification()

    const existingMember = await sql`
      SELECT id FROM members WHERE email = ${sanitizedEmail} LIMIT 1
    `

    const result = await sql`
      INSERT INTO users (
        email, password_hash, first_name, last_name, password_hash_type,
        email_verified_at, email_verification_token_hash, email_verification_expires_at
      )
      VALUES (
        ${sanitizedEmail}, ${passwordHash}, ${sanitizedFirstName}, ${sanitizedLastName}, 'bcrypt',
        NULL, ${verification.tokenHash}, ${verification.expiresAt.toISOString()}
      )
      RETURNING id, email, first_name, last_name
    `

    const newUser = result[0]

    if (existingMember.length === 0) {
      const startDate = belgradeDateToday()
      try {
        await sql`
          INSERT INTO members (
            first_name, last_name, email, start_date, expiry_date,
            membership_type, status, membership_configured,
            individual_training_paid, qr_code_id
          )
          VALUES (
            ${sanitizedFirstName}, ${sanitizedLastName}, ${sanitizedEmail}, ${startDate}, ${startDate},
            'MANUAL', 'active', FALSE, FALSE, gen_random_uuid()
          )
        `
      } catch (memberError) {
        await sql`DELETE FROM users WHERE id = ${newUser.id}`
        throw memberError
      }
    }

    try {
      await sendEmailVerification({ email: sanitizedEmail, firstName: sanitizedFirstName, token: verification.token })
    } catch (emailError) {
      if (existingMember.length === 0) await sql`DELETE FROM members WHERE email = ${sanitizedEmail}`
      await sql`DELETE FROM users WHERE id = ${newUser.id}`
      console.error("[GARD018] Verification email failed:", emailError)
      return NextResponse.json(
        { error: "Verifikacioni email nije poslat. Proverite adresu i pokušajte ponovo." },
        { status: 502 },
      )
    }

    console.log("[GARD018] User registered, verification required:", sanitizedEmail)

    return NextResponse.json({
      success: true,
      userId: newUser.id,
      membershipCreated: existingMember.length === 0,
      requiresEmailVerification: true,
      message: "Poslali smo vam email sa dugmetom za potvrdu naloga.",
    })
  } catch (error) {
    console.error("[v0] Registration error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: "Greška pri registraciji. Molimo pokušajte ponovo." }, { status: 500 })
  }
}
