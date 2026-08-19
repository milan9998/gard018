import assert from "node:assert/strict";
import test from "node:test";
import { addCalendarMonthToDate } from "../lib/date-only.ts";
import { isProtectedAdmin } from "../lib/admin-constants.ts";
import {
  isMembershipDateActive,
  isValidDateOnly,
} from "../lib/membership-status.ts";

test("članarina važi i na sam datum isteka, ali ne narednog dana", () => {
  assert.equal(isMembershipDateActive("2026-08-19", "2026-08-19"), true);
  assert.equal(isMembershipDateActive("2026-08-19", "2026-08-18"), true);
  assert.equal(isMembershipDateActive("2026-08-19", "2026-08-20"), false);
  assert.equal(isMembershipDateActive(null, "2026-08-19"), false);
});

test("datumi članarine prihvataju samo stvarne kalendarske datume", () => {
  assert.equal(isValidDateOnly("2026-02-28"), true);
  assert.equal(isValidDateOnly("2026-02-29"), false);
  assert.equal(isValidDateOnly("2028-02-29"), true);
  assert.equal(isValidDateOnly("2026-02-31"), false);
  assert.equal(isValidDateOnly("19.08.2026"), false);
});

test("obnova računa isti dan sledećeg kalendarskog meseca", () => {
  assert.equal(addCalendarMonthToDate("2026-08-19"), "2026-09-19");
  assert.equal(addCalendarMonthToDate("2026-01-31"), "2026-02-28");
  assert.equal(addCalendarMonthToDate("2028-01-31"), "2028-02-29");
  assert.equal(addCalendarMonthToDate("2026-13-01"), null);
});

test("Ognjenov nalog je zaštićen bez obzira na velika slova ili razmake", () => {
  assert.equal(isProtectedAdmin("ognjen.boks19@gmail.com"), true);
  assert.equal(isProtectedAdmin("  OGNJEN.BOKS19@GMAIL.COM "), true);
  assert.equal(isProtectedAdmin("drugi@example.com"), false);
});
