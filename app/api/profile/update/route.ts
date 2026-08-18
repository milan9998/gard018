import { NextResponse } from "next/server"
import { getSession, setSession } from "@/lib/session"

export async function POST(request: Request) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { name, image } = await request.json()

    const updatedSession = {
      user: {
        ...session.user,
        email: session.user.email,
        name: name || session.user.name,
        image: image || session.user.image,
      },
    }

    await setSession(updatedSession)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
