import { preferredCity, cityKey } from "./cities.ts";
export type RegistrationContext = {
  key: string;
  city?: string;
  state?: string;
  name?: string;
};
export function registrationContext(
  params: Record<string, unknown>,
): RegistrationContext | undefined {
  if (
    typeof params.requestKey !== "string" ||
    !/^[a-zA-Z0-9-]{1,100}$/.test(params.requestKey)
  )
    return;
  const place = preferredCity({ city: params.city, state: params.state });
  const raw =
    typeof params.suggestedName === "string"
      ? params.suggestedName.trim().slice(0, 120)
      : "";
  const name =
    raw && (!place || cityKey(raw) !== cityKey(place.city)) ? raw : undefined;
  if (!place && !name) return;
  return {
    key: params.requestKey,
    ...(place ?? {}),
    ...(name ? { name } : {}),
  };
}
export function registrationParams(
  value: { city?: string; state?: string; name?: string },
  key: string,
) {
  const context = registrationContext({
    requestKey: key,
    city: value.city,
    state: value.state,
    suggestedName: value.name,
  });
  return {
    city: context?.city ?? "",
    state: context?.state ?? "",
    suggestedName: context?.name ?? "",
    requestKey: context?.key ?? "",
    latitude: "",
    longitude: "",
    locationKey: "",
  };
}
