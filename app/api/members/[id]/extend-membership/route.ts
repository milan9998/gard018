import { NextResponse } from "next/server"
import { checkAdminAuth } from "@/lib/auth-helpers"
import { sql } from "@/lib/db-singleton"

function parseDateOnly(value: unknown) {
  if (typeof value !== "string") return null
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null
  return date
}

function dateOnly(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`
}

function addCalendarMonth(date: Date) {
  const targetYear = date.getUTCFullYear() + (date.getUTCMonth() === 11 ? 1 : 0)
  const targetMonth = (date.getUTCMonth() + 1) % 12
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate()
  const targetDay = Math.min(date.getUTCDate(), lastDay)
  return new Date(Date.UTC(targetYear, targetMonth, targetDay))
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await checkAdminAuth()
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error || "Nemate pristup" }, { status: auth.isAuthenticated ? 403 : 401 })
    }

    const memberId = Number.parseInt((await params).id, 10)
    if (!Number.isInteger(memberId)) return NextResponse.json({ error: "Nevažeći ID člana" }, { status: 400 })

    const members = await sql`
      SELECT id, first_name, last_name, expiry_date
      FROM members
      WHERE id = ${memberId}
      LIMIT 1
    `
    if (members.length === 0) return NextResponse.json({ error: "Član nije pronađen" }, { status: 404 })

    const currentExpiry = parseDateOnly(String(members[0].expiry_date))
    if (!currentExpiry) return NextResponse.json({ error: "Postojeći datum isteka nije ispravan" }, { status: 422 })

    const now = new Date()
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
    const baseDate = currentExpiry.getTime() >= today.getTime() ? currentExpiry : today
    const extendedExpiry = addCalendarMonth(baseDate)
    const expiryDate = dateOnly(extendedExpiry)

    const result = await sql`
      UPDATE members
      SET expiry_date = ${expiryDate},
          membership_configured = TRUE,
          status = 'active',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${memberId}
      RETURNING id, first_name, last_name, email, expiry_date, status
    `

    return NextResponse.json({
      success: true,
      expiry_date: expiryDate,
      member: result[0],
      message: `Članarina je produžena do ${expiryDate.split("-").reverse().join(".")}.`,
    })
  } catch (error) {
    console.error("[GARD018] Membership extension failed:", error)
    return NextResponse.json({ error: "Greška pri produženju članarine" }, { status: 500 })
  }
}
