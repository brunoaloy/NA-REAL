import { router } from "expo-router";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { PrimaryButton } from "../components/ui";
export default function Welcome() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0F766E" }}>
      <View
        style={{
          flex: 1,
          padding: 28,
          justifyContent: "center",
          alignItems: "center",
          gap: 20,
        }}
      >
        <Ionicons name="location" size={86} color="#FFFFFF" />
        <Text
          accessibilityRole="header"
          style={{
            fontFamily: "Inter_700Bold",
            fontSize: 46,
            color: "#FFFFFF",
          }}
        >
          na real.
        </Text>
        <Text
          style={{
            fontFamily: "Inter_600SemiBold",
            fontSize: 18,
            color: "#FFFFFF",
          }}
        >
          Descubra. Avalie. Compartilhe.
        </Text>
        <Text
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 17,
            lineHeight: 26,
            color: "#FFFFFF",
            textAlign: "center",
          }}
        >
          Descubra lugares reais, com a opinião de quem já viveu a experiência.
        </Text>
      </View>
      <View
        style={{
          padding: 24,
          gap: 12,
          backgroundColor: "#FFFFFF",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
        }}
      >
        <PrimaryButton
          title="Começar como visitante"
          onPress={() => router.replace("/(tabs)")}
        />
        <PrimaryButton
          title="Entrar ou criar conta"
          onPress={() => router.push("/auth")}
        />
      </View>
    </SafeAreaView>
  );
}
