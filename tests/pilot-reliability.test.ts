import { confirmsPendingReview } from "../src/validation/review-delivery.ts";
import { errorMessage } from "../src/validation/errors.ts";
import {
  uncertainWrite,
  UnconfirmedPlaceDelivery,
} from "../src/validation/delivery-error.ts";
import test from "node:test";
import assert from "node:assert/strict";
import {
  sessionLifecycle,
  assertSessionOwner,
} from "../src/validation/session-lifecycle.ts";
import { connectionTransitions } from "../src/validation/connection-transitions.ts";
import { deliverPhoto } from "../src/validation/photo-delivery.ts";
import { batchPhotoUrls } from "../src/validation/photo-urls.ts";
test("an initial auth read cannot restore a signed-out or replaced session", () => {
  const seen: (string | null)[] = [];
  const observer = sessionLifecycle<string | null>((s) => seen.push(s));
  observer.changed(null);
  observer.initial("old-account");
  observer.changed("new-account");
  observer.dispose();
  observer.changed("late-account");
  assert.deepEqual(seen, [null, "new-account"]);
  assert.throws(() => assertSessionOwner("B", "A"));
  assert.throws(() => assertSessionOwner(undefined, "A"));
  assert.equal(assertSessionOwner("A", "A"), "A");
});
test("duplicate network and foreground events do not trigger extra refreshes", () => {
  const v = connectionTransitions();
  assert.equal(v.network(true), false);
  assert.equal(v.network(true), false);
  v.network(false);
  assert.equal(v.network(true), true);
  assert.equal(v.network(true), false);
  assert.equal(v.app(true), false);
  v.app(false);
  assert.equal(v.app(true), true);
  assert.equal(v.app(true), false);
});
test("a lost upload response is confirmed only by the same existing file", async () => {
  let metadata = 0,
    lookups = 0;
  await deliverPhoto({
    ensureMetadata: async () => {
      metadata++;
    },
    upload: async () => ({ error: new Error("response lost") }),
    exists: async () => {
      lookups++;
      return true;
    },
  });
  assert.equal(metadata, 1);
  assert.equal(lookups, 1);
  await assert.rejects(
    deliverPhoto({
      ensureMetadata: async () => {},
      upload: async () => {
        throw new Error("lost");
      },
      exists: async () => false,
    }),
    /lost/,
  );
});
test("metadata or confirmation failures never announce photo success", async () => {
  let uploads = 0;
  await assert.rejects(
    deliverPhoto({
      ensureMetadata: async () => {
        throw new Error("denied");
      },
      upload: async () => {
        uploads++;
        return { error: null };
      },
      exists: async () => true,
    }),
    /denied/,
  );
  assert.equal(uploads, 0);
  await assert.rejects(
    deliverPhoto({
      ensureMetadata: async () => {},
      upload: async () => ({ error: new Error("upload failed") }),
      exists: async () => {
        throw new Error("lookup failed");
      },
    }),
    /upload failed/,
  );
});
test("gallery signs six photos in one request and maps reordered partial results safely", async () => {
  const photos = Array.from({ length: 6 }, (_, i) => ({
    id: String(i),
    owner_id: "owner",
    content_revision: String(i),
  }));
  let calls = 0;
  const got = await batchPhotoUrls(photos, async (paths) => {
    calls++;
    assert.equal(paths.length, 6);
    return {
      error: null,
      data: [
        { path: paths[5], signedUrl: "six" },
        { path: paths[0], signedUrl: "one" },
        { path: paths[2], error: "missing" },
      ],
    };
  });
  assert.equal(calls, 1);
  assert.deepEqual(got, [
    { id: "0", url: "one" },
    { id: "5", url: "six" },
  ]);
  await assert.rejects(
    batchPhotoUrls(photos, async () => ({ error: null, data: [] })),
    /carregar as fotos/,
  );
});

test("ambiguous place deliveries instruct checking profile; validation failures do not", () => {
  assert.equal(uncertainWrite({ message: "Failed to fetch" }), true);
  assert.equal(uncertainWrite({ status: 503 }), true);
  assert.equal(uncertainWrite({ code: "23505", message: "duplicate" }), false);
  assert.equal(uncertainWrite(null), false);
  assert.match(new UnconfirmedPlaceDelivery().message, /Perfil antes/);
});

test("expired authentication gives a clear sign-in instruction without token details", () => {
  for (const value of [
    { name: "AuthSessionMissingError", message: "internal" },
    { code: "PGRST301", message: "JWT PRIVATE" },
    { code: "refresh_token_not_found", message: "PRIVATE" },
  ]) {
    const message = errorMessage(value);
    assert.match(message, /Entre novamente/);
    assert.doesNotMatch(message, /PRIVATE/);
  }
});

test("matching old approved or rejected reviews never confirm a new uncertain write", () => {
  const value = { rating: 4, body: "Visita de teste" };
  assert.equal(
    confirmsPendingReview(
      { id: "own", ...value, moderation_state: "pending" },
      value,
    ),
    true,
  );
  for (const moderation_state of ["approved", "rejected", "removed"])
    assert.equal(
      confirmsPendingReview({ id: "own", ...value, moderation_state }, value),
      false,
    );
  assert.equal(
    confirmsPendingReview(
      { id: "own", rating: 1, body: value.body, moderation_state: "pending" },
      value,
    ),
    false,
  );
});
