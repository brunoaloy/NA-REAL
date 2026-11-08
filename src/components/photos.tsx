import { useRef, useState, type ComponentRef } from "react";
import {
  View,
  Image,
  Text,
  Pressable,
  ScrollView,
  Modal,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { db, configured } from "../services/supabase";
import {
  preparePhoto,
  uploadPreparedPhoto,
  type PreparedPhoto,
} from "../services/photos";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { QuietButton, m } from "./member-design";
import { Copy, PrimaryButton, ErrorState } from "./ui";
type PhotoPickerProps = {
  placeId?: string;
  reviewId?: string;
  profileId?: string;
};
export function PhotoPicker(props: PhotoPickerProps) {
  return (
    <PhotoPickerForm
      key={JSON.stringify([props.placeId, props.reviewId, props.profileId])}
      {...props}
    />
  );
}
function PhotoPickerForm({
  placeId,
  reviewId,
  profileId,
}: {
  placeId?: string;
  reviewId?: string;
  profileId?: string;
}) {
  const [selected, setSelected] = useState<PreparedPhoto | null>(null);
  const [error, setError] = useState<unknown>();
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  async function pick(camera: boolean) {
    setBusy(true);
    setNotice("");
    setError(undefined);
    try {
      const prepared = await preparePhoto(camera);
      if (prepared) setSelected(prepared);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  async function confirm() {
    if (!selected || busy) return;
    setBusy(true);
    setError(undefined);
    setNotice("");
    try {
      await uploadPreparedPhoto({ placeId, reviewId, profileId }, selected);
      setSelected(null);
      setNotice("Foto enviada. Aguardando moderação; ainda não está pública.");
      await qc.invalidateQueries({ queryKey: ["photos"] });
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <View style={{ gap: 8 }}>
      <QuietButton
        title="Escolher foto"
        disabled={busy}
        onPress={() => void pick(false)}
      />
      <QuietButton
        title="Tirar foto"
        disabled={busy}
        onPress={() => void pick(true)}
      />
      {selected && (
        <>
          <Image
            source={{ uri: selected.uri }}
            accessibilityLabel="Prévia da foto selecionada"
            style={{ width: "100%", height: 180, borderRadius: 14 }}
          />
          <Copy>
            Confira a imagem antes de enviar. Ela ficará pendente de revisão.
          </Copy>
          <PrimaryButton
            title="Enviar foto para revisão"
            disabled={busy}
            onPress={() => void confirm()}
          />
          <QuietButton
            title="Descartar seleção"
            disabled={busy}
            onPress={() => setSelected(null)}
          />
        </>
      )}
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
  hero = false,
  hideWhenEmpty = false,
}: {
  placeId?: string;
  reviewId?: string;
  profileId?: string;
  compact?: boolean;
  hero?: boolean;
  hideWhenEmpty?: boolean;
}) {
  const [page, setPage] = useState(0),
    [open, setOpen] = useState(false);
  const carousel = useRef<ComponentRef<typeof ScrollView>>(null);
  const [imageFailures, setImageFailures] = useState<string[]>([]);
  const failed = (id: string) =>
    setImageFailures((current) =>
      current.includes(id) ? current : [...current, id],
    );
  const loaded = (id: string) =>
    setImageFailures((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : current,
    );
  const viewport = useWindowDimensions();
  const width = Math.max(180, Math.min(viewport.width, 600) - 44);
  const q = useQuery({
    queryKey: ["photos", placeId, reviewId, profileId, compact ? 1 : 6],
    enabled: configured,
    queryFn: async () => {
      let query = db()
        .from("photos")
        .select("id,object_path,owner_id,content_revision")
        .eq("moderation_state", "approved")
        .order("created_at", { ascending: false })
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
  const photos = q.data ?? [],
    index = Math.min(page, Math.max(0, photos.length - 1));
  function closePhoto() {
    carousel.current?.scrollTo({ x: index * width, animated: false });
    setOpen(false);
  }
  function retryPhotos() {
    setImageFailures([]);
    void q.refetch();
  }
  if (hideWhenEmpty && !photos.length)
    return q.isError ? (
      <Text style={m.small}>As fotos desta avaliação não carregaram.</Text>
    ) : null;
  return (
    <View style={{ gap: 10 }}>
      {photos.length ? (
        hero ? (
          <>
            <ScrollView
              ref={carousel}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={{ width, height: 220, borderRadius: 23 }}
              onMomentumScrollEnd={(event) =>
                setPage(Math.round(event.nativeEvent.contentOffset.x / width))
              }
            >
              {photos.map((p, i) => (
                <Pressable
                  key={p.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Ampliar foto ${i + 1}`}
                  onPress={() => {
                    setPage(i);
                    setOpen(true);
                  }}
                >
                  <Image
                    accessibilityLabel="Foto comunitária aprovada"
                    source={{ uri: p.url }}
                    onError={() => failed(p.id)}
                    onLoad={() => loaded(p.id)}
                    style={{ width, height: 220, borderRadius: 23 }}
                    resizeMode="cover"
                  />
                </Pressable>
              ))}
            </ScrollView>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <Text style={m.small}>Fotos recentes da comunidade</Text>
              <Text accessibilityLiveRegion="polite" style={m.small}>
                {index + 1}/{photos.length}
              </Text>
            </View>
          </>
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {photos.map((p) => (
              <Image
                key={p.id}
                accessibilityLabel="Foto comunitária aprovada"
                source={{ uri: p.url }}
                onError={() => failed(p.id)}
                onLoad={() => loaded(p.id)}
                style={{
                  width: compact ? 72 : Math.min(280, width - 36),
                  height: compact ? 82 : 180,
                  borderRadius: 14,
                }}
              />
            ))}
          </View>
        )
      ) : (
        <View
          style={{
            width: compact ? 72 : "100%",
            height: compact ? 82 : hero ? 190 : 140,
            borderRadius: hero ? 23 : 14,
            backgroundColor: "#EDF5F0",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            padding: compact ? 0 : 20,
          }}
        >
          <Ionicons
            name={hero ? "leaf-outline" : "image-outline"}
            size={compact ? 28 : 42}
            color="#759B86"
          />
          {!compact && (
            <Text style={[m.small, { textAlign: "center" }]}>
              {q.isPending
                ? "Carregando fotos…"
                : q.isError
                  ? "Não foi possível carregar as fotos."
                  : hero
                    ? "Um lugar, muitas histórias. Compartilhe seu olhar."
                    : "Sem fotos aprovadas"}
            </Text>
          )}
        </View>
      )}
      {(q.isError || imageFailures.length > 0) && !compact && (
        <QuietButton title="Tentar carregar fotos" onPress={retryPhotos} />
      )}
      {hero && (
        <Modal visible={open} animationType="fade" onRequestClose={closePhoto}>
          {open && (
            <SafeAreaView style={{ flex: 1, backgroundColor: "#0E1F1B" }}>
              <StatusBar style="light" />
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 16,
                }}
              >
                <Text
                  style={{ fontFamily: "Inter_400Regular", color: "#FFFFFF" }}
                >
                  Foto {index + 1} de {photos.length}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Fechar foto"
                  onPress={closePhoto}
                  style={{
                    width: 44,
                    height: 44,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="close" size={28} color="#FFFFFF" />
                </Pressable>
              </View>
              <View style={{ flex: 1 }}>
                {photos[index] && (
                  <Image
                    accessibilityLabel="Foto ampliada da comunidade"
                    source={{ uri: photos[index].url }}
                    onError={() => failed(photos[index].id)}
                    onLoad={() => loaded(photos[index].id)}
                    resizeMode="contain"
                    style={{ width: "100%", height: "100%" }}
                  />
                )}
              </View>
              <View
                style={{
                  flexDirection: "row",
                  gap: 16,
                  padding: 20,
                  justifyContent: "center",
                }}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Foto anterior"
                  disabled={index === 0}
                  onPress={() => setPage(index - 1)}
                  style={{ padding: 16, opacity: index === 0 ? 0.3 : 1 }}
                >
                  <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Próxima foto"
                  disabled={index === photos.length - 1}
                  onPress={() => setPage(index + 1)}
                  style={{
                    padding: 16,
                    opacity: index === photos.length - 1 ? 0.3 : 1,
                  }}
                >
                  <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
                </Pressable>
              </View>
            </SafeAreaView>
          )}
        </Modal>
      )}
    </View>
  );
}
