// Uses Supabase CLI login from the operator's computer; never embeds a token.
const { spawn } = require("node:child_process");
console.log(
  "Publicando os quatro serviços auxiliares no projeto NA REAL. Não aprova cadastros nem altera contas.",
);
const child = spawn(
  process.execPath,
  [
    require.resolve("supabase/dist/supabase.js"),
    "functions",
    "deploy",
    "moderate-pending",
    "prepare-photo",
    "delete-photo",
    "delete-account",
    "--remote=zcnfssihiqmbrlwvlsme",
    "--use-api",
    "--no-verify-jwt",
    "--yes",
  ],
  { stdio: "inherit", env: process.env },
);
child.on("error", () => {
  console.error("Não foi possível iniciar a CLI Supabase.");
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
