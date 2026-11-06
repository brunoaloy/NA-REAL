import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const configured = Boolean(url && key);
export const supabase =
  url && key
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
    throw new Error("Supabase não configurado. Consulte o README.");
  return supabase;
}
