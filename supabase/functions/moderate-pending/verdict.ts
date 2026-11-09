import { MODERATION_POLICY_VERSION } from "../_shared/moderation-policy.ts";
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
  const textTargets = [
    "reviews",
    "place_messages",
    "place_questions",
    "question_answers",
    "live_reports",
  ];
  const rules = [
    ["harassment/threatening", "ameaça ou intimidação"],
    ["hate/threatening", "ameaça discriminatória"],
    ["hate", "discriminação"],
    ["harassment", "assédio"],
    ["sexual/minors", "conteúdo sexual envolvendo menores"],
    ["self-harm/instructions", "instruções de autoagressão"],
  ] as const;
  const violation =
    r.flagged === true
      ? rules.find(
          ([key]) =>
            r.categories[key] === true && r.category_scores[key] >= 0.98,
        )
      : undefined;
  const human =
    !textTargets.includes(target) ||
    /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?:\d[\s().-]*){9,}|https?:\/\//i.test(
      text,
    );
  const financial =
    /\b(pix|dep[oó]sito|transfer[eê]ncia|lucro garantido|pague antecipado|compre avalia[çc][õo]es|cinco estrelas em troca)\b/i.test(
      text,
    );
  const pending =
    r.flagged ||
    flags.some(Boolean) ||
    scores.some((score) => Number(score) >= 0.5) ||
    human ||
    financial;
  const decision = violation ? "rejected" : pending ? "pending" : "approved";
  return {
    decision,
    reason: violation
      ? `Reprovado automaticamente por sinal de ${violation[1]}. Você pode pedir revisão humana pelo Perfil.`
      : pending
        ? "Análise automática recebida; precisa de revisão humana antes de publicar."
        : "Texto aprovado automaticamente após análise sem sinalizadores de violação.",
    evidence: {
      policy_version: MODERATION_POLICY_VERSION,
      matched_rule: violation?.[0] ?? null,
      flagged: r.flagged,
      categories: r.categories,
      category_scores: r.category_scores,
      requires_human: decision === "pending",
    },
  };
}
