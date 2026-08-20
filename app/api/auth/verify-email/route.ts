import { NextResponse } from "next/server"

import { sql } from "@/lib/db-singleton"
import { hashEmailVerificationToken } from "@/lib/email-verification"
import { getPublicBaseUrl } from "@/lib/public-url"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get("token")?.trim()
  const baseUrl = getPublicBaseUrl(request)

  if (!token) return NextResponse.redirect(`${baseUrl}/prijava?verification=invalid`)

  try {
    const tokenHash = hashEmailVerificationToken(token)
    const users = await sql`
      SELECT id
      FROM users
      WHERE email_verification_token_hash = ${tokenHash}
        AND email_verified_at IS NULL
        AND email_verification_expires_at > CURRENT_TIMESTAMP
      LIMIT 1
    `

    if (users.length === 0) return NextResponse.redirect(`${baseUrl}/prijava?verification=invalid`)

    await sql`
      UPDATE users
      SET email_verified_at = CURRENT_TIMESTAMP,
          email_verification_token_hash = NULL,
          email_verification_expires_at = NULL
      WHERE id = ${users[0].id}
    `

    return NextResponse.redirect(`${baseUrl}/prijava?verified=1`)
  } catch (error) {
    console.error("[GARD018] Email verification failed:", error)
    return NextResponse.redirect(`${baseUrl}/prijava?verification=error`)
  }
}
