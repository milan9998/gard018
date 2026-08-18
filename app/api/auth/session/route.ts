import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"

export async function GET() {
  console.log("[v0] Session API called")

  try {
    const session = await getSession()

    console.log("[v0] Valid session exists:", !!session)

    if (!session) {
      console.log("[v0] No session cookie found, returning null user")
      return NextResponse.json(
        { user: null },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
    }

    // Return user in consistent format
    return NextResponse.json(
      {
        user: session.user,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  } catch (error) {
    console.error("[v0] Session error:", error)
    return NextResponse.json(
      { user: null },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}
