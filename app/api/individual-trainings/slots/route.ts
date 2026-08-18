import { NextResponse } from "next/server"
import { checkAdminAuth } from "@/lib/auth-helpers"
import { sql } from "@/lib/db-singleton"
import { getSessionUser } from "@/lib/session-helpers"

function normalizeDateTime(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  const parsed = new Date(trimmed)
  if (!trimmed || Number.isNaN(parsed.getTime())) return null
  return trimmed.length === 16 ? `${trimmed.replace("T", " ")}:00` : trimmed.replace("T", " ")
}

export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Morate biti prijavljeni" }, { status: 401 })

  try {
    const member = await sql`SELECT id FROM members WHERE email = ${user.email} LIMIT 1`
    const memberId = member[0]?.id ?? null

    const slots = await sql`
      SELECT
        s.id,
        s.starts_at,
        s.ends_at,
        s.status,
        (SELECT COUNT(*)::int FROM individual_training_bookings b
          WHERE b.slot_id = s.id AND b.status = 'booked') AS booking_count,
        (SELECT b.id FROM individual_training_bookings b
          WHERE b.slot_id = s.id AND b.member_id = ${memberId} AND b.status = 'booked'
          LIMIT 1) AS my_booking_id
      FROM individual_training_slots s
      WHERE s.starts_at >= CURRENT_TIMESTAMP AND s.status = 'open'
      ORDER BY s.starts_at ASC
    `

    return NextResponse.json({ slots, member: member[0] ? { id: member[0].id } : null })
  } catch (error) {
    console.error("[GARD018] Individual slots fetch failed:", error)
    return NextResponse.json({ error: "Greška pri učitavanju termina" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const auth = await checkAdminAuth()
  if (!auth.isAdmin) {
    return NextResponse.json({ error: auth.error || "Nemate pristup" }, { status: auth.isAuthenticated ? 403 : 401 })
  }

  try {
    const body = await request.json()
    const startsAt = normalizeDateTime(body.startsAt)
    const endsAt = normalizeDateTime(body.endsAt)
    // Individualni termini nemaju ograničenje broja polaznika. Kolona ostaje
    // zbog kompatibilnosti sa postojećom šemom, ali se popunjava velikom
    // vrednošću i više se ne prikazuje niti koristi kao limit u aplikaciji.
    const capacity = 999999

    if (!startsAt || !endsAt) {
      return NextResponse.json({ error: "Unesite ispravan datum i vreme termina" }, { status: 400 })
    }

    if (new Date(startsAt).getTime() >= new Date(endsAt).getTime()) {
      return NextResponse.json({ error: "Kraj termina mora biti posle početka" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO individual_training_slots (starts_at, ends_at, capacity, created_by)
      VALUES (${startsAt}, ${endsAt}, ${capacity}, ${auth.email})
      RETURNING id, starts_at, ends_at, status
    `

    return NextResponse.json({ slot: result[0] }, { status: 201 })
  } catch (error) {
    console.error("[GARD018] Individual slot creation failed:", error)
    return NextResponse.json({ error: "Greška pri kreiranju termina" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const auth = await checkAdminAuth()
  if (!auth.isAdmin) {
    return NextResponse.json({ error: auth.error || "Nemate pristup" }, { status: auth.isAuthenticated ? 403 : 401 })
  }

  try {
    const { id } = await request.json()
    const slotId = Number(id)
    if (!Number.isInteger(slotId)) return NextResponse.json({ error: "Nevažeći termin" }, { status: 400 })

    const result = await sql`
      UPDATE individual_training_slots
      SET status = 'cancelled'
      WHERE id = ${slotId} AND status = 'open'
      RETURNING id
    `

    if (result.length === 0) return NextResponse.json({ error: "Termin nije pronađen" }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[GARD018] Individual slot cancellation failed:", error)
    return NextResponse.json({ error: "Greška pri otkazivanju termina" }, { status: 500 })
  }
}
