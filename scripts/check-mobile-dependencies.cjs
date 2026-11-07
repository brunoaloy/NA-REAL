const fs = require("node:fs");
const path = require("node:path");
function checkMobileDependencies(root) {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(root, "package.json"), "utf8"),
  );
  const lock = JSON.parse(
    fs.readFileSync(path.join(root, "package-lock.json"), "utf8"),
  );
  const required = [...Object.keys(pkg.dependencies || {}), "@expo/ngrok"];
  const missing = required.filter((name) => {
    const location = `node_modules/${name}`;
    try {
      const installed = JSON.parse(
        fs.readFileSync(path.join(root, location, "package.json"), "utf8"),
      );
      const expected = lock.packages?.[location]?.version;
      return !expected || installed.version !== expected;
    } catch {
      return true;
    }
  });
  if (missing.length) {
    const summary =
      missing.slice(0, 5).join(", ") +
      (missing.length > 5 ? ` e mais ${missing.length - 5}` : "");
    throw new Error(
      `Dependências ausentes ou desatualizadas: ${summary}.\nPare o Expo com Ctrl+C, execute npm ci nesta pasta e aguarde terminar sem erros. Depois execute npm run phone e leia o novo QR code.`,
    );
  }
}
module.exports = { checkMobileDependencies };
