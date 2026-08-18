import { getSession } from "@/lib/session"

export type SessionUser = {
  email: string
  name?: string
  image?: string
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getSession()
  if (!session) return null

  return {
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  }
}
