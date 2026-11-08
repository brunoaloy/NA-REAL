export type CityPreference = { city: string; state: string };
const uf =
  /^(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)$/;
export const cityKey = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("pt-BR");
export function preferredCity(value: unknown): CityPreference | null {
  if (!value || typeof value !== "object") return null;
  const p = value as Record<string, unknown>;
  if (typeof p.city !== "string" || typeof p.state !== "string") return null;
  const city = p.city.trim(),
    state = p.state.trim().toUpperCase();
  return city.length >= 2 && city.length <= 100 && uf.test(state)
    ? { city, state }
    : null;
}
