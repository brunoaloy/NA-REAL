import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeJpeg } from "../supabase/functions/_shared/jpeg.ts";
test("JPEG strips EXIF and comments without copying metadata", () => {
  const input = new Uint8Array([
    255, 216, 255, 225, 0, 6, 1, 2, 3, 4, 255, 254, 0, 4, 8, 9, 255, 218, 0, 2,
    7, 255, 217,
  ]);
  assert.deepEqual(
    Array.from(sanitizeJpeg(input)!),
    [255, 216, 255, 218, 0, 2, 7, 255, 217],
  );
});
test("malformed or oversized image is quarantined", () => {
  for (const input of [
    new Uint8Array([1, 2]),
    new Uint8Array([255, 216, 255, 225, 0, 20]),
    new Uint8Array(5242881),
  ])
    assert.equal(sanitizeJpeg(input), null);
});
