import { RuntimeConnections } from "../components/connectivity";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Text } from "react-native";
import { StatusBar } from "expo-status-bar";
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});
export default function Layout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  if (!loaded && !error) return <Text>Carregando NA REAL…</Text>;
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <QueryClientProvider client={queryClient}>
        <RuntimeConnections />
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
