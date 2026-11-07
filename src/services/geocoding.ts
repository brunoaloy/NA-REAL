import * as Location from "expo-location";
import { Platform } from "react-native";
import { brazilPoint, type MapPoint } from "../validation/geocoding";
export async function findAddress(address: string): Promise<MapPoint> {
  if (Platform.OS === "web")
    throw new Error(
      "A busca de endereços está disponível no aplicativo do celular. Você pode escolher um ponto no mapa ou continuar sem marcar a posição.",
    );
  if (!address.trim() || address.length > 500)
    throw new Error("Informe a cidade ou o endereço que você quer encontrar.");
  if (Platform.OS === "android") {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted)
      throw new Error(
        "A localização precisa ser permitida para buscar endereços neste aparelho. Você ainda pode marcar o lugar no mapa.",
      );
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const results = await Promise.race([
      Location.geocodeAsync(address).catch(() => {
        throw new Error(
          "Não foi possível buscar o endereço agora. Confira sua conexão ou marque o ponto no mapa.",
        );
      }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new Error(
                "A busca de endereço demorou. Tente novamente ou marque o lugar no mapa.",
              ),
            ),
          15000,
        );
      }),
    ]);
    const point = results.map(brazilPoint).find(Boolean);
    if (!point)
      throw new Error(
        "Não encontramos essa região no Brasil. Tente incluir a cidade e a UF ou marque o ponto no mapa.",
      );
    return point;
  } finally {
    clearTimeout(timer);
  }
}
