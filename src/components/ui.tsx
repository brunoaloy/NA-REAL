import { fonts } from "../theme/fonts";
import { LinearGradient } from "expo-linear-gradient";
import { errorMessage } from "../validation/errors";
import { OfflineBanner } from "./connectivity";
import {
  useEffect,
  useRef,
  PropsWithChildren,
  type ComponentProps,
  type ComponentRef,
} from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  View,
  RefreshControl,
  TextInputProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
export const colors = {
  primary: "#0F766E",
  accent: "#10B981",
  background: "#F7FAF8",
  surface: "#FFFFFF",
  soft: "#E8F3ED",
  border: "#DFE9E3",
  ink: "#153E36",
  text: "#1F2937",
  muted: "#64748B",
};
export function Screen({
  children,
  onRefresh,
  refreshing = false,
  scrollKey,
}: PropsWithChildren<{
  onRefresh?: () => void;
  refreshing?: boolean;
  scrollKey?: string | number;
}>) {
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  useEffect(() => {
    if (scrollKey !== undefined)
      scroll.current?.scrollTo({ y: 0, animated: false });
  }, [scrollKey]);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <OfflineBanner />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          ref={scroll}
          contentContainerStyle={s.screen}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
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
      <LinearGradient
        colors={["#0F766E", "#008677"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.buttonFill}
      >
        <Text style={s.buttonText}>{title}</Text>
      </LinearGradient>
    </Pressable>
  );
}
export function Field({
  label,
  style,
  ...props
}: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        {...props}
        style={[s.input, style]}
      />
    </View>
  );
}
export function EmptyState({
  text = "Sua próxima descoberta começa por aqui.",
  icon = "compass-outline",
  action,
}: {
  text?: string;
  icon?: ComponentProps<typeof Ionicons>["name"];
  action?: { title: string; onPress: () => void };
}) {
  return (
    <Card>
      <View style={{ gap: 14, alignItems: "center", paddingVertical: 9 }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 18,
            backgroundColor: colors.soft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name={icon} size={24} color={colors.primary} />
        </View>
        <Text
          style={[
            s.copy,
            { color: colors.muted, textAlign: "center", fontSize: 14 },
          ]}
        >
          {text}
        </Text>
        {action && (
          <Pressable
            accessibilityRole="button"
            onPress={action.onPress}
            style={{ padding: 12, minHeight: 44 }}
          >
            <Text
              style={{
                fontFamily: fonts.semibold,
                color: colors.primary,
                fontSize: 13,
              }}
            >
              {action.title}
            </Text>
          </Pressable>
        )}
      </View>
    </Card>
  );
}
export function ErrorState({ error }: { error: unknown }) {
  return (
    <Text
      accessibilityRole="alert"
      style={{
        color: "#B91C1C",
        fontFamily: fonts.regular,
        fontSize: 14,
        lineHeight: 21,
        padding: 12,
        borderRadius: 12,
        backgroundColor: "#FFF2EF",
      }}
    >
      {errorMessage(error)}
    </Text>
  );
}
export const s = StyleSheet.create({
  screen: {
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    padding: 22,
    gap: 18,
    paddingBottom: 40,
  },
  title: { fontSize: 24, fontFamily: fonts.bold, color: colors.primary },
  copy: {
    fontSize: 15,
    lineHeight: 23,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  card: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E3EBE6",
    gap: 10,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    minHeight: 48,
    overflow: "hidden",
    alignItems: "stretch",
  },
  buttonFill: {
    padding: 14,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { fontFamily: fonts.semibold, color: "white", fontSize: 15 },
  fieldLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.text,
  },
  input: {
    backgroundColor: "white",
    borderColor: "#D5E1DA",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 14,
    minHeight: 50,
  },
});
