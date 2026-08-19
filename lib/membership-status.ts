export function belgradeDateToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Belgrade",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

export function dateOnly(value: unknown) {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  const match = String(value ?? "").match(/^\d{4}-\d{2}-\d{2}/)
  return match?.[0] ?? ""
}

export function isValidDateOnly(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split("-").map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

export function isMembershipDateActive(expiryValue: unknown, today: string) {
  const expiryDate = dateOnly(expiryValue)
  return Boolean(expiryDate && expiryDate >= today)
}

export function getMembershipAccess(expiryValue: unknown) {
  const expiryDate = dateOnly(expiryValue)
  const today = belgradeDateToday()

  // Datum isteka je poslednji dan kada član sme da trenira.
  const allowed = isMembershipDateActive(expiryDate, today)
  return { allowed, expiryDate, today }
}
