import * as Location from "expo-location";
export async function requestPosition() {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted)
    throw new Error(
      "Localização não autorizada. Você pode continuar buscando por nome ou cidade.",
    );
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const position = await Promise.race([
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new Error(
                "A localização demorou para responder. Tente novamente em um local aberto ou busque por cidade.",
              ),
            ),
          15000,
        );
      }),
    ]);
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  } finally {
    clearTimeout(timer);
  }
}
