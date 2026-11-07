const fs = require("node:fs");
const path = require("node:path");
const { parseEnv } = require("node:util");
const { capture } = require("./private-command.cjs");
const { clientConfiguration } = require("../src/validation/client-config.ts");
const DEFAULT_PROJECT_REF = "zcnfssihiqmbrlwvlsme";
const URL_NAME = "EXPO_PUBLIC_SUPABASE_URL";
const KEY_NAME = "EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY";

function readEnvironment(root, inherited = process.env) {
  const env = { ...inherited };
  // Same development precedence as Expo: shell > development.local > local > development > base.
  for (const name of [
    ".env.development.local",
    ".env.local",
    ".env.development",
    ".env",
  ]) {
    const file = path.join(root, name);
    if (!fs.existsSync(file)) continue;
    for (const [key, value] of Object.entries(
      parseEnv(fs.readFileSync(file, "utf8")),
    )) {
      if (env[key] === undefined) env[key] = value;
    }
  }
  return env;
}
function publicConfiguration(env) {
  const url = env[URL_NAME]?.trim();
  const key = (env[KEY_NAME] || env.EXPO_PUBLIC_SUPABASE_ANON_KEY)?.trim();
  const checked = clientConfiguration(
    url,
    key,
    env.NA_REAL_ALLOW_LOCAL_HTTP === "1",
  );
  return { url, key, ...checked };
}
function selectPublicKey(value) {
  const rows = Array.isArray(value) ? value : value?.rows;
  if (!Array.isArray(rows))
    throw new Error("Não foi possível ler a configuração pública da CLI.");
  // Never use --reveal, secret keys, service_role, or an unlabelled credential.
  const candidates = [
    ...rows.filter((row) => row.type === "publishable"),
    ...rows.filter((row) => row.name === "anon"),
  ];
  for (const row of candidates) {
    if (
      typeof row.api_key === "string" &&
      clientConfiguration("https://example.supabase.co", row.api_key).status ===
        "ready"
    )
      return row.api_key;
  }
  throw new Error("Nenhuma chave publicável ou anon disponível para o app.");
}
function keysFromCli(ref, env) {
  const output = capture(
    process.execPath,
    [
      require.resolve("supabase/dist/supabase.js"),
      "projects",
      "api-keys",
      `--remote=${ref}`,
      "--output",
      "json",
      "--agent=no",
    ],
    { env, timeout: 20000 },
  );
  return selectPublicKey(JSON.parse(output.replace(/^\uFEFF/, "")));
}
function writePublicEnvironment(root, url, key) {
  const checked = clientConfiguration(url, key);
  if (checked.status !== "ready")
    throw new Error(checked.error || "Configuração pública incompleta.");
  const file = path.join(root, ".env.local");
  const original = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  const lines = original
    .split(/\r?\n/)
    .filter(
      (line) =>
        !/^\s*(?:export\s+)?EXPO_PUBLIC_SUPABASE_(?:URL|PUBLISHABLE_KEY)\s*=/.test(
          line,
        ),
    );
  const next =
    lines.join("\n").replace(/\n*$/, "") +
    `\n${URL_NAME}=${JSON.stringify(url)}\n${KEY_NAME}=${JSON.stringify(key)}\n`;
  fs.writeFileSync(file, next.replace(/^\n/, ""), { mode: 0o600 });
}
async function checkConnection(url, key, fetcher = fetch) {
  let response;
  try {
    response = await fetcher(new URL("/rest/v1/rpc/search_places", url), {
      method: "POST",
      headers: { apikey: key, "Content-Type": "application/json" },
      body: JSON.stringify({ term: "", category_filter: "Todos" }),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new Error(
      "Não foi possível conectar ao Supabase. Confira a internet/proxy e tente npm run phone novamente. Nenhum dado foi alterado.",
    );
  }
  if (!response.ok) {
    // Do not echo remote bodies, URLs with credentials, SDK errors or auth headers.
    if (response.status === 401 || response.status === 403)
      throw new Error(
        `Supabase recusou a configuração pública (HTTP ${response.status}). Confira a URL e a chave publicável/anon do mesmo projeto.`,
      );
    throw new Error(
      `A busca de lugares não respondeu corretamente (HTTP ${response.status}). Nenhum dado foi alterado.`,
    );
  }
  const rows = await response.json().catch(() => null);
  if (!Array.isArray(rows))
    throw new Error(
      "Resposta inesperada da busca de lugares. Verifique o projeto Supabase.",
    );
  return rows.length;
}
async function promptPublicConfiguration(defaultUrl) {
  const { createInterface } = require("node:readline/promises");
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    console.log(
      "No painel Supabase → Project Settings → API Keys, copie apenas a chave publishable ou anon.",
    );
    console.log("Não cole access token, service_role ou sb_secret_.");
    const url =
      (await rl.question(`URL do projeto [${defaultUrl}]: `)).trim() ||
      defaultUrl;
    const key = (await rl.question("Chave pública publishable/anon: ")).trim();
    return { url, key };
  } finally {
    rl.close();
  }
}
async function ensureMobileConfiguration({
  root = path.resolve(__dirname, ".."),
  inherited = process.env,
  loadKey = keysFromCli,
  probe = checkConnection,
  log = console.log,
  prompt = process.stdin.isTTY ? promptPublicConfiguration : undefined,
} = {}) {
  const env = readEnvironment(root, inherited);
  let config = publicConfiguration(env);
  if (config.status === "invalid") throw new Error(config.error);
  let save = false;
  if (config.status !== "ready") {
    log(
      "Configuração pública ausente neste computador. Tentando recuperar pelo login local da CLI Supabase…",
    );
    if (!config.url && config.key)
      throw new Error(
        "A chave pública já existe, mas falta EXPO_PUBLIC_SUPABASE_URL. Informe a URL do mesmo projeto no .env.local.",
      );
    const url = config.url || `https://${DEFAULT_PROJECT_REF}.supabase.co`;
    const ref = new URL(url).hostname.match(
      /^([a-z0-9]{20})\.supabase\.co$/,
    )?.[1];
    try {
      if (!ref) throw new Error();
      const key = await loadKey(ref, env);
      config = { url, key, ...clientConfiguration(url, key) };
    } catch {
      if (!prompt)
        throw new Error(
          "Configuração ausente. Execute npx supabase login e depois npm run phone; ou preencha URL e chave publicável/anon em .env.local. Nenhum token deve ser enviado pelo chat.",
        );
      const entered = await prompt(url);
      config = { ...entered, ...clientConfiguration(entered.url, entered.key) };
    }
    if (config.status !== "ready")
      throw new Error(config.error || "Configuração pública incompleta.");
    save = true;
  }
  const count = await probe(config.url, config.key);
  // Persist only after validating both public credential type and actual read access.
  if (save || !env[KEY_NAME])
    writePublicEnvironment(root, config.url, config.key);
  log(
    `Supabase conectado. ${count === 0 ? "Catálogo público vazio; não há lugares aprovados ainda." : "Consulta ao catálogo público aprovada."}`,
  );
  log(
    "Configuração pública verificada, sem exibir chaves e sem alterar o banco.",
  );
  return {
    ...env,
    [URL_NAME]: config.url,
    [KEY_NAME]: config.key,
    NA_REAL_REQUIRE_SERVICES: "1",
  };
}
module.exports = {
  readEnvironment,
  publicConfiguration,
  selectPublicKey,
  writePublicEnvironment,
  checkConnection,
  ensureMobileConfiguration,
  keysFromCli,
};
if (require.main === module) {
  ensureMobileConfiguration().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
