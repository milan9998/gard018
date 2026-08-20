import { NextResponse } from "next/server"
import { Resend } from "resend"
import crypto from "crypto"
import bcrypt from "bcryptjs"
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { sql } from "@/lib/db-singleton"
import { getPublicBaseUrl } from "@/lib/public-url"
import { OperationTimeoutError, withTimeout } from "@/lib/async-utils"

const forgotPasswordLimiter = rateLimit({
  limit: 3,
  windowMs: 15 * 60 * 1000,
})

async function hashToken(token: string): Promise<string> {
  return await bcrypt.hash(token, 10)
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
    const rateLimitResult = await forgotPasswordLimiter(ip)

    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult.reset)
    }

    const body = await req.json()
    let { email } = body

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email je obavezan" }, { status: 400 })
    }

    email = email.toLowerCase().trim()

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Nevažeći email format" }, { status: 400 })
    }

    const users = await sql`
      SELECT id, email, first_name, last_name 
      FROM users 
      WHERE email = ${email}
    `

    if (users.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Ako email postoji u našem sistemu, poslaćemo vam link za resetovanje",
      })
    }

    const user = users[0]

    const resetToken = crypto.randomBytes(32).toString("hex")
    const hashedToken = await hashToken(resetToken)
    await sql`
      UPDATE users 
      SET 
        reset_token = ${hashedToken},
        reset_token_expiry = CURRENT_TIMESTAMP + INTERVAL '1 hour'
      WHERE id = ${user.id}
    `

    const apiKey = process.env.RESEND_API_KEY

    if (!apiKey || !apiKey.startsWith("re_")) {
      console.error("[GARD018] Resend API key not configured properly")
      return NextResponse.json(
        { error: "Email servis nije konfigurisan. Kontaktirajte administratora." },
        { status: 500 },
      )
    }

    const resend = new Resend(apiKey)

    const baseUrl = getPublicBaseUrl(req)
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`

    const emailResult = await withTimeout(resend.emails.send({
      from: "GARD 018 <info@gard018.com>",
      to: email,
      subject: "Resetovanje lozinke - GARD 018",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #DC2626 0%, #991B1B 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; padding: 15px 30px; background: #DC2626; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🥊 GARD 018</h1>
                <p>Boks i Kikboks Klub</p>
              </div>
              <div class="content">
                <h2>Zdravo ${user.first_name}!</h2>
                <p>Primili smo zahtev za resetovanje vaše lozinke.</p>
                <p>Kliknite na dugme ispod da biste kreirali novu lozinku:</p>
                <center>
                  <a href="${resetUrl}" class="button">Resetuj lozinku</a>
                </center>
                <p><strong>Link je važeći 1 sat.</strong></p>
                <p>Ako niste vi zatražili resetovanje lozinke, ignorišite ovaj email.</p>
                <p style="font-size: 12px; color: #666; margin-top: 30px;">
                  Ako dugme ne radi, kopirajte sledeći link u pretraživač:<br>
                  <code style="background: #e0e0e0; padding: 5px 10px; border-radius: 3px; word-break: break-all;">${resetUrl}</code>
                </p>
              </div>
              <div class="footer">
                <p>© 2025 GARD 018 Boks i Kikboks Klub. Sva prava zadržana.</p>
                <p>Kontakt: info@gard018.com | +381 62 202 420</p>
              </div>
            </div>
          </body>
        </html>
      `,
    }), 15_000, "Resend nije odgovorio u predviđenom roku")

    if (emailResult.error) {
      console.error("[GARD018] Email sending failed:", emailResult.error.message)
      return NextResponse.json({ error: "Greška pri slanju email-a. Pokušajte ponovo." }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Link za resetovanje lozinke je poslat na vašu email adresu",
    })
  } catch (error) {
    if (error instanceof OperationTimeoutError) {
      return NextResponse.json(
        { error: "Email servis trenutno ne odgovara. Pokušajte ponovo za nekoliko sekundi." },
        { status: 504 },
      )
    }
    console.error("[GARD018] Unexpected error in forgot-password:", error)
    return NextResponse.json({ error: "Neočekivana greška na serveru" }, { status: 500 })
  }
}
