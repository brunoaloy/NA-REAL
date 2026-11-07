import { router, useIsFocused } from "expo-router";
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Brand } from "../components/auth-design";
export default function Welcome() {
  const focused = useIsFocused();
  return (
    <ImageBackground
      source={require("../../assets/images/welcome-rio.png")}
      resizeMode="cover"
      imageStyle={{ width: "100%", height: "100%" }}
      style={s.background}
    >
      {focused && <StatusBar style="light" />}
      <LinearGradient
        colors={[
          "rgba(0,48,57,0.12)",
          "rgba(0,45,49,0.02)",
          "rgba(0,36,32,0.88)",
        ]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={s.safe}>
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={s.top}>
            <Brand white large />
            <Text style={s.tagline}>Descubra. Avalie. Compartilhe.</Text>
            <Text accessibilityRole="header" style={s.title}>
              O Brasil real{`\n`}começa por aqui.
            </Text>
            <Text style={s.subtitle}>
              Descubra lugares com o olhar{`\n`}de quem vive cada experiência.
            </Text>
          </View>
          <View style={s.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                router.push({ pathname: "/signup", params: { start: "1" } })
              }
              style={({ pressed }) => [s.primary, pressed && { opacity: 0.8 }]}
            >
              <LinearGradient
                colors={["#10B981", "#00A789"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.primaryFill}
              >
                <Text style={s.primaryText}>Começar</Text>
              </LinearGradient>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace("/(tabs)")}
              style={s.secondary}
            >
              <Text style={s.secondaryText}>Explorar como visitante</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Entrar"
              onPress={() =>
                router.push({ pathname: "/auth", params: { start: "1" } })
              }
              style={s.secondary}
            >
              <Text style={s.account}>
                Já tem uma conta? <Text style={s.login}>Entrar</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}
const s = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
    overflow: "hidden",
    backgroundColor: "#00555D",
  },
  safe: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 27,
    paddingBottom: 14,
    paddingTop: 36,
    alignItems: "center",
    justifyContent: "space-between",
    gap: 38,
  },
  top: { width: "100%", maxWidth: 430, alignItems: "center", paddingTop: 18 },
  tagline: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 22,
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 3,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 32,
    lineHeight: 39,
    letterSpacing: -0.7,
    textAlign: "center",
    color: "#FFFFFF",
    marginTop: 30,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
    color: "#F0F8F5",
    marginTop: 13,
  },
  actions: { width: "100%", maxWidth: 430, gap: 3, paddingTop: 28 },
  primary: {
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#7ADFC1",
  },
  primaryFill: {
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
  },
  primaryText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: "#FFFFFF",
  },
  secondary: {
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  secondaryText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#FFFFFF",
  },
  account: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#FFFFFF",
    textAlign: "center",
  },
  login: { fontFamily: "Inter_600SemiBold", textDecorationLine: "underline" },
});
