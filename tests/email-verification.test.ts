import assert from "node:assert/strict";
import test from "node:test";
import {
  createEmailVerification,
  EMAIL_VERIFICATION_HOURS,
  hashEmailVerificationToken,
} from "../lib/email-verification.ts";

test("verifikacioni token traje 24 sata i čuva samo hash", () => {
  const before = Date.now();
  const verification = createEmailVerification();
  const after = Date.now();
  const duration = verification.expiresAt.getTime() - before;
  const maxDuration = verification.expiresAt.getTime() - after;

  assert.equal(EMAIL_VERIFICATION_HOURS, 24);
  assert.ok(duration >= 24 * 60 * 60 * 1000);
  assert.ok(maxDuration <= 24 * 60 * 60 * 1000);
  assert.notEqual(verification.token, verification.tokenHash);
  assert.equal(hashEmailVerificationToken(verification.token), verification.tokenHash);
});
