const { spawn } = require("node:child_process");
const path = require("node:path");
const { ensureMobileConfiguration } = require("./setup-mobile.cjs");
async function main() {
  process.chdir(path.resolve(__dirname, ".."));
  const env = await ensureMobileConfiguration();
  console.log("NA REAL no Expo Go — mantenha este terminal aberto.");
  console.log(
    "No iPhone, leia o QR code com a Câmera e escolha Abrir no Expo Go.",
  );
  const args = process.argv.slice(2);
  const local = args.includes("--lan") || args.includes("--localhost");
  console.log(
    local
      ? "Use a mesma rede Wi-Fi no computador e no iPhone."
      : "O túnel permite usar o celular em outra rede. Não exige Xcode nem EAS.",
  );
  const connection =
    local || args.includes("--tunnel") ? [] : ["--tunnel", "ngrok"];
  const child = spawn(
    process.execPath,
    [
      require.resolve("expo/bin/cli"),
      "start",
      "--go",
      "--clear",
      ...connection,
      ...args,
    ],
    { stdio: "inherit", env },
  );
  child.on("error", () => {
    console.error(
      "Não foi possível iniciar o Expo. Execute npm ci e tente novamente.",
    );
    process.exitCode = 1;
  });
  child.on("exit", (code) => {
    process.exitCode = code ?? 1;
  });
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
