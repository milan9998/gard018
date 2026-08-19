import assert from "node:assert/strict";
import test from "node:test";
import {
  dateOnlyFromValue,
  isDateWithinInclusivePeriod,
} from "../lib/individual-training-access.ts";

test("individualni period uključuje početni i krajnji datum", () => {
  assert.equal(
    isDateWithinInclusivePeriod(
      "2026-08-19T18:00:00",
      "2026-08-19",
      "2026-09-19",
    ),
    true,
  );
  assert.equal(
    isDateWithinInclusivePeriod(
      "2026-09-19T18:00:00",
      "2026-08-19",
      "2026-09-19",
    ),
    true,
  );
});

test("termin pre početka ili posle isteka nije u periodu", () => {
  assert.equal(
    isDateWithinInclusivePeriod(
      "2026-08-18T20:00:00",
      "2026-08-19",
      "2026-09-19",
    ),
    false,
  );
  assert.equal(
    isDateWithinInclusivePeriod(
      "2026-09-20T20:00:00",
      "2026-08-19",
      "2026-09-19",
    ),
    false,
  );
});

test("datum termina se čita kao kalendarski datum, bez pomeranja vremenske zone", () => {
  assert.equal(dateOnlyFromValue("2026-08-19 18:00:00"), "2026-08-19");
  assert.equal(dateOnlyFromValue("2026-08-19T18:00:00.000Z"), "2026-08-19");
  assert.equal(dateOnlyFromValue(null), "");
});
