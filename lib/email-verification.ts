import { createHash, randomBytes } from "node:crypto"
import { Resend } from "resend"

export const EMAIL_VERIFICATION_HOURS = 24

export function createEmailVerification() {
  const token = randomBytes(32).toString("base64url")
  return {
    token,
    tokenHash: hashEmailVerificationToken(token),
    expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_HOURS * 60 * 60 * 1000),
  }
}

export function hashEmailVerificationToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] || character)
}

export async function sendEmailVerification({ email, firstName, token }: { email: string; firstName: string; token: string }) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || !apiKey.startsWith("re_")) throw new Error("Email servis nije konfigurisan")

  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/+$/, "")
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`
  const safeFirstName = escapeHtml(firstName || "člane")
  const resend = new Resend(apiKey)
  const result = await resend.emails.send({
    from: "GARD 018 <info@gard018.com>",
    to: email,
    subject: "Potvrdite email adresu - GARD 018",
    html: `<!doctype html>
      <html lang="sr">
        <body style="margin:0;background:#080808;color:#f7f7f7;font-family:Arial,sans-serif">
          <div style="max-width:600px;margin:0 auto;padding:32px 16px">
            <div style="border:1px solid #4b1620;border-radius:16px;overflow:hidden;background:#11090b">
              <div style="padding:28px;text-align:center;background:#8f1528">
                <div style="font-size:26px;font-weight:800;letter-spacing:2px">GARD 018</div>
                <div style="margin-top:6px;font-size:14px">Boks · Kik boks · Muay Thai</div>
              </div>
              <div style="padding:32px;text-align:center">
                <h1 style="margin:0 0 16px;font-size:25px">Potvrdite email adresu</h1>
                <p style="margin:0;color:#d7d7d7;line-height:1.6">Zdravo ${safeFirstName}, kliknite na dugme ispod da završite registraciju.</p>
                <a href="${verifyUrl}" style="display:inline-block;margin:28px 0;padding:15px 28px;border-radius:8px;background:#d33b59;color:#fff;text-decoration:none;font-weight:700">Potvrdi email adresu</a>
                <p style="margin:0;color:#a9a9a9;font-size:13px;line-height:1.6">Dugme važi ${EMAIL_VERIFICATION_HOURS} sata. Posle potvrde bićete preusmereni na stranicu za prijavu.</p>
              </div>
            </div>
            <p style="margin-top:18px;text-align:center;color:#777;font-size:12px">Ako niste napravili ovaj nalog, slobodno zanemarite poruku.</p>
          </div>
        </body>
      </html>`,
  })

  if (result.error) throw new Error(result.error.message || "Slanje verifikacionog emaila nije uspelo")
  return result.data
}
