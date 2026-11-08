export type PlaceAddress = { address: string; city: string; state: string };
export function destinationLabel(place: PlaceAddress) {
  const parts = [place.address, place.city, place.state]
    .map((value) => value.trim())
    .filter(Boolean);
  if (!parts.length)
    throw new Error("O endereço deste lugar ainda não está disponível.");
  return [...parts, "Brasil"].join(", ");
}
export function directionsUrl(platform: string, place: PlaceAddress) {
  const destination = encodeURIComponent(destinationLabel(place));
  return platform === "ios"
    ? `https://maps.apple.com/?daddr=${destination}&dirflg=d`
    : `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
}
export function validPlaceId(id: unknown): id is string {
  return (
    typeof id === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  );
}
