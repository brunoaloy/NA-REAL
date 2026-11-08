import { latestContributions } from "../validation/contributions";
import { db } from "./supabase";
export async function loadMyProfile(uid: string) {
  const [p, favorites, reviews, items, photos, account, ownedPlaces] =
    await Promise.all([
      db()
        .from("profiles")
        .select("display_name,handle,bio,moderation_state")
        .eq("id", uid)
        .maybeSingle(),
      db()
        .from("favorites")
        .select("place_id,places(id,name,city)")
        .eq("user_id", uid)
        .limit(50),
      db()
        .from("reviews")
        .select("id,place_id,rating,body,moderation_state")
        .eq("author_id", uid)
        .order("created_at", { ascending: false })
        .limit(50),
      db()
        .from("moderation_items")
        .select(
          "id,target_type,target_id,state,created_at,title:payload->>name,body:payload->>body,place_id:payload->>place_id,moderation_actions(id,decision,reason,created_at)",
        )
        .eq("author_id", uid)
        .order("created_at", { ascending: false })
        .limit(50),
      db()
        .from("photos")
        .select("id,object_path,moderation_state")
        .eq("owner_id", uid)
        .order("created_at", { ascending: false })
        .limit(30),
      db()
        .from("safe_accounts")
        .select("suspended,reason")
        .eq("user_id", uid)
        .maybeSingle(),
      db()
        .from("places")
        .select("id,name,city,state,moderation_state,verification_status")
        .eq("created_by", uid)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
  for (const result of [
    p,
    favorites,
    reviews,
    items,
    photos,
    account,
    ownedPlaces,
  ])
    if (result.error) throw result.error;
  return {
    profile: p.data,
    places: ownedPlaces.data ?? [],
    account: account.data,
    reviews: reviews.data ?? [],
    items: latestContributions(items.data ?? []),
    photos: photos.data ?? [],
    favorites: (favorites.data ?? []).map((f) => ({
      ...f,
      places: (Array.isArray(f.places) ? f.places[0] : f.places) as {
        id: string;
        name: string;
        city: string;
      } | null,
    })),
  };
}
