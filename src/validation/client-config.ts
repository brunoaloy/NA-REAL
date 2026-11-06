export type ClientConfiguration = {
  status: "missing" | "invalid" | "ready";
  error?: string;
};
/** Public credentials only. Error messages deliberately never include supplied values. */
export function clientConfiguration(
  url?: string,
  key?: string,
  allowHttp = false,
): ClientConfiguration {
  if (key) {
    if (key.startsWith("sb_secret_"))
      return {
        status: "invalid",
        error: "Chave administrativa proibida na configuração pública.",
      };
    if (!key.startsWith("sb_publishable_")) {
      try {
        const parts = key.split(".");
        if (parts.length !== 3) throw new Error();
        const role = JSON.parse(
          atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
        ).role;
        if (role !== "anon")
          return {
            status: "invalid",
            error:
              "A chave pública deve ser publishable ou JWT anon; service_role não pode ir para o app.",
          };
      } catch {
        return {
          status: "invalid",
          error: "Formato de chave pública Supabase inválido.",
        };
      }
    }
  }
  if (url)
    try {
      const parsed = new URL(url);
      if (
        parsed.username ||
        parsed.password ||
        parsed.search ||
        parsed.hash ||
        parsed.pathname !== "/" ||
        (parsed.protocol !== "https:" &&
          !(allowHttp && parsed.protocol === "http:"))
      )
        throw new Error();
    } catch {
      return {
        status: "invalid",
        error:
          "URL Supabase inválida. Use HTTPS; HTTP é permitido apenas em desenvolvimento.",
      };
    }
  if (!url || !key) return { status: "missing" };
  return { status: "ready" };
}
