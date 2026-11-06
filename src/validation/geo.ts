export type GeoPlace = {
  id: string;
  name: string;
  longitude: number | null;
  latitude: number | null;
};
export function featureCollection(
  items: GeoPlace[],
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: items
      .filter(
        (p) =>
          p.longitude != null &&
          p.latitude != null &&
          Number.isFinite(p.longitude) &&
          Number.isFinite(p.latitude) &&
          Math.abs(p.longitude) <= 180 &&
          Math.abs(p.latitude) <= 90,
      )
      .map((p) => ({
        type: "Feature",
        id: p.id,
        properties: { id: p.id, name: p.name },
        geometry: { type: "Point", coordinates: [p.longitude!, p.latitude!] },
      })),
  };
}
