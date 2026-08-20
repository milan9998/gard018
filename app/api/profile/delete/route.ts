import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"

export async function POST() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    return NextResponse.json(
      { error: "Nalog se ne može obrisati samostalno. Obratite se treneru." },
      { status: 403 },
    )
  } catch (error) {
    console.error("Error deleting account:", error)
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
  }
}
