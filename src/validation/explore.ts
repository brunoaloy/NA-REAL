export type ExploreFilters = {
  search: string;
  category: string;
  city: string;
  state: string;
};
export const emptyFilters: ExploreFilters = {
  search: "",
  category: "Todos",
  city: "",
  state: "",
};
const categories = ["Todos", "Comer", "Lazer", "Compras", "Serviços"];
const states =
  /^(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)$/;
export function normalizeFilters(input: ExploreFilters): ExploreFilters {
  const state = input.state.trim().toUpperCase();
  if (state && !states.test(state))
    throw new Error("Informe uma UF válida, como MG, SP ou RJ.");
  return {
    search: input.search.trim().slice(0, 120),
    category: categories.includes(input.category) ? input.category : "Todos",
    city: input.city.trim().slice(0, 100),
    state,
  };
}
export function hasFilters(filters: ExploreFilters) {
  return Boolean(
    filters.search ||
    filters.city ||
    filters.state ||
    filters.category !== "Todos",
  );
}
export function mapFilters(
  params: Record<string, string | string[] | undefined>,
): ExploreFilters {
  const scalar = (key: string) =>
    typeof params[key] === "string" ? (params[key] as string) : "";
  const state = scalar("state").trim().toUpperCase();
  return normalizeFilters({
    search: scalar("search"),
    category: scalar("category"),
    city: scalar("city"),
    state: states.test(state) ? state : "",
  });
}
export function mapCenter(
  params: Record<string, string | string[] | undefined>,
): [number, number] | undefined {
  if (
    typeof params.latitude !== "string" ||
    typeof params.longitude !== "string" ||
    !params.latitude.trim() ||
    !params.longitude.trim()
  )
    return;
  const latitude = Number(params.latitude),
    longitude = Number(params.longitude);
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  )
    return;
  return [longitude, latitude];
}
