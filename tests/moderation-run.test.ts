import test from "node:test";
import assert from "node:assert/strict";
import { moderationRun } from "../src/validation/moderation-run.ts";
import { MODERATION_POLICY_VERSION } from "../supabase/functions/_shared/moderation-policy.ts";
const good = {
  policy_version: MODERATION_POLICY_VERSION,
  status: "completed",
  processed: 3,
  approved: 1,
  rejected: 1,
  review: 1,
  failed: 0,
};
test("confirmed IA batches expose approved rejected and review counts", () => {
  assert.match(
    moderationRun(good).message,
    /1 aprovados.*1 reprovados.*1 para sua revisão/,
  );
  assert.equal(
    moderationRun({ ...good, status: "partial", failed: 1 }).failed,
    1,
  );
});
test("unconfigured and old services are not shown as active automatic moderation", () => {
  for (const value of [
    { status: "not_configured", processed: 0 },
    { processed: 3 },
    null,
  ])
    assert.throws(() => moderationRun(value));
});
test("malformed or impossible batches never show a success", () => {
  for (const change of [
    { processed: 2 },
    { approved: -1 },
    { failed: 11 },
    { review: NaN },
    { approved: "1" },
    { status: "unknown" },
  ])
    assert.throws(() => moderationRun({ ...good, ...change }));
});
