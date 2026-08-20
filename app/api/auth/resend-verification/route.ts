import { NextResponse } from "next/server"

import { sql } from "@/lib/db-singleton"
import { createEmailVerification, sendEmailVerification } from "@/lib/email-verification"
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit"

const limiter = rateLimit({ limit: 3, windowMs: 15 * 60 * 1000 })

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
  const rateLimitResult = await limiter(ip)
  if (!rateLimitResult.success) return rateLimitResponse(rateLimitResult.reset)

  try {
    const body = await request.json()
    const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : ""
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Unesite ispravnu email adresu" }, { status: 400 })
    }

    const users = await sql`
      SELECT id, email, first_name, email_verified_at
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `

    // Ne otkrivamo da li email postoji u sistemu.
    if (users.length === 0 || users[0].email_verified_at) {
      return NextResponse.json({ success: true, message: "Ako nalog čeka potvrdu, novi email je poslat." })
    }

    const verification = createEmailVerification()
    await sql`
      UPDATE users
      SET email_verification_token_hash = ${verification.tokenHash},
          email_verification_expires_at = ${verification.expiresAt.toISOString()}
      WHERE id = ${users[0].id}
    `

    await sendEmailVerification({ email: users[0].email, firstName: users[0].first_name || "člane", token: verification.token, request })
    return NextResponse.json({ success: true, message: "Novi verifikacioni email je poslat." })
  } catch (error) {
    console.error("[GARD018] Verification resend failed:", error)
    return NextResponse.json({ error: "Email trenutno nije moguće poslati. Pokušajte ponovo." }, { status: 500 })
  }
}
