export function moderationPreview(type: string, payload: unknown) {
  const p =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : {};
  const text = (key: string) =>
    typeof p[key] === "string" ? (p[key] as string).trim() : "";
  const labels: Record<string, string> = {
    places: "Lugar",
    profiles: "Perfil",
    photos: "Foto",
    reviews: "Avaliação",
    place_messages: "Mensagem",
    place_questions: "Pergunta",
    question_answers: "Resposta",
    live_reports: "Atualização",
  };
  const fields = (
    type === "places"
      ? [
          ["Categoria", text("category")],
          ["Cidade", [text("city"), text("state")].filter(Boolean).join(", ")],
          ["Endereço", text("address")],
          ["Descrição", text("description")],
        ]
      : type === "profiles"
        ? [
            ["Nome", text("display_name")],
            ["Descrição", text("bio")],
          ]
        : [["Conteúdo", text("body")]]
  )
    .filter(([, value]) => Boolean(value))
    .map(([label, value]) => ({ label, value }));
  return { title: text("name") || labels[type] || "Contribuição", fields };
}
