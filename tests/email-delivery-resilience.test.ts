import assert from "node:assert/strict";
import test from "node:test";
import { OperationTimeoutError, withTimeout } from "../lib/async-utils.ts";
import { getPublicBaseUrl } from "../lib/public-url.ts";

test("sporo slanje emaila se prekida jasnim timeoutom", async () => {
  await assert.rejects(
    withTimeout(new Promise(() => undefined), 5, "test timeout"),
    (error: unknown) => error instanceof OperationTimeoutError && error.message === "test timeout",
  );
});

test("lokalni email link prati host zahteva kada je URL podešen na auto", () => {
  const previous = process.env.NEXT_PUBLIC_BASE_URL;
  process.env.NEXT_PUBLIC_BASE_URL = "auto";

  try {
    const request = new Request("https://acting-tourism-engine-aaa.trycloudflare.com/api/auth/forgot-password", {
      headers: {
        host: "acting-tourism-engine-aaa.trycloudflare.com",
        "x-forwarded-proto": "https",
      },
    });
    assert.equal(getPublicBaseUrl(request), "https://acting-tourism-engine-aaa.trycloudflare.com");
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_BASE_URL;
    else process.env.NEXT_PUBLIC_BASE_URL = previous;
  }
});
