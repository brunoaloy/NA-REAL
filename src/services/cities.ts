import data from "../data/cities.json";
import { cityKey } from "../validation/cities";
export type City = {
  city: string;
  state: string;
  latitude: number;
  longitude: number;
};
const cities = (data as [string, string, number, number][]).map(
  ([city, state, latitude, longitude]) => ({
    city,
    state,
    latitude,
    longitude,
    key: cityKey(city),
  }),
);
export function suggestCities(term: string, state = ""): City[] {
  const key = cityKey(term),
    uf = state.trim().toUpperCase();
  if (key.length < 2) return [];
  return cities
    .filter((c) => (!uf || c.state === uf) && c.key.includes(key))
    .sort(
      (a, b) =>
        Number(b.key.startsWith(key)) - Number(a.key.startsWith(key)) ||
        a.city.localeCompare(b.city, "pt-BR") ||
        a.state.localeCompare(b.state),
    )
    .slice(0, 6);
}
export function cityCenter(
  city: string,
  state: string,
): [number, number] | undefined {
  const match = cities.find(
    (c) => c.key === cityKey(city) && c.state === state.trim().toUpperCase(),
  );
  return match ? [match.longitude, match.latitude] : undefined;
}
