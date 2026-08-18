import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { checkAdminAuth } from "@/lib/auth-helpers"

export async function POST(request: NextRequest) {
  try {
    const auth = await checkAdminAuth()
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error || "Nemate pristup" }, { status: auth.isAuthenticated ? 403 : 401 })
    }

    const { email } = await request.json()

    console.log("[v0] Sending test email to:", email)

    const apiKey = process.env.RESEND_API_KEY

    if (!apiKey) {
      console.error("[v0] RESEND_API_KEY environment variable is not configured")
      return NextResponse.json({ success: false, error: "Email service is not configured" }, { status: 500 })
    }

    const resend = new Resend(apiKey)

    const { data, error } = await resend.emails.send({
      from: "GARD 018 <info@gard018.com>",
      to: [email],
      subject: "Podsetnik o članarini - GARD 018",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                  <tr>
                    <td style="background-color: #8f1528; padding: 30px 40px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: normal;">GARD 018</h1>
                      <p style="margin: 5px 0 0 0; color: #ffffff; font-size: 14px;">Borilački Klub</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">Poštovani,</p>
                      <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                        Obaveštavamo vas da vaša članarina ističe za 3 dana.
                      </p>
                      <table width="100%" cellpadding="15" style="background-color: #f9f9f9; border-left: 4px solid #8f1528; margin: 20px 0;">
                        <tr>
                          <td>
                            <p style="margin: 0 0 10px 0; color: #333333; font-size: 14px;"><strong>Datum isteka:</strong> 18.12.2025</p>
                            <p style="margin: 0; color: #d9534f; font-size: 14px;"><strong>Status:</strong> Uskoro ističe</p>
                          </td>
                        </tr>
                      </table>
                      <p style="margin: 0 0 30px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                        Molimo vas da obnovite članarinu kako biste nastavili sa treninzima.
                      </p>
                      <h2 style="margin: 0 0 15px 0; color: #8f1528; font-size: 18px;">Kontakt informacije</h2>
                      <p style="margin: 0 0 10px 0; color: #333333; font-size: 14px; line-height: 1.8;">
                        <strong>Telefon:</strong> 069 010 5213<br>
                        <strong>Email:</strong> ognjen.boks19@gmail.com<br>
                        <strong>Adresa:</strong> Svetozara Miletića 10, Niš 18000
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 30px 40px; background-color: #f9f9f9; border-top: 1px solid #eeeeee; text-align: center;">
                      <p style="margin: 0 0 5px 0; color: #666666; font-size: 14px;">Hvala što ste deo GARD 018 porodice!</p>
                      <p style="margin: 0; color: #8f1528; font-size: 14px;">Vaš GARD 018 Tim</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    })

    if (error) {
      console.error("[v0] Email error:", error)
      throw new Error(error.message || "Failed to send email")
    }

    console.log("[v0] Email sent successfully:", data)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("[v0] Email error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
