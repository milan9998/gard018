import process from "node:process"

const appUrl = (process.env.APP_INTERNAL_URL || "http://app:3000").replace(/\/+$/, "")
const cronSecret = process.env.CRON_SECRET
if (!cronSecret) throw new Error("CRON_SECRET nije podešen")

const formatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Belgrade",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  hourCycle: "h23",
})

let lastRunDate = ""

function belgradeNow() {
  const parts = Object.fromEntries(formatter.formatToParts(new Date()).map((part) => [part.type, part.value]))
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) }
}

async function runIfDue() {
  const now = belgradeNow()
  if (now.hour < 8 || lastRunDate === now.date) return

  try {
    const response = await fetch(`${appUrl}/api/cron/check-memberships`, {
      headers: { Authorization: `Bearer ${cronSecret}` },
      signal: AbortSignal.timeout(90_000),
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`)
    lastRunDate = now.date
    console.log(`[GARD018] Dnevna provera članarina završena za ${now.date}`)
  } catch (error) {
    console.error("[GARD018] Scheduler nije uspeo, pokušaće ponovo za minut:", error)
  }
}

console.log("[GARD018] Scheduler članarina je pokrenut (svakog dana posle 08:00 Europe/Belgrade)")
await runIfDue()
setInterval(runIfDue, 60_000)

