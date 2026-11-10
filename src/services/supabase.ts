import { clientConfiguration } from "../validation/client-config";
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const key = (
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
)?.trim();
const configuration = clientConfiguration(url, key, __DEV__);
export const configured = configuration.status === "ready";
export const supabase =
  configured && url && key
    ? createClient(url, key, {
        auth: {
          storage: AsyncStorage,
          persistSession: true,
          flowType: "pkce",
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      })
    : null;
export function db() {
  if (!supabase)
    throw new Error(
      configuration.error ?? "Supabase não configurado. Consulte o README.",
    );
  return supabase;
}
/** Freeze the actor of an already-started request, without persisting a second session. */
export function dbForAccessToken(accessToken: string) {
  if (!configured || !url || !key || !accessToken)
    throw new Error("Entre para contribuir.");
  return createClient(url, key, {
    accessToken: async () => accessToken,
  });
}
