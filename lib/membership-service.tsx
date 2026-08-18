import { sql } from "@/lib/db-singleton"
import { Resend } from "resend"

async function sendEmailWithRetry(emailData: any, maxRetries = 3): Promise<any> {
  const resend = new Resend(process.env.RESEND_API_KEY!)

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await resend.emails.send(emailData)
      if (!result.error) {
        return { success: true, data: result }
      }

      if (result.error && attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000
        console.log(`[GARD018] Email send failed (attempt ${attempt}/${maxRetries}), retrying in ${waitTime}ms...`)
        await new Promise((resolve) => setTimeout(resolve, waitTime))
        continue
      }

      return { success: false, error: result.error }
    } catch (error) {
      if (attempt === maxRetries) {
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
      }
      const waitTime = Math.pow(2, attempt) * 1000
      console.log(`[GARD018] Email send exception (attempt ${attempt}/${maxRetries}), retrying in ${waitTime}ms...`)
      await new Promise((resolve) => setTimeout(resolve, waitTime))
    }
  }
  return { success: false, error: "Max retries exceeded" }
}

export async function processMembershipExpirations() {
  console.log("[GARD018] Starting membership expiration check...")

  try {
    // Get current date in Belgrade timezone using Intl.DateTimeFormat
    const getBelgradeDate = (daysOffset = 0): string => {
      const targetDate = new Date()
      if (daysOffset > 0) {
        targetDate.setDate(targetDate.getDate() + daysOffset)
      }

      return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Belgrade",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(targetDate)
    }

    const todayInBelgrade = getBelgradeDate(0)
    const in3DaysInBelgrade = getBelgradeDate(3)

    console.log("[GARD018] Today in Belgrade (Europe/Belgrade timezone):", todayInBelgrade)
    console.log("[GARD018] In 3 days in Belgrade:", in3DaysInBelgrade)

    // Fetch all members from database
    const allMembers = await sql`
      SELECT id, first_name, last_name, email, expiry_date, status
      FROM members
      ORDER BY expiry_date ASC
    `

    console.log(`[GARD018] Found ${allMembers.length} total members in database`)

    const sentNotifications = await sql`
      SELECT member_id, notification_type, membership_expiry
      FROM membership_notifications
      WHERE membership_expiry = ANY(${[todayInBelgrade, in3DaysInBelgrade]}::date[])
    `
    const sentKeys = new Set(
      sentNotifications.map(
        (notification: any) =>
          `${notification.member_id}:${notification.notification_type}:${String(notification.membership_expiry).slice(0, 10)}`,
      ),
    )

    // Filter members expiring in 3 days (warning emails)
    const warningMembers = allMembers.filter((m: any) => {
      const memberDateStr = new Date(m.expiry_date).toISOString().split("T")[0]
      return memberDateStr === in3DaysInBelgrade && !sentKeys.has(`${m.id}:warning:${memberDateStr}`)
    })

    // Filter members expiring today (expiry emails)
    const expiringMembers = allMembers.filter((m: any) => {
      const memberDateStr = new Date(m.expiry_date).toISOString().split("T")[0]
      return memberDateStr === todayInBelgrade && !sentKeys.has(`${m.id}:expiry:${memberDateStr}`)
    })

    console.log(`[GARD018] Found ${warningMembers.length} members expiring in 3 days`)
    console.log(`[GARD018] Found ${expiringMembers.length} members expiring today`)

    // Build warning emails (3 days before expiry)
    const warningEmailsData = warningMembers.map((member: any) => {
      const expiryDate = new Date(member.expiry_date).toLocaleDateString("sr-RS")
      return {
        from: "GARD 018 <info@gard018.com>",
        to: member.email,
        replyTo: "info@gard018.com",
        subject: "Obaveštenje - Članarina ističe za 3 dana - GARD 018",
        html: getWarningEmailHTML(member, expiryDate),
      }
    })

    const warningNotifications: any[] = []
    const resendWarning = new Resend(process.env.RESEND_API_KEY!)

    // Send warning emails in batches
    if (warningEmailsData.length > 0) {
      const batchSize = 100
      const batches = []

      for (let i = 0; i < warningEmailsData.length; i += batchSize) {
        batches.push(warningEmailsData.slice(i, i + batchSize))
      }

      for (let i = 0; i < batches.length; i++) {
        try {
          console.log(`[GARD018] Sending warning batch ${i + 1}/${batches.length} (${batches[i].length} emails)`)
          const batchResult = await resendWarning.batch.send(batches[i])

          if (!batchResult.error) {
            console.log(`[GARD018] Successfully sent warning batch ${i + 1}/${batches.length}`)
            const batchStartIdx = i * batchSize
            for (let j = 0; j < batches[i].length; j++) {
              const member = warningMembers[batchStartIdx + j]
              warningNotifications.push({
                member: `${member.first_name} ${member.last_name}`,
                email: member.email,
                expiryDate: member.expiry_date,
                type: "warning",
              })
              await sql`
                INSERT INTO membership_notifications (member_id, notification_type, membership_expiry)
                VALUES (${member.id}, 'warning', ${member.expiry_date})
                ON CONFLICT (member_id, notification_type, membership_expiry) DO NOTHING
              `
            }
          } else {
            console.error(`[GARD018] Warning batch ${i + 1} failed:`, batchResult.error)
          }

          // Rate limit protection: 1 second pause between batches
          if (i < batches.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000))
          }
        } catch (error) {
          console.error(`[GARD018] Error sending warning batch ${i + 1}:`, error)
        }
      }
    }

    // Build expiry emails (for members + founder)
    const expiryEmailsData: any[] = []
    const processedMemberIds = new Set<number>()

    for (const member of expiringMembers) {
      if (processedMemberIds.has(member.id)) {
        console.log(`[GARD018] Skipping duplicate member: ${member.first_name} ${member.last_name}`)
        continue
      }

      processedMemberIds.add(member.id)

      const expiryDate = new Date(member.expiry_date).toLocaleDateString("sr-RS")

      // Email to member
      expiryEmailsData.push({
        from: "GARD 018 <info@gard018.com>",
        to: member.email,
        replyTo: "info@gard018.com",
        subject: "Obaveštenje - Istekla članarina - GARD 018",
        html: getMemberEmailHTML(member, expiryDate),
      })

      // Email to founder
      expiryEmailsData.push({
        from: "GARD 018 <info@gard018.com>",
        to: "ognjen.boks19@gmail.com",
        replyTo: "info@gard018.com",
        subject: `Članarina istekla - ${member.first_name} ${member.last_name}`,
        html: getFounderEmailHTML(member, expiryDate),
      })
    }

    console.log(`[GARD018] Total expiry emails to send: ${expiryEmailsData.length}`)

    const expiryNotifications: any[] = []
    const resendExpiry = new Resend(process.env.RESEND_API_KEY!)

    // Send expiry emails in batches
    if (expiryEmailsData.length > 0) {
      const batchSize = 100
      const batches = []

      for (let i = 0; i < expiryEmailsData.length; i += batchSize) {
        batches.push(expiryEmailsData.slice(i, i + batchSize))
      }

      for (let i = 0; i < batches.length; i++) {
        try {
          console.log(`[GARD018] Sending expiry batch ${i + 1}/${batches.length} (${batches[i].length} emails)`)
          const batchResult = await resendExpiry.batch.send(batches[i])

          if (!batchResult.error) {
            console.log(`[GARD018] Successfully sent expiry batch ${i + 1}/${batches.length}`)

            // Update member status to 'expired'
            for (const member of expiringMembers) {
              try {
                await sql`
                  UPDATE members
                  SET status = 'expired', updated_at = CURRENT_TIMESTAMP
                  WHERE id = ${member.id}
                `

                expiryNotifications.push({
                  member: `${member.first_name} ${member.last_name}`,
                  email: member.email,
                  expiryDate: member.expiry_date,
                  type: "expiry",
                })
                await sql`
                  INSERT INTO membership_notifications (member_id, notification_type, membership_expiry)
                  VALUES (${member.id}, 'expiry', ${member.expiry_date})
                  ON CONFLICT (member_id, notification_type, membership_expiry) DO NOTHING
                `
              } catch (updateError) {
                console.error(`[GARD018] Failed to update status for member ${member.id}:`, updateError)
              }
            }
          } else {
            console.error(`[GARD018] Expiry batch ${i + 1} failed:`, batchResult.error)
          }

          // Rate limit protection: 1 second pause between batches
          if (i < batches.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000))
          }
        } catch (error) {
          console.error(`[GARD018] Error sending expiry batch ${i + 1}:`, error)
        }
      }
    }

    console.log("[GARD018] Processing completed successfully")

    return {
      success: true,
      message: `Checked memberships. Found ${warningMembers.length} expiring in 3 days, ${expiringMembers.length} expiring today.`,
      warningSent: warningNotifications.length,
      expirySent: expiryNotifications.length,
      expiringToday: expiringMembers.length,
      expiringIn3Days: warningMembers.length,
      warningNotifications,
      expiryNotifications,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error("[GARD018] Error in processMembershipExpirations:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    }
  }
}

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
