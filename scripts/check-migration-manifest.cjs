// Refuse added, removed or altered migration files since the audited plan.
const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const root = path.resolve(__dirname, "..");
const expected = JSON.parse(
  fs.readFileSync(path.join(__dirname, "migrations/manifest.json"), "utf8"),
);
const directory = path.join(root, "supabase/migrations");
const files = fs
  .readdirSync(directory)
  .filter((name) => name.endsWith(".sql"))
  .sort();
if (JSON.stringify(files) !== JSON.stringify(Object.keys(expected).sort())) {
  console.error(
    "FAIL: migration set differs from the controlled plan. Re-audit before applying.",
  );
  process.exit(1);
}
for (const name of files) {
  const bytes = fs.readFileSync(path.join(directory, name));
  // Git may check out CRLF on Windows; hashes attest canonical SQL with LF.
  const canonical = bytes.toString("utf8").replace(/\r\n/g, "\n");
  const hash = createHash("sha256").update(canonical).digest("hex");
  if (hash !== expected[name]) {
    console.error("FAIL: migration changed: " + name);
    process.exit(1);
  }
}
console.log(
  "PASS: all " +
    files.length +
    " canonical migration hashes match the audited plan.",
);
