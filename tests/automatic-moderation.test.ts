import test from "node:test";
import assert from "node:assert/strict";
import { moderationVerdict } from "../supabase/functions/moderate-pending/verdict.ts";
function result(key: string, score: number, flagged = true) {
  return {
    results: [
      {
        flagged,
        categories: {
          harassment: false,
          hate: false,
          "sexual/minors": false,
          violence: false,
          "self-harm": false,
          [key]: true,
        },
        category_scores: {
          harassment: 0,
          hate: 0,
          "sexual/minors": 0,
          violence: 0,
          "self-harm": 0,
          [key]: score,
        },
      },
    ],
  };
}
test("clear policy violations can be rejected, with a version and human appeal", () => {
  for (const target of [
    "places",
    "profiles",
    "photos",
    "reviews",
    "place_messages",
  ]) {
    const v = moderationVerdict(
      result("hate/threatening", 0.99),
      "Conteúdo de teste",
      target,
    );
    assert.equal(v?.decision, "rejected");
    assert.equal(v?.evidence.matched_rule, "hate/threatening");
    assert.match(v!.reason, /revisão humana/);
    assert.equal(v?.evidence.requires_human, false);
  }
});
test("low confidence, mismatched flag and contextual violence do not auto-reject", () => {
  for (const v of [
    result("hate", 0.8),
    result("hate", 0.99, false),
    result("violence", 0.99),
  ])
    assert.equal(moderationVerdict(v, "Texto", "reviews")?.decision, "pending");
});
test("unknown types cannot be automatically approved and malformed scores are refused", () => {
  const clean = result("harassment", 0, false);
  clean.results[0].categories.harassment = false;
  assert.equal(moderationVerdict(clean, "Olá", "unknown")?.decision, "pending");
  assert.equal(
    moderationVerdict(result("hate", Infinity), "Olá", "reviews"),
    null,
  );
});

test("a high score without a matching flag never causes automatic approval", () => {
  const v = result("hate", 0.99, false);
  v.results[0].categories.hate = false;
  assert.equal(moderationVerdict(v, "Texto", "reviews")?.decision, "pending");
});
