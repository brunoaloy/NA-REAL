import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import {
  View,
  Pressable,
  Text,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  Screen,
  Copy,
  Field,
  PrimaryButton,
  EmptyState,
  ErrorState,
  Card,
  colors,
} from "../../components/ui";
import {
  AppHeader,
  CategoryChips,
  PlaceCard,
  SearchBar,
  DiscoveryHero,
} from "../../components/design";
import { nearbyPlaces, places } from "../../services/catalog";
import { requestPosition } from "../../services/location";
import { configured } from "../../services/supabase";
import {
  emptyFilters,
  hasFilters,
  normalizeFilters,
} from "../../validation/explore";
export default function Explore() {
  const [position, setPosition] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<unknown>();
  const [filters, setFilters] = useState(emptyFilters);
  const [input, setInput] = useState("");
  const [draftCity, setDraftCity] = useState("");
  const [draftState, setDraftState] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const [filterError, setFilterError] = useState<unknown>();
  const { search, category, city, state } = filters;
  const filtered = hasFilters(filters);
  const q = useInfiniteQuery({
    queryKey: ["places", search, category, city, state, position],
    queryFn: ({ pageParam }) =>
      position
        ? nearbyPlaces(position, search, category, pageParam, city, state)
        : places(search, category, pageParam, city, state),
    initialPageParam: 0,
    getNextPageParam: (last, pages) =>
      last.length === 50 ? pages.length : undefined,
    enabled: configured,
  });
  const items = q.data?.pages.flat() ?? [];
  async function toggleNearby() {
    if (position) {
      setPosition(null);
      setLocationError(undefined);
      return;
    }
    setLocating(true);
    setLocationError(undefined);
    try {
      setPosition(await requestPosition());
    } catch (e) {
      setLocationError(e);
    } finally {
      setLocating(false);
    }
  }
  function submitSearch(value: string) {
    Keyboard.dismiss();
    const next = normalizeFilters({ ...filters, search: value });
    setInput(next.search);
    if (next.search === search && configured) void q.refetch();
    else setFilters(next);
  }
  function clearFilters() {
    setFilters(emptyFilters);
    setInput("");
    setDraftCity("");
    setDraftState("");
    setPosition(null);
    setFilterError(undefined);
    setLocationError(undefined);
    setAdvanced(false);
    Keyboard.dismiss();
  }
  function applyFilters() {
    try {
      setFilters(
        normalizeFilters({ ...filters, city: draftCity, state: draftState }),
      );
      setFilterError(undefined);
      setAdvanced(false);
      Keyboard.dismiss();
    } catch (e) {
      setFilterError(e);
    }
  }
  function openMap() {
    router.push({
      pathname: "/map",
      params: {
        ...filters,
        ...(position
          ? {
              latitude: String(position.latitude),
              longitude: String(position.longitude),
            }
          : {}),
      },
    });
  }
  return (
    <Screen
      onRefresh={configured ? () => void q.refetch() : undefined}
      refreshing={q.isRefetching && !q.isFetchingNextPage}
    >
      <AppHeader />
      <SearchBar value={input} onChange={setInput} onSearch={submitSearch} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            locating
              ? "Obtendo localização…"
              : position
                ? "Voltar à ordem por nome"
                : "Ordenar por proximidade"
          }
          accessibilityState={{
            disabled: locating,
            selected: Boolean(position),
          }}
          disabled={locating}
          onPress={() => void toggleNearby()}
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            padding: 12,
            borderRadius: 15,
            backgroundColor: position ? "#D1FAE5" : "#F1F5F4",
            minHeight: 46,
          }}
        >
          {locating ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <Ionicons
              name={position ? "locate" : "navigate-outline"}
              size={18}
              color={colors.primary}
            />
          )}
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              color: colors.primary,
              fontSize: 12,
              flex: 1,
            }}
          >
            {locating
              ? "Localizando…"
              : position
                ? "Perto de mim · desativar"
                : "Perto de mim"}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Filtros avançados"
          accessibilityState={{ expanded: advanced }}
          onPress={() => {
            if (!advanced) {
              setDraftCity(city);
              setDraftState(state);
              setFilterError(undefined);
            }
            setAdvanced(!advanced);
          }}
          style={{
            padding: 12,
            borderRadius: 15,
            backgroundColor: advanced || city || state ? "#D1FAE5" : "#F1F5F4",
            minHeight: 46,
          }}
        >
          <Ionicons name="options-outline" size={22} color={colors.primary} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mapa"
          onPress={openMap}
          style={{
            padding: 12,
            borderRadius: 15,
            backgroundColor: "#F1F5F4",
            minHeight: 46,
          }}
        >
          <Ionicons name="map-outline" size={22} color={colors.primary} />
        </Pressable>
      </View>
      {advanced && (
        <Card>
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 16,
              color: colors.text,
            }}
          >
            Onde vamos explorar?
          </Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Field
                label="Cidade"
                value={draftCity}
                onChangeText={setDraftCity}
                maxLength={100}
                placeholder="Ex.: Belo Horizonte"
              />
            </View>
            <View style={{ width: 80 }}>
              <Field
                label="UF"
                value={draftState}
                onChangeText={(v) => setDraftState(v.toUpperCase())}
                autoCapitalize="characters"
                maxLength={2}
                placeholder="MG"
              />
            </View>
          </View>
          {filterError != null && <ErrorState error={filterError} />}
          <PrimaryButton title="Aplicar filtros" onPress={applyFilters} />
          <Pressable
            accessibilityRole="button"
            onPress={clearFilters}
            style={{ padding: 10, alignItems: "center" }}
          >
            <Text
              style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}
            >
              Limpar busca e filtros
            </Text>
          </Pressable>
        </Card>
      )}
      {locationError != null && <ErrorState error={locationError} />}
      <CategoryChips
        compact
        value={category}
        onChange={(value) => setFilters({ ...filters, category: value })}
      />
      {!filtered && !position && <DiscoveryHero />}
      {filtered && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          {[
            search ? `“${search}”` : "",
            city,
            state,
            category !== "Todos" ? category : "",
          ]
            .filter(Boolean)
            .map((label, i) => (
              <Text
                key={`${label}-${i}`}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  borderRadius: 12,
                  backgroundColor: "#F1F5F4",
                  fontFamily: "Inter_400Regular",
                  fontSize: 12,
                  color: colors.primary,
                }}
              >
                {label}
              </Text>
            ))}
          <Pressable
            accessibilityRole="button"
            onPress={clearFilters}
            style={{ padding: 8 }}
          >
            <Text
              style={{
                color: colors.primary,
                fontFamily: "Inter_600SemiBold",
                fontSize: 12,
              }}
            >
              Limpar busca e filtros
            </Text>
          </Pressable>
        </View>
      )}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <Text
          accessibilityRole="header"
          style={{
            fontFamily: "Inter_700Bold",
            fontSize: 18,
            color: colors.text,
            flex: 1,
          }}
        >
          {filtered ? "Resultados da busca" : "Explore o catálogo"}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Atualizar lugares"
          disabled={!configured || q.isFetching}
          onPress={() => void q.refetch()}
          style={{ padding: 8 }}
        >
          {q.isRefetching ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="refresh-outline" size={20} color={colors.primary} />
          )}
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={openMap}
          style={{ paddingVertical: 8 }}
        >
          <Text
            style={{
              color: colors.primary,
              fontFamily: "Inter_600SemiBold",
              fontSize: 12,
            }}
          >
            Ver mapa
          </Text>
        </Pressable>
      </View>
      {position && (
        <Text
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 12,
            lineHeight: 18,
            color: colors.muted,
          }}
        >
          Lugares com coordenadas, do mais próximo ao mais distante. Sua
          localização é usada somente nesta busca.
        </Text>
      )}
      {!configured ? (
        <EmptyState text="Supabase não configurado. Conecte seu projeto para consultar lugares reais." />
      ) : q.isPending ? (
        <View
          accessibilityLiveRegion="polite"
          style={{ padding: 24, alignItems: "center", gap: 12 }}
        >
          <ActivityIndicator color={colors.primary} />
          <Copy>Buscando lugares…</Copy>
        </View>
      ) : q.isError ? (
        <>
          <ErrorState error={q.error} />
          <PrimaryButton
            title="Tentar novamente"
            onPress={() => void q.refetch()}
          />
        </>
      ) : (
        <>
          {items.length === 0 && (
            <View
              style={{
                borderRadius: 22,
                borderWidth: 1,
                borderColor: "#DFE9E4",
                padding: 20,
                gap: 12,
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: "#E9F5EF",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name={
                    filtered
                      ? "search-outline"
                      : position
                        ? "navigate-outline"
                        : "location-outline"
                  }
                  size={25}
                  color={colors.primary}
                />
              </View>
              <Text
                accessibilityRole="header"
                style={{
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 18,
                  textAlign: "center",
                  color: colors.text,
                }}
              >
                {filtered || position
                  ? "Nenhum lugar encontrado."
                  : "A próxima descoberta pode ser sua."}
              </Text>
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 13,
                  lineHeight: 21,
                  color: colors.muted,
                  textAlign: "center",
                }}
              >
                {filtered
                  ? "Tente outro nome, amplie a região ou limpe os filtros para explorar de novo."
                  : position
                    ? "Ainda não há lugares aprovados com coordenadas nesta busca. Você pode voltar à lista nacional ou cadastrar um local."
                    : "Compartilhe um lugar que você conhece e ajude nossa comunidade a crescer."}
              </Text>
              {filtered && (
                <Pressable
                  accessibilityRole="button"
                  onPress={clearFilters}
                  style={{ padding: 10 }}
                >
                  <Text
                    style={{
                      fontFamily: "Inter_600SemiBold",
                      color: colors.primary,
                    }}
                  >
                    Ver todos os lugares
                  </Text>
                </Pressable>
              )}
              <View style={{ alignSelf: "stretch" }}>
                <PrimaryButton
                  title="Adicionar lugar"
                  onPress={() => router.push("/(tabs)/add")}
                />
              </View>
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 11,
                  lineHeight: 17,
                  color: colors.muted,
                  textAlign: "center",
                }}
              >
                Os cadastros aparecem para a comunidade após aprovação.
              </Text>
            </View>
          )}
          {items.map((p) => (
            <PlaceCard key={p.id} place={p} />
          ))}
          {q.hasNextPage && (
            <PrimaryButton
              title={q.isFetchingNextPage ? "Carregando…" : "Carregar mais"}
              disabled={q.isFetchingNextPage}
              onPress={() => void q.fetchNextPage()}
            />
          )}
          {items.length > 0 && (
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 11,
                lineHeight: 18,
                textAlign: "center",
                color: colors.muted,
              }}
            >
              Informações compartilhadas pela comunidade. Puxe para baixo para
              atualizar.
            </Text>
          )}
        </>
      )}
    </Screen>
  );
}
