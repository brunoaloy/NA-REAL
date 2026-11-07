import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import {
  Screen,
  Copy,
  Field,
  PrimaryButton,
  EmptyState,
  ErrorState,
} from "../components/ui";
import { AppHeader, CategoryChips, PlaceCard } from "../components/design";
import MapCanvas from "../components/map-canvas";
import { builtInMap } from "../services/map-runtime";
import { BRAZIL, places, type Bounds } from "../services/catalog";
import { configured } from "../services/supabase";
export default function MapPage() {
  const params = useLocalSearchParams<{ pick?: string }>();
  const [bounds, setBounds] = useState<Bounds>(BRAZIL);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const [selected, setSelected] = useState("");
  const [center, setCenter] = useState<[number, number]>();
  const [error, setError] = useState<unknown>();
  const style = process.env.EXPO_PUBLIC_MAP_STYLE_URL;
  const mapAvailable = builtInMap || Boolean(style);
  const q = useInfiniteQuery({
    queryKey: ["map", bounds, search, category],
    enabled: configured && mapAvailable,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      places(search, category, pageParam, "", "", bounds),
    getNextPageParam: (last, pages) =>
      last.length === 50 && pages.length < 10 ? pages.length : undefined,
  });
  const items = q.data?.pages.flat() ?? [];
  async function locate() {
    setError(undefined);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted)
        throw new Error(
          "Localização negada. Busque manualmente por nome ou cidade.",
        );
      const p = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCenter([p.coords.longitude, p.coords.latitude]);
    } catch (e) {
      setError(e);
    }
  }
  return (
    <Screen>
      <AppHeader
        title={params.pick ? "Selecionar posição" : "Mapa de lugares"}
        back
      />
      <Field
        label="Buscar nome ou cidade"
        value={input}
        onChangeText={setInput}
        onSubmitEditing={() => setSearch(input)}
      />
      <PrimaryButton
        title="Buscar nesta área"
        onPress={() => setSearch(input)}
      />
      <CategoryChips value={category} onChange={setCategory} />
      {!mapAvailable ? (
        <EmptyState text="Mapa não configurado. Defina um estilo de provedor licenciado; a busca em lista continua disponível." />
      ) : (
        <MapCanvas
          styleUrl={style ?? ""}
          places={items}
          center={center}
          onBounds={(b) =>
            setBounds(b.map((v) => Math.round(v * 10000) / 10000) as Bounds)
          }
          onSelect={setSelected}
          onPick={
            params.pick
              ? (longitude, latitude) =>
                  router.dismissTo({
                    pathname: "/(tabs)/add",
                    params: {
                      longitude: String(longitude),
                      latitude: String(latitude),
                    },
                  })
              : undefined
          }
        />
      )}
      {params.pick && (
        <Copy>
          Pressione por alguns instantes no mapa para escolher a posição (clique
          direito na web).
        </Copy>
      )}
      <PrimaryButton
        title="Perto de mim (opcional)"
        onPress={() => void locate()}
      />
      {error != null && <ErrorState error={error} />}
      {q.isError && <ErrorState error={q.error} />}
      {q.isFetching && <Copy>Buscando lugares aprovados…</Copy>}
      {mapAvailable && q.data && items.length === 0 && (
        <EmptyState text="Nenhum lugar nesta área. A cobertura depende do catálogo aprovado." />
      )}
      {items.find((p) => p.id === selected) && (
        <PlaceCard place={items.find((p) => p.id === selected)!} />
      )}
      {q.hasNextPage && (
        <PrimaryButton
          title="Carregar mais nesta área"
          disabled={q.isFetchingNextPage}
          onPress={() => void q.fetchNextPage()}
        />
      )}
      <Copy>
        {builtInMap
          ? "No Expo Go, o mapa usa o provedor do aparelho e mostra os lugares carregados. Aproxime para refinar a área."
          : "Marcadores agrupam somente os resultados carregados; aproxime o mapa para refinar a área."}
      </Copy>
      <PrimaryButton title="Voltar à lista" onPress={() => router.back()} />
    </Screen>
  );
}
