import { createHmac, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"

export type SessionData = {
  user: {
    email: string
    name?: string
    image?: string
    mustChangePassword?: boolean
  }
}

const SESSION_MAX_AGE = 60 * 60 * 24 * 30

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET mora imati najmanje 32 karaktera")
  }
  return secret
}

function sign(payload: string) {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("base64url")
}

export function encodeSession(session: SessionData) {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url")
  return `${payload}.${sign(payload)}`
}

export function decodeSession(value: string): SessionData | null {
  try {
    const [payload, signature, extra] = value.split(".")
    if (!payload || !signature || extra) return null

    const expected = sign(payload)
    const actualBuffer = Buffer.from(signature)
    const expectedBuffer = Buffer.from(expected)
    if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) return null

    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"))
    const email = typeof parsed?.user?.email === "string" ? parsed.user.email.toLowerCase().trim() : ""
    if (!email) return null

    return { ...parsed, user: { ...parsed.user, email } }
  } catch {
    return null
  }
}

export async function getSession(): Promise<SessionData | null> {
  const value = (await cookies()).get("session")?.value
  return value ? decodeSession(value) : null
}

export async function setSession(session: SessionData) {
  const cookieStore = await cookies()
  cookieStore.set("session", encodeSession(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    expires: new Date(Date.now() + SESSION_MAX_AGE * 1000),
    path: "/",
  })
}
