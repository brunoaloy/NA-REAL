/** Expo Go has react-native-maps, but cannot load MapLibre's custom native module. */
export function usesExpoGoMap(
  platform: string,
  executionEnvironment?: string,
  preferBuiltIn = false,
) {
  return (
    platform !== "web" &&
    (executionEnvironment === "storeClient" || preferBuiltIn)
  );
}
export function regionBounds(region: {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}): [number, number, number, number] {
  const { latitude, longitude, latitudeDelta, longitudeDelta } = region;
  // Longitude wraps around the dateline; querying the full range avoids a reversed envelope.
  const west = longitude - longitudeDelta / 2;
  const east = longitude + longitudeDelta / 2;
  return [
    west < -180 || east > 180 ? -180 : west,
    Math.max(-90, latitude - latitudeDelta / 2),
    west < -180 || east > 180 ? 180 : east,
    Math.min(90, latitude + latitudeDelta / 2),
  ];
}
