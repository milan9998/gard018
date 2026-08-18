import { NextResponse } from "next/server"

// Stari endpoint je primao datume i status članarine direktno od javnog
// korisnika. Registracija sada uvek ide kroz /api/auth/register, a članarinu
// aktivira isključivo admin.
export async function POST() {
  return NextResponse.json(
    { error: "Ovaj način registracije više nije dostupan" },
    { status: 410 },
  )
}
