import { NextResponse } from "next/server"

import { checkAdminAuth } from "@/lib/auth-helpers"
import { sql } from "@/lib/db-singleton"

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/

function parseSchedule(body: Record<string, unknown>) {
  const dayOfWeek = Number(body.dayOfWeek)
  const startTime = typeof body.startTime === "string" ? body.startTime.trim() : ""
  const endTime = typeof body.endTime === "string" ? body.endTime.trim() : ""
  const program = typeof body.program === "string" ? body.program.trim() : ""

  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7) {
    return { error: "Izaberite ispravan dan" } as const
  }
  if (!TIME_PATTERN.test(startTime) || !TIME_PATTERN.test(endTime)) {
    return { error: "Unesite ispravno vreme" } as const
  }
  if (endTime <= startTime) {
    return { error: "Kraj treninga mora biti posle početka" } as const
  }
  if (!program || program.length > 255) {
    return { error: "Program je obavezan i može imati najviše 255 karaktera" } as const
  }

  return { value: { dayOfWeek, startTime, endTime, program } } as const
}

async function requireAdmin() {
  const auth = await checkAdminAuth()
  if (!auth.isAdmin) {
    return {
      auth,
      response: NextResponse.json(
        { error: auth.error || "Nemate pristup" },
        { status: auth.isAuthenticated ? 403 : 401 },
      ),
    }
  }
  return { auth, response: null }
}

export async function GET() {
  try {
    const schedule = await sql`
      SELECT id, day_of_week, start_time, end_time, program
      FROM weekly_training_schedule
      WHERE is_active = TRUE
      ORDER BY day_of_week ASC, start_time ASC, id ASC
    `
    return NextResponse.json({ schedule })
  } catch (error) {
    console.error("[GARD018] Weekly schedule fetch failed:", error)
    return NextResponse.json({ error: "Greška pri učitavanju rasporeda" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { auth, response } = await requireAdmin()
  if (response) return response

  try {
    const parsed = parseSchedule(await request.json())
    if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
    const { dayOfWeek, startTime, endTime, program } = parsed.value
    const result = await sql`
      INSERT INTO weekly_training_schedule (day_of_week, start_time, end_time, program, created_by)
      VALUES (${dayOfWeek}, ${startTime}, ${endTime}, ${program}, ${auth.email})
      RETURNING id, day_of_week, start_time, end_time, program
    `
    return NextResponse.json({ item: result[0] }, { status: 201 })
  } catch (error) {
    console.error("[GARD018] Weekly schedule creation failed:", error)
    return NextResponse.json({ error: "Greška pri dodavanju treninga" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const { response } = await requireAdmin()
  if (response) return response

  try {
    const body = await request.json()
    const id = Number(body.id)
    if (!Number.isInteger(id)) return NextResponse.json({ error: "Nevažeći trening" }, { status: 400 })
    const parsed = parseSchedule(body)
    if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
    const { dayOfWeek, startTime, endTime, program } = parsed.value
    const result = await sql`
      UPDATE weekly_training_schedule
      SET day_of_week = ${dayOfWeek}, start_time = ${startTime}, end_time = ${endTime},
          program = ${program}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND is_active = TRUE
      RETURNING id, day_of_week, start_time, end_time, program
    `
    if (result.length === 0) return NextResponse.json({ error: "Trening nije pronađen" }, { status: 404 })
    return NextResponse.json({ item: result[0] })
  } catch (error) {
    console.error("[GARD018] Weekly schedule update failed:", error)
    return NextResponse.json({ error: "Greška pri izmeni treninga" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const { response } = await requireAdmin()
  if (response) return response

  try {
    const { id } = await request.json()
    const scheduleId = Number(id)
    if (!Number.isInteger(scheduleId)) return NextResponse.json({ error: "Nevažeći trening" }, { status: 400 })
    const result = await sql`
      DELETE FROM weekly_training_schedule
      WHERE id = ${scheduleId}
      RETURNING id
    `
    if (result.length === 0) return NextResponse.json({ error: "Trening nije pronađen" }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[GARD018] Weekly schedule deletion failed:", error)
    return NextResponse.json({ error: "Greška pri brisanju treninga" }, { status: 500 })
  }
}
