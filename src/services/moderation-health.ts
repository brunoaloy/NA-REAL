import { probeFunction } from "../validation/function-health";
export async function moderationServices() {
  const base = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  if (!base) throw new Error("Conexão com o NA REAL não configurada.");
  const [triage, photos] = await Promise.all([
    probeFunction(`${base}/functions/v1/moderate-pending`),
    probeFunction(`${base}/functions/v1/prepare-photo`),
  ]);
  return { triage, photos };
}
