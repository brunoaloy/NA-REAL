import { db } from "./supabase";
import { placeInput, reviewInput, messageInput } from "../validation/domain";
export type Bounds = [number, number, number, number];
export const BRAZIL: Bounds = [-74, -34, -34, 6];
export type Place = {
  id: string;
  name: string;
  category: string;
  city: string;
  state: string;
  address: string;
  longitude: number | null;
  latitude: number | null;
  rating: number | null;
  review_count: number;
};
export async function places(
  search: string,
  category: string,
  page = 0,
  city = "",
  state = "",
  bounds: Bounds = BRAZIL,
): Promise<Place[]> {
  const { data, error } = await db().rpc("search_places", {
    term: search.trim(),
    category_filter: category,
    city_filter: city.trim(),
    state_filter: state.trim().toUpperCase(),
    page_number: page,
    west: bounds[0],
    south: bounds[1],
    east: bounds[2],
    north: bounds[3],
  });
  if (error) throw error;
  return data;
}
export async function nearbyPlaces(
  position: { latitude: number; longitude: number },
  search: string,
  category: string,
  page = 0,
  city = "",
  state = "",
): Promise<Place[]> {
  const { data, error } = await db().rpc("search_places_near", {
    origin_latitude: position.latitude,
    origin_longitude: position.longitude,
    term: search.trim(),
    category_filter: category,
    city_filter: city.trim(),
    state_filter: state.trim().toUpperCase(),
    page_number: page,
  });
  if (error) throw error;
  return data;
}
export async function userId() {
  const { data, error } = await db().auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Entre para contribuir.");
  return data.user.id;
}
export async function addPlace(input: unknown) {
  const value = placeInput.parse(input);
  const uid = await userId();
  const { latitude, longitude, ...fields } = value;
  const geom =
    latitude != null && longitude != null
      ? `SRID=4326;POINT(${longitude} ${latitude})`
      : undefined;
  const r = await db()
    .from("places")
    .insert({ ...fields, geom, created_by: uid })
    .select("id")
    .single();
  if (r.error) throw r.error;
  return r.data.id as string;
}
export async function saveReview(place_id: string, input: unknown) {
  const value = reviewInput.parse(input);
  const author_id = await userId();
  const existing = await db()
    .from("reviews")
    .select("id")
    .eq("place_id", place_id)
    .eq("author_id", author_id)
    .maybeSingle();
  if (existing.error) throw existing.error;
  const result = existing.data
    ? await db()
        .from("reviews")
        .update(value)
        .eq("id", existing.data.id)
        .select("id")
        .single()
    : await db()
        .from("reviews")
        .insert({ ...value, place_id, author_id })
        .select("id")
        .single();
  if (result.error) throw result.error;
  return result.data.id as string;
}
export async function sendMessage(
  place_id: string,
  body: string,
  request: string,
  reply: string | null = null,
) {
  await userId();
  const r = await db().rpc("submit_message", {
    place: place_id,
    body: messageInput.parse(body),
    request,
    reply,
  });
  if (r.error) throw r.error;
  return r.data as string;
}
export { featureCollection } from "../validation/geo";
