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
    "{}",
    "[null]",
    "[1]",
    '{"rows":[],"error":"private@example.test"}',
  ]) {
    assert.throws(
      () => parseQueryRows(value),
      (error: Error) =>
        !error.message.includes("private@example.test") &&
        /interrompida/.test(error.message),
    );
  }
});

test("parses real terminal-mode row array and empty result", () => {
  const rows = [
    {
      inventory: {
        relations: [],
        buckets: [],
        auth_users: 0,
        storage_objects: 0,
      },
    },
  ];
  assert.deepEqual(parseQueryRows(JSON.stringify(rows)), rows);
  assert.deepEqual(parseQueryRows("[]"), []);
});

test("preparation completes with terminal and agent CLI formats and never applies", async () => {
  const fs = await import("node:fs");
  const os = await import("node:os");
  const path = await import("node:path");
  const root = path.resolve(".");
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "nareal-cli-format-"));
  try {
    for (const name of [
      "scripts/remote-migrations.cjs",
      "scripts/check-migration-manifest.cjs",
      "scripts/lib/supabase-output.cjs",
      "scripts/migrations/manifest.json",
    ]) {
      fs.mkdirSync(path.dirname(path.join(fixture, name)), { recursive: true });
      fs.copyFileSync(path.join(root, name), path.join(fixture, name));
    }
    fs.cpSync(
      path.join(root, "supabase/migrations"),
      path.join(fixture, "supabase/migrations"),
      { recursive: true },
    );
    const binary = path.join(fixture, "node_modules/supabase/dist/supabase.js");
    fs.mkdirSync(path.dirname(binary), { recursive: true });
    fs.writeFileSync(
      binary,
      `
      const fs=require('node:fs');const a=process.argv.slice(2);
      fs.appendFileSync(process.env.NAREAL_TEST_CALLS,JSON.stringify(a)+'\\n');
      if(a.includes('--version')) process.stdout.write('3.0.0');
      else if(a[0]==='db'&&a[1]==='query') {
        if(!a.includes('--read-only')||a[a.indexOf('--output')+1]!=='json') process.exit(2);
        const rows=[{inventory:{relations:[],buckets:[],auth_users:0,storage_objects:0}}];
        process.stdout.write(JSON.stringify(process.env.NAREAL_TEST_FORMAT==='terminal'?rows:{rows}));
      } else if(a[0]==='migration'&&a[1]==='list') process.stdout.write('fixture history');
      else if(a[0]==='db'&&a[1]==='push'&&a.includes('--dry-run')&&a.includes('--skip-vault')) process.stdout.write('fixture dry-run');
      else process.exit(3);
    `,
    );
    for (const format of ["terminal", "agent"]) {
      const calls = path.join(fixture, "calls-" + format + ".jsonl");
      const result = spawnSync(
        process.execPath,
        [path.join(fixture, "scripts/remote-migrations.cjs"), "prepare"],
        {
          cwd: fixture,
          encoding: "utf8",
          env: {
            ...process.env,
            NAREAL_TEST_FORMAT: format,
            NAREAL_TEST_CALLS: calls,
          },
        },
      );
      assert.equal(result.status, 0, result.stderr);
      assert.match(result.stdout, /Preparation finished/);
      const actions = fs
        .readFileSync(calls, "utf8")
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line) as string[]);
      assert(actions.some((a) => a[0] === "db" && a[1] === "query"));
      assert(actions.some((a) => a[0] === "migration" && a[1] === "list"));
      assert(
        actions.some(
          (a) => a[0] === "db" && a[1] === "push" && a.includes("--dry-run"),
        ),
      );
      assert(
        actions.every(
          (a) => a[0] !== "db" || a[1] !== "push" || a.includes("--dry-run"),
        ),
      );
    }
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});
