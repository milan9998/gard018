/**
 * Individual training dates are calendar dates (not instants). Both boundary
 * dates are inclusive: a member may book on the start and expiry dates.
 */
export function dateOnlyFromValue(value: unknown): string {
  return String(value ?? "").match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? "";
}

export function isDateWithinInclusivePeriod(
  value: unknown,
  startDate: unknown,
  expiryDate: unknown,
): boolean {
  const date = dateOnlyFromValue(value);
  const start = dateOnlyFromValue(startDate);
  const expiry = dateOnlyFromValue(expiryDate);

  return Boolean(date && start && expiry && date >= start && date <= expiry);
}
