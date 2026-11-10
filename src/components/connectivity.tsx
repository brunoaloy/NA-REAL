import { localDiagnostics } from "../validation/diagnostics";
import { connectionTransitions } from "../validation/connection-transitions";
import { useEffect } from "react";
import NetInfo, { useNetInfo } from "@react-native-community/netinfo";
import {
  focusManager,
  onlineManager,
  useQueryClient,
} from "@tanstack/react-query";
import { AppState, Text } from "react-native";
import { supabase } from "../services/supabase";
export function RuntimeConnections() {
  const qc = useQueryClient();
  useEffect(() => {
    const transitions = connectionTransitions();
    const off = NetInfo.addEventListener((s) => {
      const online = s.isConnected !== false && s.isInternetReachable !== false;
      onlineManager.setOnline(online);
      if (transitions.network(online))
        void qc.invalidateQueries({}, { cancelRefetch: false });
    });
    const updateAppState = (state: string) => {
      focusManager.setFocused(state === "active");
      const returned = transitions.app(state === "active");
      if (state === "active") {
        supabase?.auth.startAutoRefresh();
        if (returned) void qc.invalidateQueries({}, { cancelRefetch: false });
      } else supabase?.auth.stopAutoRefresh();
    };
    if (AppState.currentState) updateAppState(AppState.currentState);
    const active = AppState.addEventListener("change", updateAppState);
    let lastId: string | undefined;
    const auth = supabase?.auth.onAuthStateChange((event, session) => {
      const next = session?.user.id;
      if (event === "SIGNED_OUT" || (lastId && lastId !== next)) {
        void qc.cancelQueries();
        qc.clear();
        localDiagnostics.clear();
      }
      lastId = next;
    });
    return () => {
      off();
      active.remove();
      auth?.data.subscription.unsubscribe();
    };
  }, [qc]);
  return null;
}
export function OfflineBanner() {
  const info = useNetInfo();
  return info.isConnected === false || info.isInternetReachable === false ? (
    <Text
      accessibilityRole="alert"
      style={{
        padding: 12,
        backgroundColor: "#FEF3C7",
        color: "#78350F",
        fontFamily: "Inter_400Regular",
      }}
    >
      Sem internet. Conteúdo já carregado pode estar desatualizado. Envios não
      serão confirmados enquanto não forem persistidos.
    </Text>
  ) : null;
}
