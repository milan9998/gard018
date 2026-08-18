import { NextResponse } from "next/server"
import { checkAdminAuth } from "@/lib/auth-helpers"
import { sql } from "@/lib/db-singleton"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkAdminAuth()
  if (!auth.isAdmin) {
    return NextResponse.json({ error: auth.error || "Nemate pristup" }, { status: auth.isAuthenticated ? 403 : 401 })
  }

  try {
    const memberId = Number.parseInt((await params).id, 10)
    const body = await request.json()

    if (!Number.isInteger(memberId) || typeof body.paid !== "boolean") {
      return NextResponse.json({ error: "Nevažeći član ili status uplate" }, { status: 400 })
    }

    const result = await sql`
      UPDATE members
      SET individual_training_paid = ${body.paid}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${memberId}
      RETURNING id, first_name, last_name, email, individual_training_paid
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Član nije pronađen" }, { status: 404 })
    }

    return NextResponse.json({ member: result[0] })
  } catch (error) {
    console.error("[GARD018] Individual payment update failed:", error)
    return NextResponse.json({ error: "Greška pri ažuriranju individualne uplate" }, { status: 500 })
  }
}
