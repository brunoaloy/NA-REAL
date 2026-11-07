import type { ConfigContext, ExpoConfig } from "expo/config";
import { clientConfiguration } from "./src/validation/client-config.ts";
export default function configure({ config }: ConfigContext): ExpoConfig {
  const result = clientConfiguration(
    process.env.EXPO_PUBLIC_SUPABASE_URL?.trim(),
    (
      process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    )?.trim(),
    process.env.NA_REAL_ALLOW_LOCAL_HTTP === "1",
  );
  if (result.status === "invalid") throw new Error(result.error);
  if (process.env.NA_REAL_REQUIRE_SERVICES === "1" && result.status !== "ready")
    throw new Error(
      "Build exige URL e chave publicável Supabase configuradas.",
    );
  return {
    ...config,
    name: config.name ?? "NA REAL",
    slug: config.slug ?? "na-real",
  };
}
