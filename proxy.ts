import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  const response = NextResponse.next()

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return response
  }

  const protectedPaths = ["/promena-lozinke", "/prijava", "/registracija", "/reset-password"]
  const requiresPasswordChange = !protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))
  if (requiresPasswordChange) {
    const rawSession = request.cookies.get("session")?.value
    if (rawSession) {
      try {
        const payload = rawSession.split(".")[0]
        const base64 = payload.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(payload.length / 4) * 4, "=")
        const json = decodeURIComponent(
          Array.from(atob(base64), (character) => `%${character.charCodeAt(0).toString(16).padStart(2, "0")}`).join(""),
        )
        const session = JSON.parse(json)
        const mustChangePassword = Boolean(session.user?.mustChangePassword || session.mustChangePassword)
        if (mustChangePassword) {
          return NextResponse.redirect(new URL("/promena-lozinke", request.url))
        }
      } catch {
        // Invalid sessions are handled by the normal auth endpoints.
      }
    }
  }

  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(self), microphone=(), geolocation=()")

  // Content Security Policy
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' data: https: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; frame-src 'self' https://www.google.com https://maps.google.com;",
  )

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
