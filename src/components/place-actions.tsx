import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import type { Session } from "@supabase/supabase-js";
import {
  placePreference,
  setPlacePreference,
} from "../services/place-preferences";
import { ErrorState } from "./ui";
import { QuietButton, GentleNote, m } from "./member-design";
export function FavoriteButton({
  id,
  session,
}: {
  id: string;
  session: Session | null;
}) {
  const uid = session?.user.id,
    qc = useQueryClient();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>();
  const locked = useRef(false);
  const q = useQuery({
    queryKey: ["favorite", id, uid],
    enabled: Boolean(uid),
    queryFn: () => placePreference("favorites", uid!, id),
  });
  const loading = Boolean(uid) && q.isPending,
    saved = Boolean(q.data);
  async function toggle() {
    if (!uid) {
      router.push("/auth");
      return;
    }
    if (locked.current || loading || q.isError) return;
    locked.current = true;
    setBusy(true);
    setError(undefined);
    try {
      const next = await setPlacePreference("favorites", uid, id, !saved);
      qc.setQueryData(["favorite", id, uid], next);
      await qc.invalidateQueries({ queryKey: ["my-profile", uid] });
    } catch (e) {
      setError(e);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  return (
    <View style={{ gap: 7 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          saved ? "Remover dos favoritos" : "Salvar nos favoritos"
        }
        aria-pressed={saved}
        accessibilityState={{
          selected: saved,
          disabled: busy || loading || q.isError,
          busy: busy || loading,
        }}
        disabled={busy || loading || q.isError}
        onPress={() => void toggle()}
        style={({ pressed }) => ({
          minHeight: 50,
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderWidth: 1,
          borderColor: saved ? "#ACD4BE" : "#C8DBD1",
          backgroundColor: saved ? "#E8F5ED" : "#FFFFFF",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          opacity: pressed || busy ? 0.7 : 1,
        })}
      >
        {busy || loading ? (
          <ActivityIndicator size="small" color="#0F766E" />
        ) : (
          <Ionicons
            name={saved ? "heart" : "heart-outline"}
            size={21}
            color="#0F766E"
          />
        )}
        <Text
          style={{
            fontFamily: "Inter_600SemiBold",
            fontSize: 13,
            color: "#0F766E",
          }}
        >
          {saved ? "Salvo" : "Salvar"}
        </Text>
      </Pressable>
      {q.isError && (
        <QuietButton
          title="Tentar carregar favoritos"
          onPress={() => void q.refetch()}
        />
      )}{" "}
      {error != null && <ErrorState error={error} />}
    </View>
  );
}
export function PlaceActions({
  id,
  session,
}: {
  id: string;
  session: Session | null;
}) {
  const uid = session?.user.id,
    qc = useQueryClient();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(),
    [notice, setNotice] = useState("");
  const q = useQuery({
    queryKey: ["place-follow", id, uid],
    enabled: Boolean(uid),
    queryFn: () => placePreference("place_follows", uid!, id),
  });
  async function toggle() {
    if (!uid) {
      router.push("/auth");
      return;
    }
    if (busy || q.isPending || q.isError) return;
    setBusy(true);
    setError(undefined);
    setNotice("");
    try {
      const saved = await setPlacePreference("place_follows", uid, id, !q.data);
      qc.setQueryData(["place-follow", id, uid], saved);
      setNotice(
        saved
          ? "Sua preferência de acompanhamento foi salva. As novidades dos lugares ainda não geram notificações automáticas."
          : "Você deixou de acompanhar este lugar.",
      );
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <View style={{ gap: 12 }}>
      <Text style={m.small}>
        Escolha se deseja manter este lugar entre os seus acompanhados.
      </Text>
      <QuietButton
        title={q.data ? "Deixar de acompanhar" : "Acompanhar este lugar"}
        disabled={busy || (Boolean(uid) && q.isPending) || q.isError}
        onPress={() => void toggle()}
      />
      {q.isError && (
        <QuietButton
          title="Tentar carregar acompanhamento"
          onPress={() => void q.refetch()}
        />
      )}{" "}
      {notice !== "" && <GentleNote>{notice}</GentleNote>}
      {error != null && <ErrorState error={error} />}
    </View>
  );
}
