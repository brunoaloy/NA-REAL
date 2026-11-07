const { spawn } = require("node:child_process");
// Run from the repository root on Windows, macOS and Linux. Dotenv is loaded by Expo.
const path = require("node:path");
process.chdir(path.resolve(__dirname, ".."));
console.log("NA REAL no Expo Go — mantenha este terminal aberto.");
console.log(
  "No iPhone, leia o QR code com a Câmera e escolha Abrir no Expo Go.",
);
console.log(
  "O túnel permite usar o celular em outra rede. Não exige Xcode nem EAS.",
);
const child = spawn(
  process.execPath,
  [
    require.resolve("expo/bin/cli"),
    "start",
    "--go",
    "--tunnel",
    "ngrok",
    ...process.argv.slice(2),
  ],
  { stdio: "inherit", env: process.env },
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
