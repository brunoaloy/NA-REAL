import { confirmsPendingReview } from "../validation/review-delivery";
import { localDiagnostics } from "../validation/diagnostics";
import {
  uncertainWrite,
  UnconfirmedPlaceDelivery,
} from "../validation/delivery-error";
import { assertSessionOwner } from "../validation/session-lifecycle";
import { db, dbForAccessToken } from "./supabase";
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
  signal?: AbortSignal,
): Promise<Place[]> {
  const request = db().rpc("search_places", {
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
  if (signal) request.abortSignal(signal);
  const { data, error } = await request;
  if (error) {
    if (!signal?.aborted) localDiagnostics.record("catalogue", error);
    throw error;
  }
  return data;
}
export async function nearbyPlaces(
  position: { latitude: number; longitude: number },
  search: string,
  category: string,
  page = 0,
  city = "",
  state = "",
  signal?: AbortSignal,
): Promise<Place[]> {
  const request = db().rpc("search_places_near", {
    origin_latitude: position.latitude,
    origin_longitude: position.longitude,
    term: search.trim(),
    category_filter: category,
    city_filter: city.trim(),
    state_filter: state.trim().toUpperCase(),
    page_number: page,
  });
  if (signal) request.abortSignal(signal);
  const { data, error } = await request;
  if (error) {
    if (!signal?.aborted) localDiagnostics.record("nearby", error);
    throw error;
  }
  return data;
}
export async function userId(expected?: string) {
  const { data, error } = await db().auth.getUser();
  if (error) throw error;
  return assertSessionOwner(data.user?.id, expected);
}
export async function addPlace(input: unknown, expectedOwner?: string) {
  const value = placeInput.parse(input);
  const uid = await userId(expectedOwner);
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
  if (r.error) {
    if (uncertainWrite({ message: r.error.message, status: r.status }))
      throw new UnconfirmedPlaceDelivery();
    throw r.error;
  }
  return r.data.id as string;
}
export async function saveReview(
  place_id: string,
  input: unknown,
  expectedOwner?: string,
) {
  const value = reviewInput.parse(input);
  const author_id = await userId(expectedOwner);
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
  if (result.error) {
    if (
      result.error.code === "23505" ||
      uncertainWrite({ message: result.error.message, status: result.status })
    ) {
      const recovered = await db()
        .from("reviews")
        .select("id,rating,body,moderation_state")
        .eq("place_id", place_id)
        .eq("author_id", author_id)
        .maybeSingle();
      if (!recovered.error && confirmsPendingReview(recovered.data, value))
        return recovered.data!.id as string;
    }
    throw result.error;
  }
  return result.data.id as string;
}
export async function sendMessage(
  place_id: string,
  body: string,
  request: string,
  reply: string | null = null,
  expectedOwner?: string,
  snapshotToken?: string,
) {
  const token =
    snapshotToken ?? (await db().auth.getSession()).data.session?.access_token;
  if (!token) throw new Error("Entre para contribuir.");
  const verified = await db().auth.getUser(token);
  if (verified.error) throw verified.error;
  assertSessionOwner(verified.data.user?.id, expectedOwner);
  const r = await dbForAccessToken(token).rpc("submit_message", {
    place: place_id,
    body: messageInput.parse(body),
    request,
    reply,
  });
  if (r.error) throw r.error;
  return r.data as string;
}
export { featureCollection } from "../validation/geo";
