import { Pressable, View, Text, ScrollView } from "react-native";
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
}: {
  value: string;
  onChange: (v: string) => void;
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
          accessibilityRole="button"
          accessibilityState={{ selected: c === value }}
          onPress={() => onChange(c)}
          style={{
            padding: 12,
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
