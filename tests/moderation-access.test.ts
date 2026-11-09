import test from "node:test";
import assert from "node:assert/strict";
import { moderationAccess } from "../src/validation/moderation-access.ts";
test("a signed-out session cannot open the portal with a cached moderator role", () => {
  assert.equal(
    moderationAccess(false, { isPending: false, isError: false, data: true }),
    "login",
  );
});
test("pending and failed role checks never expose the queue even with old granted data", () => {
  assert.equal(
    moderationAccess(true, { isPending: true, isError: false, data: true }),
    "checking",
  );
  assert.equal(
    moderationAccess(true, { isPending: false, isError: true, data: true }),
    "unavailable",
  );
});
test("only an explicit successful moderator result grants the portal view", () => {
  for (const data of [undefined, false])
    assert.equal(
      moderationAccess(true, { isPending: false, isError: false, data }),
      "denied",
    );
  assert.equal(
    moderationAccess(true, { isPending: false, isError: false, data: true }),
    "granted",
  );
});
