const { spawnSync } = require("node:child_process");
const { readdirSync } = require("node:fs");
for (const file of readdirSync("tests")
  .filter((p) => p.endsWith(".test.ts"))
  .sort()) {
  const result = spawnSync(
    process.execPath,
    ["--experimental-strip-types", "tests/" + file],
    { stdio: "inherit" },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
