// Docker-free, cross-platform control. Never applies migrations or changes configuration.
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { randomUUID } = require("node:crypto");
const root = path.resolve(__dirname, "..");
const ref = "zcnfssihiqmbrlwvlsme";
const cli = path.join(root, "node_modules/supabase/dist/supabase.js");
function run(args, visible = false) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd: root,
    encoding: "utf8",
    stdio: visible ? "inherit" : ["inherit", "pipe", "pipe"],
    maxBuffer: 20 * 1024 * 1024,
  });
  if (result.error || result.status !== 0)
    throw new Error(
      "CLI failed. Stop; no migrations were applied by this command. Run the same CLI step directly for diagnostics without publishing credentials.",
    );
  return result.stdout;
}
function readOnly(file) {
  const output = run([
    "db",
    "query",
    "--remote=" + ref,
    "--read-only",
    "--file",
    file,
  ]);
  const result = JSON.parse(output);
  if (!Array.isArray(result.rows))
    throw new Error("Unexpected CLI result; stop.");
  return result.rows;
}
function main() {
  const mode = process.argv[2] || "prepare";
  if (!["prepare", "verify"].includes(mode))
    throw new Error("Use prepare or verify. This tool has no apply mode.");
  const check = spawnSync(
    process.execPath,
    [path.join(__dirname, "check-migration-manifest.cjs")],
    { cwd: root, stdio: "inherit" },
  );
  if (check.status !== 0)
    throw new Error("Migration manifest changed; re-audit.");
  if (run(["--version"]).trim() !== "3.0.0")
    throw new Error("CLI 3.0.0 required by the audited plan.");
  const inventory = readOnly("scripts/migrations/inventory.sql")[0]?.inventory;
  if (!inventory || !Array.isArray(inventory.relations))
    throw new Error("Incomplete inventory; stop.");
  const directory = path.join(
    root,
    ".local-services",
    "remote-" + randomUUID(),
  );
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  fs.writeFileSync(
    path.join(directory, "inventory.json"),
    JSON.stringify({ project_ref: ref, inventory }, null, 2),
    { mode: 0o600 },
  );
  fs.copyFileSync(
    path.join(__dirname, "migrations/manifest.json"),
    path.join(directory, "migration-manifest.json"),
  );
  console.log(
    "Saved private metadata snapshot: " + path.relative(root, directory),
  );
  console.log(
    "This is NOT a complete database/Auth/Storage backup. It contains no row or file backup.",
  );
  console.log(
    "Public relations: " +
      inventory.relations.filter((r) => r.schema === "public").length +
      "; Auth users: " +
      inventory.auth_users +
      "; Storage objects: " +
      inventory.storage_objects +
      "; buckets: " +
      inventory.buckets.length,
  );
  run(["migration", "list", "--remote=" + ref], true);
  if (mode === "verify") {
    const rows = readOnly("scripts/migrations/postflight.sql");
    const checks = rows[0]?.checks;
    if (!checks || Object.values(checks).some((value) => value !== true)) {
      fs.writeFileSync(
        path.join(directory, "verification.json"),
        JSON.stringify(checks ?? {}, null, 2),
        { mode: 0o600 },
      );
      throw new Error(
        "Remote structural verification failed. Inspect private verification.json; Sprint remains open.",
      );
    }
    console.log(
      "PASS remote structure/history/RLS/buckets/privileges. Real A/B user flows are still required.",
    );
  }
  run(["db", "push", "--remote=" + ref, "--dry-run", "--skip-vault"], true);
  console.log(
    mode === "prepare"
      ? "Preparation finished. Review snapshot, recovery strategy and dry-run. No real push was executed."
      : "Verification finished. Confirm the dry-run shows no pending migrations; this tool does not attest real user writes.",
  );
}
try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
