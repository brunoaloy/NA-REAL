import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { View, Pressable, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  Screen,
  Copy,
  Field,
  PrimaryButton,
  EmptyState,
  ErrorState,
} from "../../components/ui";
import { AppHeader, CategoryChips, PlaceCard } from "../../components/design";
import { places } from "../../services/catalog";
import { configured } from "../../services/supabase";
export default function Explore() {
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const [category, setCategory] = useState("Todos");
  const q = useInfiniteQuery({
    queryKey: ["places", search, category, city, state],
    queryFn: ({ pageParam }) =>
      places(search, category, pageParam, city, state),
    initialPageParam: 0,
    getNextPageParam: (last, pages) =>
      last.length === 50 ? pages.length : undefined,
    enabled: configured,
  });
  return (
    <Screen>
      <AppHeader />
      <Field
        label="Buscar lugares ou cidades"
        placeholder="Buscar lugares, cidades ou experiências…"
        value={input}
        onChangeText={setInput}
        onSubmitEditing={() => setSearch(input)}
      />
      <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
        <View style={{ flex: 1 }}>
          <PrimaryButton title="Buscar" onPress={() => setSearch(input)} />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Filtros avançados"
          onPress={() => setAdvanced(!advanced)}
          style={{ padding: 14 }}
        >
          <Ionicons name="options-outline" size={24} color="#0F766E" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mapa"
          onPress={() => router.push("/map")}
          style={{ padding: 14 }}
        >
          <Ionicons name="map-outline" size={24} color="#0F766E" />
        </Pressable>
      </View>
      {advanced && (
        <>
          <Field label="Cidade" value={city} onChangeText={setCity} />
          <Field
            label="UF"
            value={state}
            onChangeText={(v) => setState(v.toUpperCase())}
            maxLength={2}
          />
        </>
      )}
      <CategoryChips value={category} onChange={setCategory} />
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 17 }}>
          Explore o catálogo
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/map")}
        >
          <Text style={{ color: "#0F766E" }}>Ver mapa</Text>
        </Pressable>
      </View>
      <Copy>
        Catálogo colaborativo • cobertura conforme contribuições aprovadas.
      </Copy>
      {!configured ? (
        <EmptyState text="Supabase não configurado. Conecte seu projeto para consultar lugares reais." />
      ) : q.isPending ? (
        <Copy>Buscando lugares…</Copy>
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
          {q.data.pages.flat().length === 0 && (
            <>
              <EmptyState text="Nenhum lugar encontrado. Você pode cadastrar um lugar." />
              <PrimaryButton
                title="Adicionar lugar"
                onPress={() => router.push("/(tabs)/add")}
              />
            </>
          )}
          {q.data.pages.flat().map((p) => (
            <PlaceCard key={p.id} place={p} />
          ))}
          {q.hasNextPage && (
            <PrimaryButton
              title="Carregar mais"
              disabled={q.isFetchingNextPage}
              onPress={() => void q.fetchNextPage()}
            />
          )}
        </>
      )}
    </Screen>
  );
}
