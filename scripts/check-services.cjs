// Reports names and readiness only. Never dump config values, secrets or CLI status.
const { existsSync } = require("node:fs");
const { clientConfiguration } = require("../src/validation/client-config.ts");
const c = clientConfiguration(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  process.env.NA_REAL_ALLOW_LOCAL_HTTP === "1",
);
console.log("Formato Supabase público (sem teste de conexão): " + c.status);
if (c.error) console.error(c.error);
console.log(
  "Projeto remoto vinculado: " +
    (existsSync("supabase/.temp/project-ref")
      ? "sim (identidade não impressa)"
      : "não"),
);
for (const name of [
  "EXPO_PUBLIC_MAP_STYLE_URL",
  "MODERATION_API_KEY",
  "EXPO_TOKEN",
])
  console.log(
    name +
      ": " +
      (process.env[name] ? "presente, operação não verificada" : "ausente"),
  );
if (
  c.status === "invalid" ||
  (process.argv.includes("--require") && c.status !== "ready")
)
  process.exitCode = 1;
