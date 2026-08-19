import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db-singleton";
import { getSessionUser } from "@/lib/session-helpers";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ membership: null });
    }

    const result = await sql`
      SELECT id, first_name, last_name, email, start_date, expiry_date, status,
             individual_training_paid, individual_start_date, individual_expiry_date
      FROM members
      WHERE email = ${user.email}
      LIMIT 1
    `;

    if (result.length === 0) {
      return NextResponse.json({ membership: null });
    }

    return NextResponse.json({ membership: result[0] });
  } catch (error) {
    console.error("Error fetching membership:", error);
    return NextResponse.json({ membership: null }, { status: 500 });
  }
}
