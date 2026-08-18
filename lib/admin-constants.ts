export const PROTECTED_ADMIN_EMAILS = ["ognjen.boks19@gmail.com"] as const

export function isProtectedAdmin(email: string) {
  const normalized = email.trim().toLowerCase()
  return PROTECTED_ADMIN_EMAILS.some((protectedEmail) => protectedEmail === normalized)
}
