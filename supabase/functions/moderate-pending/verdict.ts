/** Fail closed on incomplete provider output. Retain flags/scores, never copy source content to logs. */
export function moderationVerdict(
  value: unknown,
  text: string,
  target: string,
) {
  if (
    !value ||
    typeof value !== "object" ||
    !("results" in value) ||
    !Array.isArray(value.results) ||
    value.results.length !== 1
  )
    return null;
  const r = value.results[0];
  if (
    !r ||
    typeof r.flagged !== "boolean" ||
    !r.categories ||
    typeof r.categories !== "object" ||
    !r.category_scores ||
    typeof r.category_scores !== "object"
  )
    return null;
  const required = [
    "harassment",
    "hate",
    "sexual/minors",
    "violence",
    "self-harm",
  ];
  if (
    required.some(
      (k) =>
        typeof r.categories[k] !== "boolean" ||
        typeof r.category_scores[k] !== "number",
    )
  )
    return null;
  const flags = Object.values(r.categories);
  const scores = Object.values(r.category_scores);
  if (
    !flags.length ||
    flags.some((v) => typeof v !== "boolean") ||
    !scores.length ||
    scores.some(
      (v) => typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > 1,
    )
  )
    return null;
  const human =
    ["places", "profiles", "photos"].includes(target) ||
    /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?:\d[\s().-]*){9,}|https?:\/\//i.test(
      text,
    );
  const financial =
    /\b(pix|dep[oó]sito|transfer[eê]ncia|lucro garantido|pague antecipado|compre avalia[çc][õo]es|cinco estrelas em troca)\b/i.test(
      text,
    );
  const pending = r.flagged || flags.some(Boolean) || human || financial;
  return {
    decision: pending ? "pending" : "approved",
    reason: pending
      ? "Análise real recebida; exige revisão humana."
      : "Análise automática recebida sem sinalizadores; política de texto aplicada.",
    evidence: {
      flagged: r.flagged,
      categories: r.categories,
      category_scores: r.category_scores,
      requires_human: human || financial,
    },
  };
}
