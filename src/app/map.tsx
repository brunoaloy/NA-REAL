import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Keyboard } from "react-native";
import { requestPosition } from "../services/location";
import { mapFilters, mapCenter } from "../validation/explore";
import {
  Screen,
  Copy,
  PrimaryButton,
  EmptyState,
  ErrorState,
} from "../components/ui";
import {
  AppHeader,
  CategoryChips,
  PlaceCard,
  SearchBar,
} from "../components/design";
import MapCanvas from "../components/map-canvas";
import { builtInMap } from "../services/map-runtime";
import { BRAZIL, places, type Bounds } from "../services/catalog";
import { configured } from "../services/supabase";
export default function MapPage() {
  const params = useLocalSearchParams<{
    pick?: string;
    search?: string;
    category?: string;
    city?: string;
    state?: string;
    latitude?: string;
    longitude?: string;
  }>();
  const initial = mapFilters(params);
  const [bounds, setBounds] = useState<Bounds>(BRAZIL);
  const [input, setInput] = useState(initial.search);
  const [search, setSearch] = useState(initial.search);
  const [category, setCategory] = useState(initial.category);
  const [selected, setSelected] = useState("");
  const [center, setCenter] = useState<[number, number] | undefined>(() =>
    mapCenter(params),
  );
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<unknown>();
  const style = process.env.EXPO_PUBLIC_MAP_STYLE_URL;
  const mapAvailable = builtInMap || Boolean(style);
  const q = useInfiniteQuery({
    queryKey: ["map", bounds, search, category, initial.city, initial.state],
    enabled: configured && mapAvailable,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      places(search, category, pageParam, initial.city, initial.state, bounds),
    getNextPageParam: (last, pages) =>
      last.length === 50 && pages.length < 10 ? pages.length : undefined,
  });
  const items = q.data?.pages.flat() ?? [];
  async function locate() {
    setError(undefined);
    try {
      setLocating(true);
      const p = await requestPosition();
      setCenter([p.longitude, p.latitude]);
    } catch (e) {
      setError(e);
    } finally {
      setLocating(false);
    }
  }
  return (
    <Screen
      onRefresh={
        configured && mapAvailable ? () => void q.refetch() : undefined
      }
      refreshing={q.isRefetching && !q.isFetchingNextPage}
    >
      <AppHeader
        title={params.pick ? "Selecionar posição" : "Mapa de lugares"}
        back
      />
      <SearchBar
        label="Buscar nome ou cidade"
        buttonLabel="Buscar nesta área"
        value={input}
        onChange={setInput}
        onSearch={(value) => {
          Keyboard.dismiss();
          const next = value.trim();
          setInput(next);
          if (next === search && configured && mapAvailable) void q.refetch();
          else setSearch(next);
        }}
      />
      {(initial.city || initial.state) && (
        <Copy>
          Região: {[initial.city, initial.state].filter(Boolean).join(", ")}
        </Copy>
      )}
      <CategoryChips compact value={category} onChange={setCategory} />
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
        title={locating ? "Obtendo localização…" : "Perto de mim (opcional)"}
        disabled={locating}
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
