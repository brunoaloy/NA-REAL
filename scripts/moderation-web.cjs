const { spawn } = require("node:child_process");
const { readEnvironment } = require("./setup-mobile.cjs");
const build = process.argv.includes("--build");
const env = {
  ...readEnvironment(process.cwd()),
  ...process.env,
  NA_REAL_MODERATION_WEB: "1",
};
const args = build
  ? ["export", "--platform", "web", "--output-dir", "dist/moderation"]
  : ["start", "--web", "--clear", "--port", "8082"];
const child = spawn(
  process.execPath,
  [require.resolve("expo/bin/cli"), ...args],
  { env, stdio: "inherit" },
);
child.on("error", () => {
  console.error("Não foi possível iniciar a versão web de moderação.");
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
