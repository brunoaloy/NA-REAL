import { useState } from "react";
import { View, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { db, configured } from "../services/supabase";
import { uploadPhoto } from "../services/photos";
import { Copy, PrimaryButton, ErrorState } from "./ui";
export function PhotoPicker({
  placeId,
  reviewId,
  profileId,
}: {
  placeId?: string;
  reviewId?: string;
  profileId?: string;
}) {
  const [error, setError] = useState<unknown>();
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  async function pick(camera: boolean) {
    setBusy(true);
    setNotice("");
    setError(undefined);
    try {
      if (await uploadPhoto({ placeId, reviewId, profileId }, camera)) {
        setNotice(
          "Foto enviada. Aguardando moderação; ainda não está pública.",
        );
        await qc.invalidateQueries({ queryKey: ["photos"] });
      }
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <View style={{ gap: 8 }}>
      <PrimaryButton
        title="Escolher foto"
        disabled={busy}
        onPress={() => void pick(false)}
      />
      <PrimaryButton
        title="Tirar foto"
        disabled={busy}
        onPress={() => void pick(true)}
      />
      {notice !== "" && <Copy>{notice}</Copy>}
      {error != null && <ErrorState error={error} />}
    </View>
  );
}
export function PhotoGallery({
  placeId,
  reviewId,
  profileId,
  compact = false,
}: {
  placeId?: string;
  reviewId?: string;
  profileId?: string;
  compact?: boolean;
}) {
  const q = useQuery({
    queryKey: ["photos", placeId, reviewId, profileId],
    enabled: configured,
    queryFn: async () => {
      let query = db()
        .from("photos")
        .select("id,object_path,owner_id,content_revision")
        .eq("moderation_state", "approved")
        .limit(compact ? 1 : 6);
      query = placeId
        ? query.eq("place_id", placeId)
        : reviewId
          ? query.eq("review_id", reviewId)
          : query.eq("profile_id", profileId!);
      const r = await query;
      if (r.error) throw r.error;
      return Promise.all(
        r.data.map(async (p) => {
          const url = await db()
            .storage.from("reviewed-photos")
            .createSignedUrl(
              p.owner_id + "/" + p.content_revision + ".jpg",
              300,
            );
          if (url.error) throw url.error;
          return { id: p.id, url: url.data.signedUrl };
        }),
      );
    },
    staleTime: 240000,
  });
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {q.data?.length ? (
        q.data.map((p) => (
          <Image
            key={p.id}
            accessibilityLabel="Foto comunitária aprovada"
            source={{ uri: p.url }}
            style={{
              width: compact ? 72 : 280,
              height: compact ? 82 : 180,
              borderRadius: 14,
            }}
          />
        ))
      ) : (
        <View
          style={{
            width: compact ? 72 : "100%",
            height: compact ? 82 : 140,
            borderRadius: 14,
            backgroundColor: "#E2E8F0",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name="image-outline"
            size={compact ? 28 : 40}
            color="#64748B"
          />
          {!compact && (
            <Copy>
              {q.isPending
                ? "Carregando fotos…"
                : q.isError
                  ? "Fotos indisponíveis"
                  : "Sem fotos aprovadas"}
            </Copy>
          )}
        </View>
      )}
    </View>
  );
}
