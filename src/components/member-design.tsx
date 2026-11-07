import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { PropsWithChildren, ComponentProps } from "react";
import { colors } from "./ui";
export function WarmIntro({
  eyebrow,
  title,
  body,
}: {
  eyebrow?: string;
  title: string;
  body: string;
}) {
  return (
    <View style={m.intro}>
      {eyebrow && <Text style={m.eyebrow}>{eyebrow}</Text>}
      <Text accessibilityRole="header" style={m.heading}>
        {title}
      </Text>
      <Text style={m.body}>{body}</Text>
    </View>
  );
}
export function ActionRow({
  title,
  detail,
  icon,
  onPress,
  expanded,
}: {
  title: string;
  detail?: string;
  icon: ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
  expanded?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={expanded === undefined ? undefined : { expanded }}
      onPress={onPress}
      style={({ pressed }) => [m.action, pressed && { opacity: 0.7 }]}
    >
      <View style={m.actionIcon}>
        <Ionicons name={icon} size={21} color={colors.primary} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={m.label}>{title}</Text>
        {detail && <Text style={m.small}>{detail}</Text>}
      </View>
      <Ionicons
        name={expanded ? "chevron-up" : "chevron-forward"}
        size={18}
        color={colors.muted}
      />
    </Pressable>
  );
}
export function QuietButton({
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
      disabled={disabled}
      accessibilityState={{ disabled }}
      onPress={onPress}
      style={({ pressed }) => [
        m.quiet,
        (pressed || disabled) && { opacity: 0.55 },
      ]}
    >
      <Text style={m.quietText}>{title}</Text>
    </Pressable>
  );
}
export function GentleNote({ children }: PropsWithChildren) {
  return (
    <View style={m.note}>
      <Ionicons name="heart-outline" color={colors.primary} size={18} />
      <Text style={[m.small, { flex: 1, lineHeight: 19, color: "#396F63" }]}>
        {children}
      </Text>
    </View>
  );
}
export function ProfileCover({ children }: PropsWithChildren) {
  return (
    <LinearGradient colors={["#EDF8F1", "#F8FCFA"]} style={m.cover}>
      {children}
    </LinearGradient>
  );
}
export const m = StyleSheet.create({
  intro: { gap: 8, paddingVertical: 5 },
  eyebrow: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9,
    letterSpacing: 1.6,
    color: colors.primary,
  },
  heading: {
    fontFamily: "Inter_700Bold",
    fontSize: 27,
    lineHeight: 34,
    letterSpacing: -0.8,
    color: "#173C35",
  },
  body: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 22,
    color: colors.muted,
  },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: colors.text },
  small: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 3,
    minHeight: 68,
    borderBottomWidth: 1,
    borderBottomColor: "#EAF0EC",
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ECF6F0",
  },
  quiet: {
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#C8DBD1",
    padding: 13,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  quietText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: colors.primary,
  },
  note: {
    backgroundColor: "#EDF7F0",
    padding: 14,
    borderRadius: 16,
    gap: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  cover: {
    borderRadius: 25,
    padding: 25,
    gap: 13,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0EEE4",
  },
  section: { fontFamily: "Inter_700Bold", fontSize: 18, color: colors.text },
});
