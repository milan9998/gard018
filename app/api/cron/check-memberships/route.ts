import { NextResponse } from "next/server"
import { processMembershipExpirations } from "@/lib/membership-service"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const maxDuration = 60

export async function GET(request: Request) {
  console.log("[GARD018 CRON] ====== CRON JOB TRIGGERED ======")
  console.log("[GARD018 CRON] Timestamp:", new Date().toISOString())
  try {
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.error("[GARD018 CRON] Unauthorized cron attempt")
      return new Response("Unauthorized", { status: 401 })
    }

    const result = await processMembershipExpirations()

    console.log("[GARD018 CRON] ====== CRON JOB COMPLETED ======")
    return NextResponse.json(result)
  } catch (error) {
    console.error("[GARD018 CRON] ====== CRON JOB FAILED ======")
    console.error("[GARD018 CRON] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Cron job failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
