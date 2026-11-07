const fallback = "Não foi possível concluir agora. Tente novamente.";
export function errorMessage(error: unknown): string {
  if (error == null) return fallback;
  const item =
    typeof error === "object"
      ? (error as {
          code?: string;
          message?: unknown;
          name?: string;
          issues?: { path?: unknown[]; message?: string }[];
        })
      : undefined;
  if (item?.name === "ZodError" && item.issues?.length) {
    const fields: Record<string, string> = {
      name: "nome",
      city: "cidade",
      state: "UF",
      address: "endereço",
      rating: "nota de 1 a 5",
      body: "comentário",
      latitude: "latitude",
      longitude: "longitude",
      is_public_venue: "declaração de estabelecimento público",
    };
    const key = String(item.issues[0].path?.[0] ?? "");
    return fields[key]
      ? "Confira o campo " + fields[key] + "."
      : "Confira os campos e informe latitude e longitude juntas.";
  }
  const messages: Record<string, string> = {
    PGRST202:
      "O serviço ainda não está disponível. Tente novamente mais tarde.",
    PGRST205:
      "O serviço ainda não está disponível. Tente novamente mais tarde.",
    "42P01": "O serviço ainda não está disponível. Tente novamente mais tarde.",
    "42883": "O serviço ainda não está disponível. Tente novamente mais tarde.",
    "42501":
      "Você não tem permissão para esta ação. Confira se está conectado à sua conta.",
    "23505":
      "Este conteúdo já foi cadastrado. Consulte ou edite o cadastro existente.",
    "23514": "Confira os campos informados antes de enviar.",
    "22P02": "Confira os campos informados antes de enviar.",
    weak_password: "Escolha uma senha mais forte, com pelo menos 8 caracteres.",
    user_already_exists:
      "Já existe uma conta com esse e-mail. Entre ou recupere sua senha.",
    signup_disabled:
      "Novos cadastros estão indisponíveis no momento. Tente novamente mais tarde.",
    email_address_invalid: "Informe um e-mail válido para continuar.",
    invalid_credentials: "E-mail ou senha incorretos.",
    email_not_confirmed: "Confirme seu e-mail antes de entrar.",
    over_request_rate_limit:
      "Muitas tentativas. Aguarde um pouco antes de tentar novamente.",
    over_email_send_rate_limit:
      "Aguarde um pouco antes de solicitar outro e-mail.",
  };
  if (item?.code && messages[item.code]) return messages[item.code];
  const message =
    typeof item?.message === "string"
      ? item.message
      : typeof error === "string"
        ? error
        : "";
  if (/network|failed to fetch|fetch failed|timeout|timed out/i.test(message))
    return "Não foi possível conectar. Confira sua internet e tente novamente.";
  // Explicit server rules, without echoing SQL, row contents or internal diagnostics.
  if (message.startsWith("Lugar semelhante já cadastrado"))
    return "Um lugar semelhante já foi cadastrado ou aguarda revisão. Pesquise antes de enviar.";
  if (message.startsWith("Limite de"))
    return "Limite de contribuições atingido. Aguarde antes de tentar novamente.";
  // Preserve deliberate local UI guidance, never arbitrary backend object messages.
  if (
    error instanceof Error &&
    !item?.code &&
    message.length <= 300 &&
    !/postgres(?:ql)?:\/\/|sb_(?:secret|publishable)_|eyJ[\w-]+\.|password\s*[=:]|token\s*[=:]|select\s|insert\s|constraint|schema|relation\s/i.test(
      message,
    )
  )
    return message || fallback;
  return fallback;
}
