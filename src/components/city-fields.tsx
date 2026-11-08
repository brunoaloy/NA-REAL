import { Text, View, Pressable } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Field, colors } from "./ui";
import { m } from "./member-design";
import { suggestCities } from "../services/cities";
import type { CityPreference } from "../validation/cities";
export function CityFields({
  city,
  state,
  onCity,
  onState,
  onSelect,
  disabled = false,
}: {
  city: string;
  state: string;
  onCity: (value: string) => void;
  onState: (value: string) => void;
  onSelect: (value: CityPreference) => void;
  disabled?: boolean;
}) {
  const [suggesting, setSuggesting] = useState(false);
  const suggestions = suggesting ? suggestCities(city, state) : [];
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Field
            label="Cidade"
            placeholder="Digite sua cidade"
            value={city}
            onFocus={() => setSuggesting(true)}
            onChangeText={(value) => {
              setSuggesting(true);
              onCity(value);
            }}
            maxLength={100}
            editable={!disabled}
            autoCorrect={false}
          />
        </View>
        <View style={{ width: 78 }}>
          <Field
            label="UF"
            placeholder="RS"
            value={state}
            onChangeText={(value) => {
              setSuggesting(true);
              onState(value.toUpperCase());
            }}
            maxLength={2}
            autoCapitalize="characters"
            editable={!disabled}
          />
        </View>
      </View>
      {suggestions.length > 0 && !disabled && (
        <View
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 16,
            overflow: "hidden",
            backgroundColor: colors.surface,
          }}
        >
          <Text style={[m.small, { paddingHorizontal: 14, paddingTop: 10 }]}>
            Sugestões de cidades
          </Text>
          {suggestions.map((value) => (
            <Pressable
              key={value.city + value.state}
              accessibilityRole="button"
              accessibilityLabel={`Usar ${value.city}, ${value.state}`}
              onPress={() => {
                onSelect({ city: value.city, state: value.state });
                setSuggesting(false);
              }}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                padding: 14,
                minHeight: 48,
                backgroundColor: pressed ? colors.soft : colors.surface,
              })}
            >
              <Ionicons
                name="location-outline"
                size={18}
                color={colors.primary}
              />
              <Text style={[m.label, { flex: 1 }]}>
                {value.city}, {value.state}
              </Text>
              <Ionicons
                name="arrow-up-outline"
                size={15}
                color={colors.muted}
              />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
