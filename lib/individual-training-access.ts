/**
 * Individual training dates are calendar dates (not instants). Both boundary
 * dates are inclusive: a member may book on the start and expiry dates.
 */
export function dateOnlyFromValue(value: unknown): string {
  return String(value ?? "").match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? "";
}

export type IndividualSlotPeriodRelation =
  | "inside"
  | "before"
  | "after"
  | "invalid";

export function getIndividualSlotPeriodRelation(
  value: unknown,
  startDate: unknown,
  expiryDate: unknown,
): IndividualSlotPeriodRelation {
  const date = dateOnlyFromValue(value);
  const start = dateOnlyFromValue(startDate);
  const expiry = dateOnlyFromValue(expiryDate);

  if (!date || !start || !expiry) return "invalid";
  if (date < start) return "before";
  if (date > expiry) return "after";
  return "inside";
}

export function isDateWithinInclusivePeriod(
  value: unknown,
  startDate: unknown,
  expiryDate: unknown,
): boolean {
  return (
    getIndividualSlotPeriodRelation(value, startDate, expiryDate) === "inside"
  );
}
