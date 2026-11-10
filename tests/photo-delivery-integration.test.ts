import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { deliverPhoto } from "../src/validation/photo-delivery.ts";
// Run the actual service against a controlled transport, without camera, tokens or remote writes.
function fixture() {
  const rows = new Map(),
    objects = new Map();
  let serial = 0,
    inserts = 0,
    failUpload = false,
    loseMetadata = true,
    loseUpload = true;
  const database = {
    from(table) {
      assert.equal(table, "photos");
      let value;
      const where = {};
      return {
        select() {
          return this;
        },
        eq(k, v) {
          where[k] = v;
          return this;
        },
        insert(v) {
          value = v;
          return this;
        },
        async maybeSingle() {
          return {
            error: null,
            data:
              [...rows.values()].find((r) =>
                Object.entries(where).every(([k, v]) => r[k] === v),
              ) ?? null,
          };
        },
        async single() {
          inserts++;
          const row = { ...value, id: "row-" + inserts };
          rows.set(row.object_path, row);
          if (loseMetadata) {
            loseMetadata = false;
            return { error: new Error("metadata response lost"), data: null };
          }
          return { error: null, data: row };
        },
        delete() {
          throw new Error("Never delete a receipt for an uncertain upload");
        },
      };
    },
    storage: {
      from(bucket) {
        assert.equal(bucket, "community-photos");
        return {
          async upload(path, bytes, options) {
            assert.equal(options.upsert, false);
            if (failUpload) return { error: new Error("network lost") };
            if (objects.has(path))
              return { error: new Error("already exists") };
            objects.set(path, bytes.byteLength);
            if (loseUpload) {
              loseUpload = false;
              return { error: new Error("upload response lost") };
            }
            return { error: null };
          },
          async list(owner) {
            return {
              error: null,
              data: [...objects]
                .filter(([path]) => path.startsWith(owner + "/"))
                .map(([path, size]) => ({
                  name: path.slice(owner.length + 1),
                  metadata: { size },
                })),
            };
          },
        };
      },
    },
  };
  const output = ts.transpileModule(
    readFileSync(new URL("../src/services/photos.ts", import.meta.url), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  const exports = {};
  new Function("require", "exports", output)((name) => {
    if (name === "../validation/photo-delivery") return { deliverPhoto };
    if (name === "../validation/diagnostics")
      return { localDiagnostics: { record() {} } };
    if (name === "expo-crypto")
      return { randomUUID: () => "fixed-" + ++serial };
    if (name === "./supabase") return { db: () => database };
    if (name === "./catalog")
      return {
        userId: async (expected) => {
          assert.equal(expected, "owner");
          return "owner";
        },
      };
    return {};
  }, exports);
  return {
    rows,
    objects,
    send: exports.uploadPreparedPhoto,
    fail(value) {
      failUpload = value;
    },
    get inserts() {
      return inserts;
    },
  };
}
test("lost metadata and upload responses recover the same photo without duplicate rows or files", async () => {
  const f = fixture(),
    photo = { uri: "fixture", bytes: new ArrayBuffer(8) };
  assert.equal(await f.send({ placeId: "place" }, photo, "owner"), true);
  assert.equal(await f.send({ placeId: "place" }, photo, "owner"), true);
  assert.equal(f.inserts, 1);
  assert.equal(f.rows.size, 1);
  assert.equal(f.objects.size, 1);
});
test("failed uploads retain their receipt and a retry succeeds without inserting another photo", async () => {
  const f = fixture(),
    photo = { uri: "fixture", bytes: new ArrayBuffer(8) };
  f.fail(true);
  await assert.rejects(
    f.send({ profileId: "owner" }, photo, "owner"),
    /network lost/,
  );
  assert.equal(f.rows.size, 1);
  assert.equal(f.objects.size, 0);
  f.fail(false);
  assert.equal(await f.send({ profileId: "owner" }, photo, "owner"), true);
  assert.equal(f.inserts, 1);
  assert.equal(f.objects.size, 1);
});
