import { NextResponse } from "next/server"
import { sql } from "@/lib/db-singleton"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    await sql`SELECT 1 AS ok`
    return NextResponse.json(
      { status: "ok", database: "connected", timestamp: new Date().toISOString() },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch (error) {
    console.error("[GARD018] Health check greška:", error)
    return NextResponse.json(
      { status: "error", database: "unavailable", timestamp: new Date().toISOString() },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    )
  }
}

