import { NextResponse } from "next/server"
import { processMembershipExpirations } from "@/lib/membership-service"

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.error("[GARD018] Unauthorized attempt to check memberships")
      return new Response("Unauthorized", { status: 401 })
    }

    console.log("[GARD018] ====== CHECK MEMBERSHIPS API CALLED ======")

    const result = await processMembershipExpirations()

    return NextResponse.json(result)
  } catch (error) {
    console.error("[GARD018] Critical error checking memberships:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check memberships",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error && process.env.NODE_ENV !== "production" ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export const dynamic = "force-dynamic"
export const maxDuration = 60

function getWarningEmailHTML(member: any, expiryDate: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; }
          table { border-collapse: collapse; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #8f1528 0%, #1a0000 100%); padding: 40px 30px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 32px; font-weight: bold; }
          .header p { color: #e0e0e0; margin: 10px 0 0 0; font-size: 14px; }
          .content { padding: 40px 30px; color: #333333; line-height: 1.6; }
          .content h2 { color: #8f1528; margin-top: 0; }
          .warning-box { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 20px 0; }
          .info-box { background-color: #f9f9f9; border-left: 4px solid #8f1528; padding: 20px; margin: 20px 0; }
          .contact-list { list-style: none; padding: 0; }
          .contact-list li { padding: 8px 0; }
          .button { display: inline-block; background-color: #8f1528; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .footer { background-color: #1a1a1a; color: #999999; padding: 30px; text-align: center; font-size: 12px; }
          .footer p { margin: 5px 0; }
        </style>
      </head>
      <body>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <table class="container" width="600" cellpadding="0" cellspacing="0">
                <tr>
                  <td class="header">
                    <h1>GARD 018</h1>
                    <p>Borilački Klub</p>
                  </td>
                </tr>
                <tr>
                  <td class="content">
                    <h2>Poštovani ${member.first_name} ${member.last_name},</h2>
                    <p>Želimo da vas podsetimo da vaša članarina u klubu GARD 018 ističe za <strong>3 dana</strong>.</p>
                    
                    <div class="warning-box">
                      <strong>⚠️ Datum isteka: ${expiryDate}</strong>
                    </div>

                    <p>Da biste nastavili sa treninzima bez prekida, molimo vas da obnovite članarinu na vreme.</p>

                    <div class="info-box">
                      <p><strong>Kako obnoviti članarinu?</strong></p>
                      <p>Kontaktirajte nas putem telefona ili email-a, a možete nas posetiti i lično u teretani.</p>
                    </div>

                    <p>Za obnovu članarine i dodatne informacije:</p>
                    <ul class="contact-list">
                      <li><strong>Telefon:</strong> +381 62 202 420</li>
                      <li><strong>Email:</strong> info@gard018.com</li>
                      <li><strong>Adresa:</strong> Niš, Srbija</li>
                    </ul>

                    <a href="mailto:info@gard018.com" class="button">Kontaktirajte nas</a>

                    <p style="margin-top: 30px; color: #666; font-size: 14px;">
                      Vidimo se na treningu!
                    </p>
                  </td>
                </tr>
                <tr>
                  <td class="footer">
                    <p><strong>GARD 018 Borilački Klub</strong></p>
                    <p>Niš, Srbija | +381 62 202 420</p>
                    <p style="margin-top: 15px;">
                      Ova poruka je poslata automatski jer vaša članarina ističe za 3 dana.<br>
                      Ako imate pitanja, kontaktirajte nas na info@gard018.com
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `
}

function getMemberEmailHTML(member: any, expiryDate: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; }
          table { border-collapse: collapse; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #8f1528 0%, #1a0000 100%); padding: 40px 30px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 32px; font-weight: bold; }
          .header p { color: #e0e0e0; margin: 10px 0 0 0; font-size: 14px; }
          .content { padding: 40px 30px; color: #333333; line-height: 1.6; }
          .content h2 { color: #8f1528; margin-top: 0; }
          .info-box { background-color: #f9f9f9; border-left: 4px solid #8f1528; padding: 20px; margin: 20px 0; }
          .contact-list { list-style: none; padding: 0; }
          .contact-list li { padding: 8px 0; }
          .button { display: inline-block; background-color: #8f1528; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .footer { background-color: #1a1a1a; color: #999999; padding: 30px; text-align: center; font-size: 12px; }
          .footer p { margin: 5px 0; }
        </style>
      </head>
      <body>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <table class="container" width="600" cellpadding="0" cellspacing="0">
                <tr>
                  <td class="header">
                    <h1>GARD 018</h1>
                    <p>Borilački Klub</p>
                  </td>
                </tr>
                <tr>
                  <td class="content">
                    <h2>Poštovani ${member.first_name} ${member.last_name},</h2>
                    <p>Obaveštavamo vas da je vaša članarina u klubu GARD 018 istekla danas <strong>${expiryDate}</strong>.</p>
                    
                    <div class="info-box">
                      <strong>Da biste nastavili sa treninzima, molimo vas da obnovite članarinu.</strong>
                    </div>

                    <p>Za obnovu članarine i dodatne informacije, slobodno nas kontaktirajte:</p>
                    <ul class="contact-list">
                      <li><strong>Telefon:</strong> +381 62 202 420</li>
                      <li><strong>Email:</strong> info@gard018.com</li>
                      <li><strong>Adresa:</strong> Niš, Srbija</li>
                    </ul>

                    <a href="mailto:info@gard018.com" class="button">Kontaktirajte nas</a>

                    <p style="margin-top: 30px; color: #666; font-size: 14px;">
                      Radujemo se vašem povratku u klub!
                    </p>
                  </td>
                </tr>
                <tr>
                  <td class="footer">
                    <p><strong>GARD 018 Borilački Klub</strong></p>
                    <p>Niš, Srbija | +381 62 202 420</p>
                    <p style="margin-top: 15px;">
                      Ova poruka je poslata automatski jer je vaša članarina istekla.<br>
                      Ako imate pitanja, kontaktirajte nas na info@gard018.com
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `
}

function getFounderEmailHTML(member: any, expiryDate: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; }
          table { border-collapse: collapse; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #8f1528 0%, #1a0000 100%); padding: 30px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; }
          .content { padding: 30px; color: #333333; line-height: 1.6; }
          .content h2 { color: #8f1528; margin-top: 0; }
          .member-info { background-color: #f9f9f9; border-left: 4px solid #8f1528; padding: 20px; margin: 20px 0; }
          .member-info p { margin: 8px 0; }
          .footer { background-color: #1a1a1a; color: #999999; padding: 20px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <table class="container" width="600" cellpadding="0" cellspacing="0">
                <tr>
                  <td class="header">
                    <h1>🔔 Notifikacija članarine</h1>
                  </td>
                </tr>
                <tr>
                  <td class="content">
                    <h2>Istekla članarina</h2>
                    <p>Korisniku je danas istekla članarina i poslat je automatski email.</p>
                    
                    <div class="member-info">
                      <p><strong>Ime:</strong> ${member.first_name} ${member.last_name}</p>
                      <p><strong>Email:</strong> ${member.email}</p>
                      <p><strong>Datum isteka:</strong> ${expiryDate}</p>
                    </div>

                    <p>Status člana je automatski promenjen u "expired" u bazi podataka.</p>
                  </td>
                </tr>
                <tr>
                  <td class="footer">
                    <p>GARD 018 - Automatska notifikacija</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `
}
