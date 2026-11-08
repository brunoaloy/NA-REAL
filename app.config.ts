import type { ConfigContext, ExpoConfig } from "expo/config";
import { distributionIssues } from "./src/validation/distribution.ts";
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
  const resolved: ExpoConfig = {
    ...config,
    name: config.name ?? "NA REAL",
    slug: config.slug ?? "na-real",
    ios: {
      ...config.ios,
      ...(process.env.NA_REAL_IOS_BUNDLE_ID
        ? { bundleIdentifier: process.env.NA_REAL_IOS_BUNDLE_ID }
        : {}),
    },
    android: {
      ...config.android,
      ...(process.env.NA_REAL_ANDROID_PACKAGE
        ? { package: process.env.NA_REAL_ANDROID_PACKAGE }
        : {}),
    },
    extra: {
      ...config.extra,
      ...(process.env.EXPO_PUBLIC_EAS_PROJECT_ID
        ? {
            eas: {
              ...config.extra?.eas,
              projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
            },
          }
        : {}),
    },
  };
  if (process.env.NA_REAL_REQUIRE_DISTRIBUTION === "1") {
    const issues = distributionIssues(
      resolved,
      process.env.EAS_BUILD_PLATFORM || "ios",
    );
    if (issues.length) throw new Error(issues.join(" "));
  }
  return resolved;
}
