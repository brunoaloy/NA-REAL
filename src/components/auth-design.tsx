import { useState, type PropsWithChildren } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router, useIsFocused } from "expo-router";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
export const authColors = {
  teal: "#0F766E",
  dark: "#064E49",
  mint: "#E7F5EF",
  muted: "#64748B",
  text: "#1F2937",
};
export function Brand({
  white = false,
  large = false,
}: {
  white?: boolean;
  large?: boolean;
}) {
  const color = white ? "#FFFFFF" : authColors.dark;
  return (
    <View style={styles.brand} accessible accessibilityLabel="na real.">
      {white ? (
        <Ionicons
          name="location"
          size={large ? 78 : 62}
          color="#FFFFFF"
          accessible={false}
        />
      ) : (
        <View>
          <Ionicons
            name="location"
            size={large ? 78 : 62}
            color={authColors.teal}
            accessible={false}
          />
          <View pointerEvents="none" style={styles.pinShine} />
        </View>
      )}
      <Text
        style={[
          styles.wordmark,
          { color },
          large && { fontSize: 46, lineHeight: 54 },
        ]}
      >
        na real.
      </Text>
    </View>
  );
}
export function AuthShell({
  children,
  onBack,
}: PropsWithChildren<{ onBack?: () => void }>) {
  const focused = useIsFocused();
  return (
    <SafeAreaView style={styles.page}>
      {focused && <StatusBar style="dark" />}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.shell}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.navigation}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              hitSlop={8}
              onPress={
                onBack ??
                (() =>
                  router.canGoBack() ? router.back() : router.replace("/"))
              }
              style={styles.back}
            >
              <Ionicons name="chevron-back" size={25} color={authColors.dark} />
            </Pressable>
          </View>
          <View style={styles.content}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function AuthButton({
  title,
  onPress,
  busy = false,
}: {
  title: string;
  onPress: () => void;
  busy?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: busy, busy }}
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        (pressed || busy) && { opacity: 0.75 },
      ]}
    >
      <LinearGradient
        colors={["#0F766E", "#008677"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.buttonFill}
      >
        {busy && <ActivityIndicator color="#FFFFFF" size="small" />}
        <Text style={styles.buttonText}>{busy ? "Aguarde…" : title}</Text>
      </LinearGradient>
    </Pressable>
  );
}
export function AuthField({
  label,
  password = false,
  confirmation = false,
  ...props
}: TextInputProps & {
  label: string;
  password?: boolean;
  confirmation?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const subject = confirmation ? "confirmação de senha" : "senha";
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.fieldBox}>
        <Ionicons
          name={password ? "lock-closed-outline" : "mail-outline"}
          size={21}
          color={authColors.dark}
          accessible={false}
        />
        <TextInput
          {...props}
          accessibilityLabel={label}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={password && !visible}
          placeholderTextColor="#84909F"
          style={[styles.input, props.style]}
        />
        {password && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${visible ? "Ocultar" : "Mostrar"} ${subject}`}
            onPress={() => setVisible((v) => !v)}
            style={styles.eye}
          >
            <Ionicons
              name={visible ? "eye-off-outline" : "eye-outline"}
              size={21}
              color="#596579"
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}
export function AuthNotice({
  children,
  success = false,
}: PropsWithChildren<{ success?: boolean }>) {
  return (
    <View accessibilityLiveRegion="polite" style={styles.notice}>
      <Ionicons
        name={success ? "checkmark-circle-outline" : "mail-outline"}
        size={21}
        color={authColors.teal}
      />
      <Text style={styles.noticeText}>{children}</Text>
    </View>
  );
}
export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#FFFFFF" },
  shell: { flexGrow: 1, paddingHorizontal: 25, paddingBottom: 22 },
  navigation: {
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    height: 44,
    justifyContent: "center",
  },
  back: { width: 44, height: 44, justifyContent: "center", marginLeft: -10 },
  content: { flex: 1, width: "100%", maxWidth: 430, alignSelf: "center" },
  brand: { alignItems: "center", gap: 0 },
  wordmark: {
    fontFamily: "Inter_700Bold",
    fontSize: 38,
    lineHeight: 46,
    letterSpacing: -1.5,
  },
  pinShine: {
    position: "absolute",
    top: 4,
    left: 17,
    width: 19,
    height: 12,
    borderRadius: 12,
    backgroundColor: "#FFFFFF15",
    transform: [{ rotate: "-25deg" }],
  },
  heading: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
    lineHeight: 33,
    letterSpacing: -0.9,
    textAlign: "center",
    color: authColors.text,
    marginTop: 23,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 21,
    textAlign: "center",
    color: authColors.muted,
    marginTop: 7,
  },
  form: { gap: 17, marginTop: 28 },
  field: { gap: 8 },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: authColors.text,
  },
  fieldBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingLeft: 14,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    minHeight: 51,
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 14,
    paddingRight: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: authColors.text,
  },
  eye: {
    width: 44,
    minHeight: 49,
    alignItems: "center",
    justifyContent: "center",
  },
  button: { borderRadius: 16, overflow: "hidden", minHeight: 52 },
  buttonFill: {
    minHeight: 52,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  buttonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  link: {
    fontFamily: "Inter_600SemiBold",
    color: authColors.teal,
    fontSize: 13,
  },
  switchRow: {
    alignItems: "center",
    paddingVertical: 16,
    marginTop: 6,
    minHeight: 48,
  },
  switchText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 22,
    textAlign: "center",
    color: authColors.text,
  },
  helper: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    lineHeight: 17,
    color: authColors.muted,
  },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: authColors.mint,
    borderRadius: 13,
    padding: 13,
  },
  noticeText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 19,
    color: authColors.dark,
  },
  error: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 20,
    color: "#B42318",
    padding: 12,
    backgroundColor: "#FFF2EF",
    borderRadius: 12,
  },
  footer: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    lineHeight: 18,
    color: authColors.muted,
    textAlign: "center",
    marginTop: "auto",
    paddingTop: 24,
    paddingBottom: 6,
  },
});
