import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import output from "../scripts/lib/supabase-output.cjs";
const { readOnlyArgs, parseQueryRows } = output;
test("read-only query forces JSON independently of terminal output defaults", () => {
  const args = readOnlyArgs("project-ref", "a folder/inventory.sql");
  assert(args.includes("--read-only"));
  assert(args.includes("--remote=project-ref"));
  assert.equal(args[args.indexOf("--output") + 1], "json");
  assert.equal(args[args.indexOf("--file") + 1], "a folder/inventory.sql");
  // Reproduces the Windows failure: default table output is not machine-readable.
  const fakeCli = `const a=process.argv.slice(1);const json=a[a.indexOf('--output')+1]==='json';process.stdout.write(json?JSON.stringify({rows:[{inventory:{relations:[]}}]}):'┌ inventory ┐');`;
  const invoke = (values: string[]) =>
    spawnSync(process.execPath, ["-e", fakeCli, ...values], {
      encoding: "utf8",
    }).stdout;
  assert.throws(() => parseQueryRows(invoke(["db", "query"])), /JSON válido/);
  assert.deepEqual(parseQueryRows(invoke(args)), [
    { inventory: { relations: [] } },
  ]);
});
test("parses actual CLI envelope and Windows BOM/CRLF without altering row data", () => {
  const payload = {
    boundary: "fixture",
    rows: [{ inventory: { relations: [], label: "São Paulo" } }],
    warning: "untrusted data",
  };
  assert.deepEqual(
    parseQueryRows(
      "\uFEFF" +
        JSON.stringify(payload, null, 2).replace(/\n/g, "\r\n") +
        "\r\n",
    ),
    payload.rows,
  );
  assert.deepEqual(parseQueryRows('{"rows":[]}'), []);
});
test("rejects tables, malformed JSON and error envelopes without leaking output", () => {
  for (const value of [
    "┌ private@example.test ┐",
    '{"rows":',
    '{"error":"private@example.test"}',
    "null",
    "[]",
  ]) {
    assert.throws(
      () => parseQueryRows(value),
      (error: Error) =>
        !error.message.includes("private@example.test") &&
        /interrompida/.test(error.message),
    );
  }
});
