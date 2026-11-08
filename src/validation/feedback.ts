import { z } from "zod";
const input = z.object({
  screen: z
    .string()
    .trim()
    .min(2, "Informe em qual tela aconteceu.")
    .max(120, "Informe uma tela com até 120 caracteres."),
  description: z
    .string()
    .trim()
    .min(
      10,
      "Conte um pouco mais sobre o que aconteceu (mínimo de 10 caracteres).",
    )
    .max(2000, "Seu relato pode ter até 2.000 caracteres."),
  expected: z
    .string()
    .trim()
    .max(1000, "O resultado esperado pode ter até 1.000 caracteres."),
});
export type FeedbackContext = {
  version: string;
  build: string;
  platform: string;
  os: string;
  model: string;
};
export function feedbackReport(value: unknown, context: FeedbackContext) {
  const result = input.safeParse(value);
  if (!result.success) throw new Error(result.error.issues[0].message);
  const data = result.data;
  return [
    "NA REAL — Relato de teste",
    `Versão: ${context.version}`,
    `Execução: ${context.build}`,
    `Sistema: ${context.platform} ${context.os}`,
    `Aparelho: ${context.model}`,
    "",
    `Tela: ${data.screen}`,
    "O que aconteceu:",
    data.description,
    "",
    "O que eu esperava:",
    data.expected || "Não informado",
  ].join("\n");
}
