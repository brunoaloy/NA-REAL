const { capture } = require("./private-command.cjs");
const { distributionIssues } = require("../src/validation/distribution.ts");
const config = JSON.parse(
  capture(
    process.execPath,
    [require.resolve("expo/bin/cli"), "config", "--json"],
    {
      env: {
        ...process.env,
        EXPO_OFFLINE: "1",
        NA_REAL_REQUIRE_DISTRIBUTION: "0",
      },
    },
  ),
);
const issues = distributionIssues(
  config,
  process.argv.includes("--android") ? "android" : "ios",
);
for (const issue of issues) console.log("PENDENTE: " + issue);
console.log(
  "CONFERIR COM O PROPRIETÁRIO: assinatura Apple Developer, App Store Connect, SMTP/redirects e testes reais em aparelhos.",
);
console.log("Nenhum build, cobrança, convite ou envio à loja foi iniciado.");
if (issues.length) process.exitCode = 1;
else
  console.log(
    "PASS configuração local de identidade/EAS; não comprova conta Apple ou instalação.",
  );
