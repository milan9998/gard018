import { isProtectedAdmin } from "./admin-constants.ts"

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

/** Članovi i admini ne mogu sami da obrišu sopstveni nalog. */
export function canSelfDeleteAccount() {
  return false
}

/**
 * Admin može da obriše člana, ali ne može drugog admina.
 * Zaštićeni trener (Ognjen) može da obriše druge naloge, ali ne i svoj.
 */
export function canAdminDeleteAccount(
  actorEmail: string,
  targetEmail: string,
  targetIsAdmin: boolean,
) {
  const actor = normalizeEmail(actorEmail)
  const target = normalizeEmail(targetEmail)

  if (!actor || !target || actor === target) return false
  if (isProtectedAdmin(target)) return false
  if (targetIsAdmin && !isProtectedAdmin(actor)) return false
  return true
}
