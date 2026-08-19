import { isValidDateOnly } from "./membership-status.ts";

export function addCalendarMonthToDate(value: string): string | null {
  if (!isValidDateOnly(value)) return null;

  const [year, month, day] = value.split("-").map(Number);
  const targetYear = year + (month === 12 ? 1 : 0);
  const targetMonth = month === 12 ? 1 : month + 1;
  const lastDay = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate();
  const targetDay = Math.min(day, lastDay);

  return `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`;
}
