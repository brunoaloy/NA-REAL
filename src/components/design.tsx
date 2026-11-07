import { Pressable, View, Text, ScrollView, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Card, Copy, colors } from "./ui";
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
            fontSize: back ? 20 : 28,
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
        style={{ padding: 10 }}
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
}: {
  value: string;
  onChange: (v: string) => void;
  compact?: boolean;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8 }}
    >
      {categories.map((c, i) => (
        <Pressable
          key={c}
          accessibilityLabel={c}
          accessibilityRole="button"
          accessibilityState={{ selected: c === value }}
          onPress={() => onChange(c)}
          style={{
            padding: compact ? 10 : 12,
            paddingHorizontal: compact ? 14 : 12,
            flexDirection: compact ? "row" : "column",
            borderRadius: 20,
            backgroundColor: c === value ? "#D1FAE5" : "#F1F5F9",
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
            size={20}
            color={colors.primary}
          />
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 12,
              color: colors.text,
            }}
          >
            {c}
          </Text>
        </Pressable>
      ))}
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
    <Copy>
      {rating == null
        ? "Sem avaliações"
        : `★ ${Number(rating).toFixed(1)} (${count} avaliações)`}
    </Copy>
  );
}
export function PlaceCard({ place: p }: { place: Place }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={"Abrir " + p.name}
      onPress={() =>
        router.push({ pathname: "/place/[id]", params: { id: p.id } })
      }
    >
      <Card>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <PhotoGallery placeId={p.id} compact />
          <View style={{ flex: 1, gap: 3 }}>
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 17,
                color: colors.text,
              }}
            >
              {p.name}
            </Text>
            <RatingStars rating={p.rating} count={p.review_count} />
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 12,
                color: colors.muted,
              }}
            >
              {p.category} · {p.city}, {p.state}
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted }}>
              Consulte relatos em Ao vivo
            </Text>
          </View>
        </View>
      </Card>
    </Pressable>
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
}: {
  value: string;
  onChange: (value: string) => void;
  onSearch: (value: string) => void;
  label?: string;
  buttonLabel?: string;
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
        placeholder="Lugares ou cidades…"
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
export function DiscoveryHero() {
  return (
    <View
      style={{
        backgroundColor: "#E9F5EF",
        borderRadius: 24,
        padding: 23,
        overflow: "hidden",
        gap: 10,
      }}
    >
      <View
        style={{
          position: "absolute",
          right: -25,
          top: -24,
          width: 145,
          height: 145,
          borderRadius: 80,
          borderWidth: 22,
          borderColor: "#D8EDE0",
        }}
      />
      <Text
        style={{
          fontFamily: "Inter_600SemiBold",
          fontSize: 9,
          letterSpacing: 1.5,
          color: colors.primary,
        }}
      >
        DESCUBRA. AVALIE. COMPARTILHE.
      </Text>
      <Text
        accessibilityRole="header"
        style={{
          fontFamily: "Inter_700Bold",
          fontSize: 27,
          lineHeight: 33,
          letterSpacing: -0.7,
          color: "#104F47",
          maxWidth: 255,
        }}
      >
        Um novo olhar{`\n`}para cada lugar.
      </Text>
      <Text
        style={{
          fontFamily: "Inter_400Regular",
          fontSize: 13,
          lineHeight: 20,
          color: "#4E6F66",
          maxWidth: 260,
        }}
      >
        Descobertas de quem vive a cidade.{`\n`}A próxima pode ser sua.
      </Text>
    </View>
  );
}
