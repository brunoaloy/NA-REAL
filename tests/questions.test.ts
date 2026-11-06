import test from "node:test";
import assert from "node:assert/strict";
import { questionInput } from "../src/validation/domain.ts";
test("custom question preserves real content and rejects unsupported kinds", () => {
  assert.deepEqual(
    questionInput.parse({ kind: "other", body: "  Há acesso por rampa?  " }),
    { kind: "other", body: "Há acesso por rampa?" },
  );
  assert.equal(
    questionInput.safeParse({ kind: "fake", body: "Pergunta" }).success,
    false,
  );
});
test("questions reject empty or oversized bodies before submission", () => {
  for (const body of [" ", "Oi", "x".repeat(501)])
    assert.equal(
      questionInput.safeParse({ kind: "other", body }).success,
      false,
    );
});
