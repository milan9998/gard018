import { NextResponse } from "next/server"
import { checkAdminAuth } from "@/lib/auth-helpers"
import { sql } from "@/lib/db-singleton"
import { belgradeDateToday, isValidDateOnly } from "@/lib/membership-status"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const memberId = Number.parseInt(resolvedParams.id)

    console.log("[v0] PATCH /api/members/[id] starting:", {
      memberId,
      paramsRaw: resolvedParams,
      url: request.url,
    })

    const auth = await checkAdminAuth()
    if (!auth.isAdmin) {
      console.log("[v0] Auth failed:", auth)
      return NextResponse.json({ error: auth.error || "Nemate pristup" }, { status: auth.isAuthenticated ? 403 : 401 })
    }

    if (isNaN(memberId)) {
      console.log("[v0] Invalid member ID:", resolvedParams.id)
      return NextResponse.json({ error: "Nevažeći ID člana" }, { status: 400 })
    }

    const body = await request.json()
    const { expiry_date } = body

    console.log("[v0] Request body parsed:", { expiry_date, fullBody: body })

    if (!expiry_date) {
      console.log("[v0] Missing expiry_date in request")
      return NextResponse.json({ error: "Datum isteka je obavezan" }, { status: 400 })
    }

    if (typeof expiry_date !== "string" || !isValidDateOnly(expiry_date)) {
      console.log("[v0] Invalid date format:", expiry_date)
      return NextResponse.json({ error: "Nevažeći datum isteka" }, { status: 400 })
    }

    // Datum isteka je poslednji dan kada član sme da trenira.
    const today = belgradeDateToday()
    const newStatus = expiry_date >= today ? "active" : "expired"

    console.log("[v0] Calculated new status:", { newStatus, willUpdate: true })

    const result = await sql`
      UPDATE members
      SET expiry_date = ${expiry_date}, 
          status = ${newStatus}, 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${memberId}
      RETURNING id, first_name, last_name, email, expiry_date, status
    `

    console.log("[v0] Update query result:", {
      rowsAffected: result.length,
      updatedMember: result[0],
    })

    if (result.length === 0) {
      console.log("[v0] No member found with ID:", memberId)
      return NextResponse.json({ error: "Član nije pronađen" }, { status: 404 })
    }

    console.log("[v0] Member expiry date updated successfully:", result[0])

    return NextResponse.json(
      {
        success: true,
        status: newStatus,
        expiry_date,
        member: result[0],
        message: "Datum isteka je uspešno ažuriran",
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  } catch (error) {
    console.error("[v0] Critical error in PATCH /api/members/[id]:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    })
    return NextResponse.json(
      { error: "Greška pri ažuriranju datuma isteka", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    )
  }
}
