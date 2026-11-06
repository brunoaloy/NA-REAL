import test from "node:test";
import assert from "node:assert/strict";
import { clientConfiguration } from "../src/validation/client-config.ts";
const fixture = (role: string) =>
  "fixture." + btoa(JSON.stringify({ role })) + ".not-a-real-signature";
test("accepts public key formats without claiming connectivity", () => {
  assert.equal(
    clientConfiguration(
      "https://example.supabase.co",
      "sb_publishable_TEST_ONLY",
    ).status,
    "ready",
  );
  assert.equal(
    clientConfiguration("https://example.supabase.co", fixture("anon")).status,
    "ready",
  );
});
test("rejects administrative keys even when URL is missing", () => {
  for (const key of ["sb_secret_TEST_ONLY", fixture("service_role")])
    assert.equal(clientConfiguration(undefined, key).status, "invalid");
});
test("rejects credentials in URLs and HTTP outside explicit local development", () => {
  for (const url of [
    "http://example.com",
    "https://user:password@example.com",
    "https://example.com/auth",
  ])
    assert.equal(clientConfiguration(url, fixture("anon")).status, "invalid");
  assert.equal(
    clientConfiguration("http://127.0.0.1:54321", fixture("anon"), true).status,
    "ready",
  );
});
test("missing configuration is not readiness or an exception with secret values", () => {
  assert.equal(clientConfiguration().status, "missing");
  const secret = "sb_secret_NEVER_PRINT";
  assert.equal(
    JSON.stringify(clientConfiguration(undefined, secret)).includes(secret),
    false,
  );
});
