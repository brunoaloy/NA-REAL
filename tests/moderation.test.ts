import test from "node:test";
import assert from "node:assert/strict";
import { moderationVerdict } from "../supabase/functions/moderate-pending/verdict.ts";
const categories = {
  harassment: false,
  hate: false,
  "sexual/minors": false,
  violence: false,
  "self-harm": false,
};
const category_scores = {
  harassment: 0,
  hate: 0,
  "sexual/minors": 0,
  violence: 0,
  "self-harm": 0,
};
const response = () => ({
  results: [
    {
      flagged: false,
      categories: { ...categories },
      category_scores: { ...category_scores },
    },
  ],
});
test("provider unavailable or malformed never approves content", () => {
  for (const v of [
    null,
    {},
    { results: [] },
    { results: [{ flagged: false }] },
    { results: [{ flagged: false, categories: {}, category_scores: {} }] },
  ])
    assert.equal(moderationVerdict(v, "Olá", "place_messages"), null);
});
test("real structured clean text can be approved; flags require human review", () => {
  assert.equal(
    moderationVerdict(response(), "Boa visita", "place_messages")?.decision,
    "approved",
  );
  const flagged = response();
  flagged.results[0].flagged = true;
  assert.equal(
    moderationVerdict(flagged, "Texto", "reviews")?.decision,
    "pending",
  );
  const inconsistent = response();
  inconsistent.results[0].categories.violence = true;
  assert.equal(
    moderationVerdict(inconsistent, "Texto", "reviews")?.decision,
    "pending",
  );
});
test("photos profiles places and personal identifiers remain pending", () => {
  for (const type of ["photos", "profiles", "places"])
    assert.equal(
      moderationVerdict(response(), "Texto", type)?.decision,
      "pending",
    );
  for (const text of [
    "Nome: teste@example.com",
    "Telefone 11987654321",
    "https://example.com/pague",
  ])
    assert.equal(
      moderationVerdict(response(), text, "place_messages")?.decision,
      "pending",
    );
});
test("invalid category confidence fails closed", () => {
  const value = response();
  value.results[0].category_scores.violence = NaN;
  assert.equal(moderationVerdict(value, "Olá", "place_messages"), null);
});
