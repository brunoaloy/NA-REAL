import { Pressable, View, Text, ScrollView, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { colors } from "./ui";
import type { Place } from "../services/catalog";
import { PhotoGallery } from "./photos";
export function AppHeader({
  title = "na real.",
  back = false,
}: {
  title?: string;
  back?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
      }}
    >
      {back && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          onPress={() => router.back()}
          style={{ padding: 10 }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </Pressable>
      )}
      <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
        {!back && <Ionicons name="location" color={colors.primary} size={30} />}
        <Text
          accessibilityRole="header"
          style={{
            fontSize: back ? 20 : title === "na real." ? 28 : 22,
            flexShrink: 1,
            fontFamily: "Inter_700Bold",
            color: colors.primary,
          }}
        >
          {title}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Notificações"
        onPress={() => router.push("/notifications")}
        style={{
          width: 44,
          height: 44,
          borderRadius: 16,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F1F7F3",
        }}
      >
        <Ionicons
          name="notifications-outline"
          size={22}
          color={colors.primary}
        />
      </Pressable>
    </View>
  );
}
export const categories = ["Todos", "Comer", "Lazer", "Compras", "Serviços"];
export function CategoryChips({
  value,
  onChange,
  compact = false,
  includeAll = true,
}: {
  value: string;
  onChange: (v: string) => void;
  compact?: boolean;
  includeAll?: boolean;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8 }}
    >
      {categories.map((c, i) =>
        !includeAll && c === "Todos" ? null : (
          <Pressable
            key={c}
            accessibilityLabel={c}
            accessibilityRole="button"
            accessibilityState={{ selected: c === value }}
            aria-pressed={c === value}
            onPress={() => onChange(c)}
            style={{
              padding: compact ? 10 : 12,
              paddingHorizontal: compact ? 15 : 12,
              flexDirection: compact ? "row" : "column",
              borderRadius: 18,
              minHeight: 46,
              backgroundColor: c === value ? colors.primary : colors.surface,
              borderWidth: 1,
              borderColor: c === value ? colors.primary : colors.border,
              alignItems: "center",
              gap: 6,
            }}
          >
            <Ionicons
              name={
                (
                  [
                    "grid-outline",
                    "restaurant-outline",
                    "leaf-outline",
                    "bag-outline",
                    "construct-outline",
                  ] as const
                )[i]
              }
              size={18}
              color={c === value ? "#FFFFFF" : colors.primary}
            />
            <Text
              style={{
                fontFamily:
                  c === value ? "Inter_600SemiBold" : "Inter_400Regular",
                fontSize: 12,
                color: c === value ? "#FFFFFF" : colors.text,
              }}
            >
              {c}
            </Text>
          </Pressable>
        ),
      )}
    </ScrollView>
  );
}
export function RatingStars({
  rating,
  count,
}: {
  rating: number | null;
  count: number;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        flexWrap: "wrap",
      }}
    >
      <Ionicons
        name={rating == null ? "star-outline" : "star"}
        size={14}
        color={rating == null ? colors.muted : "#B17C22"}
      />
      <Text
        style={{
          fontFamily: "Inter_600SemiBold",
          fontSize: 12,
          color: colors.muted,
        }}
      >
        {rating == null
          ? "Seja o primeiro a avaliar"
          : `${Number(rating).toFixed(1)} · ${count} ${count === 1 ? "avaliação" : "avaliações"}`}
      </Text>
    </View>
  );
}
export function PlaceCard({
  place: p,
  preview = false,
  onClose,
  onMap,
}: {
  place: Place;
  preview?: boolean;
  onClose?: () => void;
  onMap?: () => void;
}) {
  const open = () =>
    router.push({ pathname: "/place/[id]", params: { id: p.id } });
  const info = (
    <View style={{ flex: 1, gap: 8, minWidth: 0 }}>
      <Text
        style={{
          fontFamily: "Inter_600SemiBold",
          fontSize: 10,
          letterSpacing: 1.1,
          color: colors.primary,
        }}
      >
        {p.category.toLocaleUpperCase("pt-BR")}
      </Text>
      <Text
        style={{
          fontFamily: "Inter_700Bold",
          fontSize: preview ? 18 : 21,
          letterSpacing: -0.4,
          color: colors.text,
        }}
      >
        {p.name}
      </Text>
      <Text
        style={{
          fontFamily: "Inter_400Regular",
          fontSize: 12,
          lineHeight: 18,
          color: colors.muted,
        }}
      >
        {[p.city, p.state].filter(Boolean).join(", ")}
      </Text>
      <RatingStars rating={p.rating} count={p.review_count} />
    </View>
  );
  if (preview)
    return (
      <View style={{ backgroundColor: colors.surface, padding: 16, gap: 14 }}>
        <View
          style={{ flexDirection: "row", gap: 13, alignItems: "flex-start" }}
        >
          <PhotoGallery placeId={p.id} compact />
          {info}
          {onClose && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fechar prévia do lugar"
              onPress={onClose}
              hitSlop={4}
              style={{
                width: 44,
                height: 44,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.background,
                borderRadius: 20,
              }}
            >
              <Ionicons name="close" size={18} color={colors.muted} />
            </Pressable>
          )}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={"Conhecer " + p.name}
          onPress={open}
          style={({ pressed }) => ({
            borderRadius: 14,
            padding: 14,
            minHeight: 48,
            backgroundColor: colors.primary,
            alignItems: "center",
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text
            style={{
              color: "white",
              fontFamily: "Inter_600SemiBold",
              fontSize: 14,
            }}
          >
            Conhecer lugar
          </Text>
        </Pressable>
      </View>
    );
  return (
    <View style={{ gap: 4 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={"Abrir " + p.name}
        onPress={open}
        style={({ pressed }) => ({
          borderRadius: 24,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: "hidden",
          opacity: pressed ? 0.86 : 1,
        })}
      >
        <PhotoGallery placeId={p.id} compact cover />
        <View
          style={{
            padding: 18,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          {info}
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colors.soft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="arrow-forward" size={18} color={colors.primary} />
          </View>
        </View>
      </Pressable>
      {onMap && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={"Ver " + p.name + " no mapa"}
          onPress={onMap}
          style={{
            minHeight: 44,
            padding: 10,
            alignSelf: "flex-end",
            flexDirection: "row",
            alignItems: "center",
            gap: 7,
          }}
        >
          <Ionicons name="map-outline" size={16} color={colors.primary} />
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 12,
              color: colors.primary,
            }}
          >
            Ver no mapa
          </Text>
        </Pressable>
      )}
    </View>
  );
}
export function StatusChip({ state }: { state: string }) {
  const labels: Record<string, string> = {
    pending: "Pendente de análise",
    approved: "Aprovado",
    rejected: "Rejeitado",
    removed: "Removido",
    superseded: "Versão substituída",
  };
  return (
    <Text
      style={{
        alignSelf: "flex-start",
        borderRadius: 14,
        padding: 8,
        backgroundColor: state === "approved" ? "#D1FAE5" : "#F1F5F9",
        color: colors.text,
      }}
    >
      {labels[state] ?? state}
    </Text>
  );
}

export function SearchBar({
  value,
  onChange,
  onSearch,
  label = "Buscar lugares ou cidades",
  buttonLabel = "Buscar",
  placeholder = "Lugares ou cidades…",
  busy = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onSearch: (value: string) => void;
  label?: string;
  buttonLabel?: string;
  placeholder?: string;
  busy?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F5F8F7",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#DFE9E4",
        paddingLeft: 14,
        minHeight: 54,
        gap: 10,
      }}
    >
      <Ionicons name="search-outline" size={20} color={colors.primary} />
      <TextInput
        accessibilityLabel={label}
        placeholder={placeholder}
        editable={!busy}
        placeholderTextColor={colors.muted}
        value={value}
        onChangeText={onChange}
        maxLength={120}
        returnKeyType="search"
        onSubmitEditing={() => onSearch(value)}
        style={{
          flex: 1,
          minWidth: 0,
          paddingVertical: 14,
          fontFamily: "Inter_400Regular",
          fontSize: 14,
          color: colors.text,
        }}
      />
      {value !== "" && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Limpar texto da busca"
          disabled={busy}
          hitSlop={8}
          onPress={() => {
            onChange("");
            onSearch("");
          }}
          style={{ padding: 6 }}
        >
          <Ionicons name="close-circle" size={18} color={colors.muted} />
        </Pressable>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={buttonLabel}
        disabled={busy}
        accessibilityState={{ disabled: busy, busy }}
        onPress={() => onSearch(value)}
        style={{
          padding: 14,
          borderTopRightRadius: 15,
          borderBottomRightRadius: 15,
          backgroundColor: colors.primary,
          minHeight: 52,
          justifyContent: "center",
        }}
      >
        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}
export function DiscoveryHero({
  city,
  state,
  onChooseCity,
}: {
  city: string;
  state: string;
  onChooseCity: () => void;
}) {
  return (
    <View style={{ gap: 15, paddingTop: 2 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Escolher cidade"
        onPress={onChooseCity}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: 7,
          alignSelf: "flex-start",
          backgroundColor: colors.soft,
          paddingHorizontal: 12,
          paddingVertical: 10,
          minHeight: 44,
          borderRadius: 22,
          opacity: pressed ? 0.7 : 1,
          maxWidth: "100%",
        })}
      >
        <Ionicons name="location-outline" size={16} color={colors.primary} />
        <Text
          numberOfLines={2}
          style={{
            flexShrink: 1,
            fontFamily: "Inter_600SemiBold",
            fontSize: 12,
            color: colors.primary,
          }}
        >
          {city
            ? [city, state].filter(Boolean).join(", ")
            : state
              ? `Explorando ${state}`
              : "Escolha sua cidade"}
        </Text>
        <Ionicons name="chevron-down" size={14} color={colors.primary} />
      </Pressable>
      <Text
        accessibilityRole="header"
        style={{
          fontFamily: "Inter_700Bold",
          fontSize: 31,
          lineHeight: 38,
          letterSpacing: -1,
          color: colors.ink,
        }}
      >
        O que vamos{`\n`}descobrir hoje?
      </Text>
      <Text
        style={{
          fontFamily: "Inter_400Regular",
          fontSize: 14,
          lineHeight: 22,
          color: colors.muted,
        }}
      >
        Lugares para viver. Dicas para confiar.
      </Text>
    </View>
  );
}
