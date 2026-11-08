import { useCallback, useEffect, useRef, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Keyboard, Linking, Platform, Text, View } from "react-native";
import { requestPosition } from "../services/location";
import { findAddress } from "../services/geocoding";
import {
  addressQuery,
  brazilPoint,
  type MapPoint,
} from "../validation/geocoding";
import { mapFilters, mapCenter } from "../validation/explore";
import { regionBounds } from "../validation/map-runtime";
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
import {
  WarmIntro,
  GentleNote,
  QuietButton,
  m,
  ActionRow,
} from "../components/member-design";
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
    address?: string;
  }>();
  const initial = mapFilters(params),
    pick = params.pick === "1";
  const seed = mapCenter(params);
  const [bounds, setBounds] = useState<Bounds>(BRAZIL);
  const [input, setInput] = useState(initial.search),
    [search, setSearch] = useState(initial.search),
    [category, setCategory] = useState(initial.category);
  const [cityText, setCityText] = useState(
    [pick ? params.address : "", initial.city, initial.state]
      .filter(Boolean)
      .join(", ") || initial.search,
  );
  const [cityScope, setCityScope] = useState({
    city: initial.city,
    state: initial.state,
  });
  const [center, setCenter] = useState<[number, number] | undefined>(seed);
  const [chosen, setChosen] = useState<MapPoint | undefined>(
    seed ? brazilPoint({ longitude: seed[0], latitude: seed[1] }) : undefined,
  );
  const [selected, setSelected] = useState("");
  const [locating, setLocating] = useState(false),
    [error, setError] = useState<unknown>();
  const [showSearch, setShowSearch] = useState(Boolean(initial.search));
  const busy = useRef(false),
    autoLocated = useRef(false);
  const style = process.env.EXPO_PUBLIC_MAP_STYLE_URL,
    mapAvailable = builtInMap || Boolean(style);
  const q = useInfiniteQuery({
    queryKey: [
      "map",
      bounds,
      search,
      category,
      cityScope.city,
      cityScope.state,
    ],
    enabled: configured && mapAvailable,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      places(
        search,
        category,
        pageParam,
        cityScope.city,
        cityScope.state,
        bounds,
      ),
    getNextPageParam: (last, pages) =>
      last.length === 50 && pages.length < 10 ? pages.length : undefined,
  });
  const items = q.data?.pages.flat() ?? [];
  const selectedPlace = items.find((place) => place.id === selected);
  function move(point: MapPoint) {
    setSelected("");
    setCenter([point.longitude, point.latitude]);
    setBounds(
      regionBounds({ ...point, latitudeDelta: 0.05, longitudeDelta: 0.05 }),
    );
  }
  async function lookup(value: string, keepScope = false) {
    if (busy.current) return;
    busy.current = true;
    setLocating(true);
    setError(undefined);
    Keyboard.dismiss();
    try {
      const point = await findAddress(addressQuery("", value, ""));
      move(point);
      if (!keepScope) setCityScope({ city: "", state: "" });
    } catch (e) {
      setError(e);
    } finally {
      busy.current = false;
      setLocating(false);
    }
  }
  useEffect(() => {
    if (
      autoLocated.current ||
      seed ||
      !initial.city ||
      !mapAvailable ||
      Platform.OS === "web"
    )
      return;
    autoLocated.current = true;
    void lookup(
      [pick ? params.address : "", initial.city, initial.state]
        .filter(Boolean)
        .join(", "),
      true,
    );
    // Initial city is resolved once; panning must not move the user back to it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  async function locate() {
    if (busy.current) return;
    busy.current = true;
    setLocating(true);
    setError(undefined);
    try {
      const point = await requestPosition();
      move(point);
      setCityScope({ city: "", state: "" });
      setCityText("");
    } catch (e) {
      setError(e);
    } finally {
      busy.current = false;
      setLocating(false);
    }
  }
  const choose = useCallback((longitude: number, latitude: number) => {
    const point = brazilPoint({ longitude, latitude });
    if (point) {
      setChosen(point);
      setError(undefined);
    } else setError(new Error("Escolha um lugar no Brasil para continuar."));
  }, []);
  async function openMaps() {
    const query = cityText.trim()
      ? `comércios em ${cityText.trim()}`
      : "comércios";
    const ll = center ? `${center[1]},${center[0]}` : "";
    const url =
      Platform.OS === "ios"
        ? `https://maps.apple.com/?q=${encodeURIComponent(query)}${ll ? `&ll=${ll}` : ""}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query + (ll ? ` ${ll}` : ""))}`;
    try {
      await Linking.openURL(url);
    } catch (e) {
      setError(e);
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
        title={pick ? "Marque a entrada" : "Sua cidade no mapa"}
        back
      />
      {pick ? (
        <WarmIntro
          title="É bem aqui?"
          body="Encontre o endereço e toque no mapa para marcar a entrada do lugar."
        />
      ) : (
        <Text style={m.body}>
          Encontre sua cidade. Descubra o que tem por perto.
        </Text>
      )}
      <SearchBar
        label="Buscar cidade ou endereço"
        placeholder="Ex.: Recife, PE"
        buttonLabel="Localizar cidade"
        value={cityText}
        onChange={setCityText}
        onSearch={(value) => void lookup(value)}
        busy={locating}
      />
      {(initial.city || initial.state) && (
        <Text style={m.small}>
          Região: {[initial.city, initial.state].filter(Boolean).join(", ")}
        </Text>
      )}
      <QuietButton
        title={locating ? "Localizando…" : "Usar minha localização"}
        disabled={locating}
        onPress={() => void locate()}
      />
      {error != null && <ErrorState error={error} />}
      {mapAvailable ? (
        <View
          style={{
            borderRadius: 24,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: "#DFE9E3",
            backgroundColor: "#FFFFFF",
          }}
        >
          <MapCanvas
            styleUrl={style ?? ""}
            places={items}
            center={center}
            selectedPoint={pick ? chosen : undefined}
            onBounds={(b) =>
              setBounds(b.map((v) => Math.round(v * 10000) / 10000) as Bounds)
            }
            onSelect={setSelected}
            selectedId={selectedPlace?.id}
            onPick={pick ? choose : undefined}
          />
          {!pick &&
            (selectedPlace ? (
              <View
                style={{
                  position: "absolute",
                  left: 10,
                  right: 10,
                  bottom: 34,
                  borderRadius: 20,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: "#D5E5DA",
                  elevation: 4,
                }}
              >
                <PlaceCard
                  place={selectedPlace}
                  preview
                  onClose={() => setSelected("")}
                />
              </View>
            ) : (
              <View
                style={{
                  position: "absolute",
                  left: 10,
                  right: 54,
                  top: 12,
                  backgroundColor: "#FFFFFF",
                  borderRadius: 14,
                  padding: 12,
                  flexDirection: "row",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <Text style={[m.small, { color: "#0F766E", flex: 1 }]}>
                  Toque em um pin verde para conhecer um lugar da comunidade.
                </Text>
              </View>
            ))}
        </View>
      ) : (
        <EmptyState text="O mapa não está disponível nesta versão. Você pode continuar pela lista ou abrir o aplicativo Mapas." />
      )}
      {pick ? (
        <>
          {chosen && (
            <GentleNote>
              Entrada marcada. Confira o pino azul antes de continuar.
            </GentleNote>
          )}
          <PrimaryButton
            title="Usar este local"
            disabled={!chosen}
            onPress={() => {
              if (chosen)
                router.dismissTo({
                  pathname: "/(tabs)/add",
                  params: {
                    latitude: String(chosen.latitude),
                    longitude: String(chosen.longitude),
                    locationKey: String(Date.now()),
                  },
                });
            }}
          />
        </>
      ) : (
        <>
          <View style={{ gap: 9, paddingHorizontal: 4 }}>
            <Text style={[m.label, { fontSize: 12, color: "#0F766E" }]}>
              ● Pins verdes · Comunidade NA REAL
            </Text>
            <Text style={m.small}>
              {builtInMap
                ? "Os outros comércios e pontos são do mapa do seu celular. Aproxime para explorar; a cobertura varia por região."
                : "As ruas e os pontos do mapa são do provedor. As descobertas da comunidade aparecem nos pins verdes."}
            </Text>
          </View>
          <QuietButton
            title="Abrir busca no aplicativo Mapas"
            onPress={() => void openMaps()}
          />
          <QuietButton
            title="Compartilhar um lugar"
            onPress={() => router.push("/(tabs)/add")}
          />
          <Text accessibilityRole="header" style={m.section}>
            Lugares da comunidade
          </Text>
          <Text style={m.small}>
            Experiências e dicas de quem conhece cada lugar.
          </Text>
          <ActionRow
            title={
              showSearch
                ? "Recolher busca da comunidade"
                : "Buscar na comunidade"
            }
            detail="Filtre os pins por nome ou categoria"
            icon="search-outline"
            expanded={showSearch}
            onPress={() => setShowSearch(!showSearch)}
          />
          {showSearch && (
            <SearchBar
              label="Buscar nome ou cidade"
              buttonLabel="Buscar nesta área"
              value={input}
              onChange={setInput}
              onSearch={(value) => {
                Keyboard.dismiss();
                const next = value.trim();
                setInput(next);
                if (next === search && configured && mapAvailable)
                  void q.refetch();
                else setSearch(next);
              }}
            />
          )}
          <CategoryChips compact value={category} onChange={setCategory} />
          {q.isError && (
            <>
              <ErrorState error={q.error} />
              <QuietButton
                title="Tentar novamente"
                onPress={() => void q.refetch()}
              />
            </>
          )}
          {q.isFetching && <Copy>Buscando descobertas da comunidade…</Copy>}
          {mapAvailable && q.data && items.length === 0 && (
            <EmptyState text="Esta região ainda tem histórias para descobrir. Compartilhe um lugar que você conhece; os outros comércios do mapa aparecem conforme a cobertura do provedor." />
          )}
          {q.hasNextPage && (
            <QuietButton
              title="Carregar mais nesta área"
              disabled={q.isFetchingNextPage}
              onPress={() => void q.fetchNextPage()}
            />
          )}
        </>
      )}
      <QuietButton title="Voltar à lista" onPress={() => router.back()} />
    </Screen>
  );
}
