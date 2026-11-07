export type MapPoint = { latitude: number; longitude: number };
export function brazilPoint(value: {
  latitude?: number;
  longitude?: number;
}): MapPoint | undefined {
  const { latitude, longitude } = value;
  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -34 ||
    latitude > 6 ||
    longitude < -74 ||
    longitude > -34
  )
    return;
  return { latitude, longitude };
}
export function addressQuery(address: string, city: string, state: string) {
  return [address.trim(), city.trim(), state.trim().toUpperCase(), "Brasil"]
    .filter(Boolean)
    .join(", ");
}
