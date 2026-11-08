import { db } from "./supabase";
import { userId } from "./catalog";
export async function placePreference(
  table: "favorites" | "place_follows",
  uid: string,
  id: string,
) {
  const result = await db()
    .from(table)
    .select("place_id")
    .eq("user_id", uid)
    .eq("place_id", id)
    .maybeSingle();
  if (result.error) throw result.error;
  return Boolean(result.data);
}
export async function setPlacePreference(
  table: "favorites" | "place_follows",
  uid: string,
  id: string,
  desired: boolean,
) {
  if ((await userId()) !== uid)
    throw new Error("Sua sessão mudou. Entre novamente antes de continuar.");
  const result = desired
    ? await db().from(table).insert({ user_id: uid, place_id: id })
    : await db().from(table).delete().eq("user_id", uid).eq("place_id", id);
  if (result.error && !(desired && result.error.code === "23505"))
    throw result.error;
  const saved = await placePreference(table, uid, id);
  if (saved !== desired)
    throw new Error(
      "Não conseguimos confirmar essa alteração. Tente novamente.",
    );
  return saved;
}
