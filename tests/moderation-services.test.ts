import test from "node:test";
import assert from "node:assert/strict";
import {
  probeFunction,
  functionHealth,
} from "../src/validation/function-health.ts";
import { headers } from "../supabase/functions/_shared/cors.ts";
import { errorMessage } from "../src/validation/errors.ts";
test("browser preflight accepts the Supabase SDK client and JSON headers", () => {
  const h = new Headers(headers);
  const allowed = h
    .get("Access-Control-Allow-Headers")!
    .split(",")
    .map((v) => v.trim().toLowerCase());
  for (const key of [
    "authorization",
    "apikey",
    "content-type",
    "x-client-info",
  ])
    assert.ok(allowed.includes(key), key);
  assert.ok(h.get("Access-Control-Allow-Methods")!.includes("POST"));
  assert.ok(h.get("Access-Control-Allow-Methods")!.includes("OPTIONS"));
});
test("a missing function and gateway/auth failures never count as available", () => {
  assert.equal(functionHealth(404), "missing");
  for (const status of [200, 401, 403, 429, 500, 503])
    assert.equal(functionHealth(status), "unavailable");
  assert.equal(functionHealth(405), "available");
});
test("availability check is a bounded read-only GET without session or payload", async () => {
  let calls = 0;
  const r = await probeFunction(
    "https://example.invalid/functions/v1/test",
    (async (_url, init) => {
      calls++;
      assert.equal(init?.method, "GET");
      assert.equal(init?.body, undefined);
      assert.equal(init?.headers, undefined);
      assert.ok(init?.signal);
      return new Response(null, { status: 404 });
    }) as typeof fetch,
  );
  assert.equal(r, "missing");
  assert.equal(calls, 1);
  assert.equal(
    await probeFunction("https://example.invalid", (async () => {
      throw new Error("network");
    }) as typeof fetch),
    "unavailable",
  );
});
test("Edge Function failures show Portuguese guidance without backend details", () => {
  const text = errorMessage({
    name: "FunctionsFetchError",
    message: "Failed to send a request to the Edge Function",
  });
  assert.match(text, /revisão manual/);
  assert.doesNotMatch(text, /Edge Function|Failed/);
  assert.match(
    errorMessage({ name: "FunctionsHttpError", message: "private details" }),
    /Nenhuma confirmação/,
  );
});
