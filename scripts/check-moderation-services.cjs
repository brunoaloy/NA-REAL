// Read-only checks: no session/token, payloads, decisions or account changes.
const { readEnvironment } = require("./setup-mobile.cjs");
async function main() {
  const env = { ...readEnvironment(process.cwd()), ...process.env };
  const base = env.EXPO_PUBLIC_SUPABASE_URL;
  if (!base) throw new Error("Configure a URL pública Supabase do NA REAL.");
  let failed = false;
  for (const slug of [
    "moderate-pending",
    "prepare-photo",
    "delete-photo",
    "delete-account",
  ]) {
    const url = `${base.replace(/\/$/, "")}/functions/v1/${slug}`;
    try {
      const response = await fetch(url, {
        method: "GET",
        signal: AbortSignal.timeout(15000),
      });
      const preflight = await fetch(url, {
        method: "OPTIONS",
        headers: {
          Origin:
            "https://na-real-moderacao-bruno.brunoaloy-gruposetup.chatgpt.site",
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers":
            "authorization,apikey,content-type,x-client-info",
        },
        signal: AbortSignal.timeout(15000),
      });
      const allowed = (
        preflight.headers.get("access-control-allow-headers") || ""
      )
        .toLowerCase()
        .split(",")
        .map((v) => v.trim());
      const ok =
        response.status === 405 &&
        preflight.ok &&
        ["authorization", "apikey", "content-type", "x-client-info"].every(
          (v) => allowed.includes(v),
        );
      if (!ok) failed = true;
      console.log(
        `${slug}: ${ok ? "publicado e preflight aceito" : response.status === 404 ? "não publicado (404)" : "requer verificação"} · GET ${response.status} · OPTIONS ${preflight.status}`,
      );
    } catch {
      failed = true;
      console.log(`${slug}: conexão indisponível; não foi possível confirmar.`);
    }
  }
  if (failed) process.exitCode = 1;
  console.log(
    "Esta checagem não testa sua sessão nem executa ações de moderação.",
  );
}
main().catch(() => {
  console.error("Não foi possível verificar a configuração dos serviços.");
  process.exitCode = 1;
});
