import { MODERATION_POLICY_VERSION } from "../../supabase/functions/_shared/moderation-policy.ts";
export function moderationRun(value: unknown) {
  const v = value as Record<string, unknown> | null;
  if (v?.status === "not_configured")
    throw new Error(
      "A IA ainda não está configurada. Adicione MODERATION_API_KEY nos secrets do Supabase; os envios continuam pendentes.",
    );
  if (!v || v.policy_version !== MODERATION_POLICY_VERSION)
    throw new Error(
      "O serviço de IA precisa ser atualizado para esta versão. Publique novamente as funções antes de ativar a análise automática.",
    );
  for (const key of ["processed", "approved", "rejected", "review", "failed"]) {
    if (!Number.isInteger(v[key]) || Number(v[key]) < 0 || Number(v[key]) > 10)
      throw new Error(
        "Não foi possível confirmar o resultado da análise. Confira a fila antes de repetir.",
      );
  }
  const { processed, approved, rejected, review, failed } = v as Record<
    string,
    number
  >;
  if (
    approved + rejected + review !== processed ||
    processed + failed > 10 ||
    !["completed", "partial"].includes(String(v.status))
  )
    throw new Error(
      "O serviço retornou uma análise incompleta. Confira a fila antes de repetir.",
    );
  return {
    processed,
    failed,
    message: `${approved} aprovados · ${rejected} reprovados · ${review} para sua revisão.${failed ? ` ${failed} não puderam ser analisados e continuam pendentes.` : ""}`,
  };
}
