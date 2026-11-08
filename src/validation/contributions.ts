export type Contribution = {
  id: string;
  target_type: string;
  target_id?: string;
  state: string;
  created_at: string;
  title?: string | null;
  body?: string | null;
  place_id?: string | null;
  moderation_actions?: {
    id: string;
    decision: string;
    reason: string;
    created_at: string;
  }[];
};
export function latestContributions(items: Contribution[]) {
  const seen = new Set<string>();
  return [...items]
    .sort(
      (a, b) =>
        b.created_at.localeCompare(a.created_at) || b.id.localeCompare(a.id),
    )
    .filter((item) => {
      if (item.state === "superseded") return false;
      const key = item.target_type + ":" + (item.target_id ?? item.id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}
export function contributionDecision(item: Contribution) {
  return (
    [...(item.moderation_actions ?? [])]
      .filter((a) => a.decision === item.state)
      .sort(
        (a, b) =>
          b.created_at.localeCompare(a.created_at) || b.id.localeCompare(a.id),
      )[0]
      ?.reason.trim() ?? ""
  );
}
export function contributionStatus(state: string) {
  switch (state) {
    case "approved":
      return {
        label: "Aprovado",
        body: "A revisão aprovou sua contribuição. A exibição também depende de o lugar e a conta estarem disponíveis.",
        color: "#0F766E",
        background: "#E8F3ED",
      };
    case "rejected":
      return {
        label: "Precisa de ajuste",
        body: "Confira o motivo da revisão. Você pode pedir uma nova análise e explicar o que precisa ser corrigido.",
        color: "#9A4525",
        background: "#FFF0E5",
      };
    case "removed":
      return {
        label: "Removido",
        body: "Esta contribuição foi retirada de circulação. Confira o motivo e peça uma revisão se necessário.",
        color: "#9A4525",
        background: "#FFF0E5",
      };
    default:
      return {
        label: "Em análise",
        body: "Recebemos sua contribuição. Ela ainda não está publicada; você pode acompanhar a decisão por aqui.",
        color: "#6D5B28",
        background: "#F8F3DF",
      };
  }
}
export function contributionTitle(item: Contribution) {
  const type: Record<string, string> = {
    places: "Lugar",
    reviews: "Avaliação",
    profiles: "Perfil",
    photos: "Foto",
    place_messages: "Mensagem",
    place_questions: "Pergunta",
    question_answers: "Resposta",
    live_reports: "Atualização ao vivo",
  };
  const text = (item.title || item.body || "").trim();
  return (
    (type[item.target_type] ?? "Contribuição") +
    (text ? " · " + text.slice(0, 90) + (text.length > 90 ? "…" : "") : "")
  );
}
