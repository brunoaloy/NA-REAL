import { OfflineBanner } from "./connectivity";
import { PropsWithChildren } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  View,
  TextInputProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
export const colors = {
  primary: "#0F766E",
  accent: "#10B981",
  background: "#FFFFFF",
  text: "#1F2937",
  muted: "#64748B",
};
export function Screen({ children }: PropsWithChildren) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <OfflineBanner />
      <ScrollView
        contentContainerStyle={s.screen}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
export function Title({ children }: PropsWithChildren) {
  return (
    <Text accessibilityRole="header" style={s.title}>
      {children}
    </Text>
  );
}
export function Copy({ children }: PropsWithChildren) {
  return <Text style={s.copy}>{children}</Text>;
}
export function Card({ children }: PropsWithChildren) {
  return <View style={s.card}>{children}</View>;
}
export function PrimaryButton({
  title,
  onPress,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[s.button, disabled && { opacity: 0.5 }]}
    >
      <Text style={s.buttonText}>{title}</Text>
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.copy}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        style={s.input}
        {...props}
      />
    </View>
  );
}
export function EmptyState({
  text = "Nenhuma contribuição ainda.",
}: {
  text?: string;
}) {
  return (
    <Card>
      <Copy>{text}</Copy>
    </Card>
  );
}
export function ErrorState({ error }: { error: unknown }) {
  return (
    <Text accessibilityRole="alert" style={{ color: "#B91C1C" }}>
      {error instanceof Error ? error.message : String(error)}
    </Text>
  );
}
export const s = StyleSheet.create({
  screen: { padding: 20, gap: 18, paddingBottom: 40 },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", color: colors.primary },
  copy: {
    fontSize: 15,
    lineHeight: 23,
    fontFamily: "Inter_400Regular",
    color: colors.text,
  },
  card: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    minHeight: 48,
    padding: 14,
    alignItems: "center",
  },
  buttonText: { fontFamily: "Inter_600SemiBold", color: "white", fontSize: 15 },
  input: {
    backgroundColor: "white",
    borderColor: "#CBD5E1",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    color: colors.text,
    minHeight: 48,
  },
});
