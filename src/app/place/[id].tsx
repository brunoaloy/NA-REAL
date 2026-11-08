import { randomUUID } from "expo-crypto";
import { AuthorLabel, ReplyContext } from "../../components/message-context";
import { createURL } from "expo-linking";
import { PlaceSuggestions } from "../../components/place-suggestions";
import { useState, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  View,
  Pressable,
  Text,
  Share,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import {
  useQuery,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Screen,
  Copy,
  Card,
  Field,
  PrimaryButton,
  ErrorState,
  EmptyState,
} from "../../components/ui";
import { AppHeader, StatusChip } from "../../components/design";
import type { Session } from "@supabase/supabase-js";
import { Ionicons } from "@expo/vector-icons";
import {
  ActionRow,
  GentleNote,
  QuietButton,
  m,
} from "../../components/member-design";
import {
  directionsUrl,
  destinationLabel,
  validPlaceId,
} from "../../validation/place-detail";
import { PlaceActions, FavoriteButton } from "../../components/place-actions";
import { ContentActions } from "../../components/content-actions";
import { PhotoGallery, PhotoPicker } from "../../components/photos";
import { LiveReports } from "../../components/live-reports";
import { db, supabase, configured } from "../../services/supabase";
import { sendMessage, saveReview } from "../../services/catalog";
import { useSession } from "../../hooks/use-session";
export default function Detail() {
  const { id, tab } = useLocalSearchParams<{ id: string; tab?: string }>();
  if (!validPlaceId(id))
    return (
      <Screen>
        <AppHeader title="Conheça o lugar" back />
        <EmptyState text="Este link não parece ser de um lugar válido. Volte à exploração para encontrar seu próximo destino." />
        <PrimaryButton
          title="Explorar lugares"
          onPress={() => router.replace("/(tabs)")}
        />
      </Screen>
    );
  return (
    <DetailSession key={id + ":" + (tab ?? "")} id={id} initialTab={tab} />
  );
}
function DetailSession({
  id,
  initialTab,
}: {
  id: string;
  initialTab?: string;
}) {
  const session = useSession();
  const [tab, setTab] = useState(
    initialTab &&
      ["Geral", "Avaliações", "Ao vivo", "Sala"].includes(initialTab)
      ? initialTab
      : "Geral",
  );
  return (
    <DetailContent
      key={session?.user.id ?? "guest"}
      id={id}
      session={session}
      tab={tab}
      setTab={setTab}
    />
  );
}
function DetailContent({
  id,
  session,
  tab,
  setTab,
}: {
  id: string;
  session: Session | null;
  tab: string;
  setTab: (tab: string) => void;
}) {
  const qc = useQueryClient();
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const draftRequest = useRef<{ fingerprint: string; key: string } | null>(
    null,
  );
  const [reviewText, setReviewText] = useState("");
  const [messageText, setMessageText] = useState("");
  const text = tab === "Sala" ? messageText : reviewText;
  const setText = tab === "Sala" ? setMessageText : setReviewText;
  const [correction, setCorrection] = useState(false),
    [more, setMore] = useState(false);
  const locked = useRef(false);
  const [rating, setRating] = useState(0);
  const [error, setError] = useState<unknown>();
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [reviewId, setReviewId] = useState("");
  const place = useQuery({
    queryKey: ["place", id],
    enabled: configured,
    queryFn: async () => {
      const r = await db()
        .from("places")
        .select(
          "id,name,address,category,city,state,description,verification_status,moderation_state,created_by,content_revision",
        )
        .eq("id", id)
        .single();
      if (r.error) throw r.error;
      return r.data;
    },
  });
  const publicPlace =
    place.data?.moderation_state === "approved" &&
    place.data?.verification_status === "approved";
  const aggregate = useQuery({
    queryKey: ["rating", id],
    enabled: configured && publicPlace,
    queryFn: async () => {
      const r = await db()
        .from("place_ratings")
        .select("rating,review_count")
        .eq("place_id", id)
        .maybeSingle();
      if (r.error) throw r.error;
      return r.data;
    },
  });
  const messages = useInfiniteQuery({
    queryKey: ["messages", id],
    enabled: configured && publicPlace && tab === "Sala",
    initialPageParam: null as { time: string; id: string } | null,
    queryFn: async ({ pageParam }) => {
      let query = db()
        .from("place_messages")
        .select("id,author_id,body,created_at,moderation_state,reply_to")
        .eq("place_id", id)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(30);
      if (pageParam)
        query = query.or(
          `created_at.lt.${pageParam.time},and(created_at.eq.${pageParam.time},id.lt.${pageParam.id})`,
        );
      const r = await query;
      if (r.error) throw r.error;
      return r.data;
    },
    getNextPageParam: (last) =>
      last.length === 30
        ? {
            time: last[last.length - 1].created_at as string,
            id: last[last.length - 1].id as string,
          }
        : undefined,
  });
  const reviews = useInfiniteQuery({
    queryKey: ["reviews", id, session?.user.id ?? "guest"],
    enabled: configured && publicPlace && tab === "Avaliações",
    initialPageParam: null as { time: string; id: string } | null,
    queryFn: async ({ pageParam }) => {
      let query = db()
        .from("reviews")
        .select("id,rating,body,author_id,moderation_state,created_at")
        .eq("place_id", id)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(30);
      if (pageParam)
        query = query.or(
          `created_at.lt.${pageParam.time},and(created_at.eq.${pageParam.time},id.lt.${pageParam.id})`,
        );
      const r = await query;
      if (r.error) throw r.error;
      return r.data;
    },
    getNextPageParam: (last) =>
      last.length === 30
        ? {
            time: last[last.length - 1].created_at as string,
            id: last[last.length - 1].id as string,
          }
        : undefined,
  });
  const mine = useQuery({
    queryKey: ["reviews", id, session?.user.id, "mine"],
    enabled: !!session && publicPlace && tab === "Avaliações",
    queryFn: async () => {
      const r = await db()
        .from("reviews")
        .select("id,rating,body")
        .eq("place_id", id)
        .eq("author_id", session!.user.id)
        .maybeSingle();
      if (r.error) throw r.error;
      return r.data;
    },
  });
  useEffect(() => {
    if (!supabase) return;
    const ch = supabase
      .channel("community:" + id)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "place_messages",
          filter: "place_id=eq." + id,
        },
        () => void qc.invalidateQueries({ queryKey: ["messages", id] }),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reviews",
          filter: "place_id=eq." + id,
        },
        () => {
          void qc.invalidateQueries({ queryKey: ["reviews", id] });
          void qc.invalidateQueries({ queryKey: ["rating", id] });
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          void qc.invalidateQueries({ queryKey: ["messages", id] });
          void qc.invalidateQueries({ queryKey: ["reviews", id] });
        }
      });
    return () => {
      void supabase?.removeChannel(ch);
    };
  }, [id, qc]);
  async function submit() {
    if (locked.current || !session) return;
    locked.current = true;
    setBusy(true);
    setError(undefined);
    setNotice("");
    try {
      if (tab === "Sala") {
        const fingerprint = JSON.stringify([id, text.trim(), replyTo]);
        if (draftRequest.current?.fingerprint !== fingerprint)
          draftRequest.current = { fingerprint, key: randomUUID() };
        await sendMessage(id, text, draftRequest.current.key, replyTo);
        draftRequest.current = null;
        setReplyTo(null);
      } else setReviewId(await saveReview(id, { rating, body: text }));
      setText("");
      setNotice(
        "Contribuição recebida para análise. Só será pública após aprovação.",
      );
      await qc.invalidateQueries({
        queryKey: [tab === "Sala" ? "messages" : "reviews", id],
      });
    } catch (e) {
      setError(e);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  const ownReview = mine.data;
  async function refresh() {
    await Promise.all([
      place.refetch(),
      aggregate.refetch(),
      qc.invalidateQueries({ queryKey: ["photos"] }),
      ...(tab === "Avaliações"
        ? [reviews.refetch(), ...(session ? [mine.refetch()] : [])]
        : tab === "Sala"
          ? [messages.refetch()]
          : []),
    ]);
  }
  async function share() {
    try {
      await Share.share({
        message:
          (place.data?.name ?? "NA REAL") + " — " + createURL("place/" + id),
      });
    } catch (e) {
      setError(e);
    }
  }
  async function directions() {
    if (!place.data) return;
    setError(undefined);
    try {
      await Linking.openURL(directionsUrl(Platform.OS, place.data));
    } catch {
      setError(
        new Error(
          "Não foi possível abrir o mapa. Confira sua conexão e tente novamente.",
        ),
      );
    }
  }
  function switchTab(value: string) {
    if (busy) return;
    setTab(value);
    setError(undefined);
    setNotice("");
  }
  function confirmDelete(type: "reviews" | "place_messages", itemId: string) {
    const execute = async () => {
      if (!session || locked.current) return;
      locked.current = true;
      setBusy(true);
      setError(undefined);
      try {
        const r = await db()
          .from(type)
          .delete()
          .eq("id", itemId)
          .eq("author_id", session.user.id);
        if (r.error) throw r.error;
        if (type === "reviews") {
          setReviewId("");
          setReviewText("");
          setRating(0);
        }
        await qc.invalidateQueries({
          queryKey: [type === "reviews" ? "reviews" : "messages", id],
        });
        await qc.invalidateQueries({ queryKey: ["rating", id] });
        await qc.invalidateQueries({
          queryKey: ["my-profile", session.user.id],
        });
        setNotice("Sua contribuição foi removida.");
      } catch (e) {
        setError(e);
      } finally {
        locked.current = false;
        setBusy(false);
      }
    };
    if (Platform.OS === "web") {
      if (
        window.confirm(
          "Remover sua contribuição? Esta ação não pode ser desfeita.",
        )
      )
        void execute();
    } else
      Alert.alert("Remover contribuição?", "Esta ação não pode ser desfeita.", [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: () => void execute(),
        },
      ]);
  }
  const unavailable =
    (place.error as { code?: string } | null)?.code === "PGRST116";
  const pending =
    place.data &&
    (place.data.moderation_state !== "approved" ||
      place.data.verification_status !== "approved");
  const loginPrompt = (message: string) => (
    <Card>
      <Text style={m.section}>Seu olhar faz a diferença.</Text>
      <Copy>{message}</Copy>
      <PrimaryButton
        title="Entrar para participar"
        onPress={() => router.push("/auth")}
      />
    </Card>
  );
  return (
    <Screen
      onRefresh={configured ? () => void refresh() : undefined}
      refreshing={place.isRefetching}
    >
      <AppHeader title="Conheça o lugar" back />
      {!configured ? (
        <EmptyState text="Não foi possível conectar ao serviço de lugares. Reinicie o aplicativo e tente novamente." />
      ) : place.isError ? (
        <>
          {unavailable ? (
            <EmptyState text="Este lugar não está disponível agora. Ele pode estar em análise ou ter sido removido." />
          ) : (
            <ErrorState error={place.error} />
          )}
          <QuietButton
            title="Tentar novamente"
            onPress={() => void place.refetch()}
          />
          <QuietButton
            title="Explorar outros lugares"
            onPress={() => router.replace("/(tabs)")}
          />
        </>
      ) : place.isPending ? (
        <View style={{ alignItems: "center", gap: 14, padding: 35 }}>
          <ActivityIndicator color="#0F766E" />
          <Copy>Preparando sua próxima descoberta…</Copy>
        </View>
      ) : (
        <>
          <PhotoGallery placeId={id} hero />
          <View style={{ gap: 10 }}>
            <Text style={m.eyebrow}>
              {place.data.category.toUpperCase()} · {place.data.city},{" "}
              {place.data.state}
            </Text>
            <Text
              accessibilityRole="header"
              style={[m.heading, { fontSize: 28, lineHeight: 35 }]}
            >
              {place.data.name}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ver avaliações do lugar"
              onPress={() => switchTab("Avaliações")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 7,
                paddingVertical: 5,
              }}
            >
              <Ionicons name="star" size={19} color="#D3A249" />
              {pending ? (
                <Text style={m.small}>
                  Avaliações após a aprovação do lugar
                </Text>
              ) : aggregate.isPending ? (
                <Text style={m.small}>Carregando avaliações…</Text>
              ) : aggregate.isError ? (
                <Text style={m.small}>
                  Avaliações indisponíveis no momento.
                </Text>
              ) : (
                <Text style={m.label}>
                  {aggregate.data?.rating != null
                    ? `${Number(aggregate.data.rating).toFixed(1)} · ${Number(aggregate.data.review_count)} avaliações`
                    : "Seja a primeira pessoa a avaliar"}
                </Text>
              )}
              <Ionicons name="chevron-forward" size={15} color="#64748B" />
            </Pressable>
            {aggregate.isError && (
              <QuietButton
                title="Atualizar avaliações"
                onPress={() => void aggregate.refetch()}
              />
            )}
          </View>
          {pending && (
            <GentleNote>
              Recebemos este lugar para revisão. Ele ainda não aparece nas
              buscas da comunidade.
            </GentleNote>
          )}
          <Card>
            <View
              style={{
                flexDirection: "row",
                gap: 11,
                alignItems: "flex-start",
              }}
            >
              <Ionicons name="location-outline" size={23} color="#0F766E" />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={m.label}>Onde encontrar</Text>
                <Text style={m.body}>{destinationLabel(place.data)}</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
              <View style={{ flex: 1 }}>
                <PrimaryButton
                  title="Como chegar"
                  onPress={() => void directions()}
                />
              </View>
              <FavoriteButton id={id} session={session} />
            </View>
          </Card>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
            {["Geral", "Avaliações", "Ao vivo", "Sala"].map((value) => (
              <Pressable
                key={value}
                accessibilityRole="tab"
                accessibilityLabel={value}
                accessibilityState={{ selected: tab === value, disabled: busy }}
                aria-selected={tab === value}
                disabled={busy}
                onPress={() => switchTab(value)}
                style={{
                  paddingHorizontal: 13,
                  paddingVertical: 12,
                  borderRadius: 20,
                  backgroundColor: tab === value ? "#DDF1E5" : "#F2F6F3",
                }}
              >
                <Text
                  style={{
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 12,
                    color: "#0F766E",
                  }}
                >
                  {value}
                </Text>
              </Pressable>
            ))}
          </View>
          {notice !== "" && <GentleNote>{notice}</GentleNote>}
          {error != null && <ErrorState error={error} />}
          {tab === "Geral" && (
            <>
              <Card>
                <Text style={m.section}>Um pouco sobre este lugar</Text>
                <Text style={m.body}>
                  {place.data.description ||
                    "Cada visita pode render uma boa história. Descubra o lugar e compartilhe a sua com a comunidade."}
                </Text>
                <QuietButton
                  title="Compartilhar lugar"
                  onPress={() => void share()}
                />
                <QuietButton
                  title="Escrever avaliação"
                  onPress={() => switchTab("Avaliações")}
                />
              </Card>
              {session ? (
                <Card>
                  <Text style={m.section}>Mostre o lugar pelo seu olhar</Text>
                  <Text style={m.small}>
                    Sua foto pode ajudar quem ainda não conhece. Confira a
                    prévia antes de enviar.
                  </Text>
                  <PhotoPicker placeId={id} />
                </Card>
              ) : (
                loginPrompt(
                  "Entre para compartilhar uma foto ou contar como foi sua visita.",
                )
              )}
              {place.data.moderation_state === "approved" && (
                <>
                  <ActionRow
                    title="Sugerir uma correção"
                    detail="Ajude a manter as informações em dia"
                    icon="create-outline"
                    expanded={correction}
                    onPress={() => setCorrection(!correction)}
                  />
                  {correction &&
                    (session ? (
                      <PlaceSuggestions
                        id={id}
                        revision={place.data.content_revision}
                      />
                    ) : (
                      loginPrompt(
                        "Entre para sugerir uma correção nas informações deste lugar.",
                      )
                    ))}
                </>
              )}
              <ActionRow
                title="Mais opções do lugar"
                detail="Acompanhamento e cuidado com a comunidade"
                icon="ellipsis-horizontal"
                expanded={more}
                onPress={() => setMore(!more)}
              />
              {more &&
                (session ? (
                  <Card>
                    <PlaceActions id={id} session={session} />
                    <ContentActions
                      type="places"
                      id={id}
                      author={
                        place.data.created_by === session.user.id
                          ? undefined
                          : (place.data.created_by ?? undefined)
                      }
                    />
                  </Card>
                ) : (
                  loginPrompt(
                    "Entre para acompanhar o lugar ou enviar uma informação para revisão.",
                  )
                ))}
            </>
          )}
          {tab === "Ao vivo" &&
            (pending ? (
              <GentleNote>
                As perguntas e atualizações ao vivo ficam disponíveis após a
                aprovação do lugar.
              </GentleNote>
            ) : (
              <>
                <Card>
                  <Text style={m.section}>Como está agora?</Text>
                  <Text style={m.body}>
                    Pergunte a quem conhece o lugar. As atualizações têm horário
                    e validade para ajudar na sua decisão.
                  </Text>
                  <PrimaryButton
                    title="Perguntar agora"
                    onPress={() =>
                      router.push({ pathname: "/question", params: { id } })
                    }
                  />
                </Card>
                <LiveReports placeId={id} />
              </>
            ))}
          {tab === "Avaliações" &&
            (pending ? (
              <GentleNote>
                As avaliações ficam disponíveis depois que este lugar for
                aprovado. Por enquanto, você pode conferir o endereço e enviar
                fotos para revisão.
              </GentleNote>
            ) : (
              <>
                {session ? (
                  <Card>
                    <Text style={m.section}>
                      {ownReview
                        ? "Sua experiência por aqui"
                        : "Como foi sua visita?"}
                    </Text>
                    <Text style={m.small}>
                      Sua opinião ajuda a próxima pessoa a escolher com mais
                      confiança.
                    </Text>
                    {mine.isError && (
                      <>
                        <ErrorState error={mine.error} />
                        <QuietButton
                          title="Tentar carregar minha avaliação"
                          onPress={() => void mine.refetch()}
                        />
                      </>
                    )}
                    {ownReview && (
                      <QuietButton
                        title="Editar minha avaliação"
                        onPress={() => {
                          setReviewText(ownReview.body);
                          setRating(ownReview.rating);
                          setReviewId(ownReview.id);
                        }}
                      />
                    )}
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        gap: 4,
                      }}
                    >
                      {[1, 2, 3, 4, 5].map((value) => (
                        <Pressable
                          key={value}
                          accessibilityRole="button"
                          accessibilityLabel={`${value} ${value === 1 ? "estrela" : "estrelas"}`}
                          accessibilityState={{ selected: rating === value }}
                          aria-pressed={rating === value}
                          disabled={busy}
                          onPress={() => setRating(value)}
                          style={{
                            padding: 7,
                            minWidth: 40,
                            minHeight: 44,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Ionicons
                            name={value <= rating ? "star" : "star-outline"}
                            size={29}
                            color={value <= rating ? "#D3A249" : "#9EB3A6"}
                          />
                        </Pressable>
                      ))}
                    </View>
                    <Field
                      label="Conte sua experiência"
                      placeholder="O que você gostaria que outras pessoas soubessem?"
                      value={reviewText}
                      onChangeText={setReviewText}
                      multiline
                      style={{ minHeight: 100, textAlignVertical: "top" }}
                      maxLength={500}
                      editable={!busy}
                    />
                    <Text style={[m.small, { textAlign: "right" }]}>
                      {reviewText.length}/500
                    </Text>
                    <PrimaryButton
                      title={
                        busy
                          ? "Enviando sua experiência…"
                          : "Enviar avaliação para revisão"
                      }
                      disabled={
                        busy ||
                        reviewText.trim().length < 3 ||
                        rating < 1 ||
                        mine.isPending ||
                        mine.isError
                      }
                      onPress={() => void submit()}
                    />
                    <Text style={m.small}>
                      Escolha de 1 a 5 estrelas. A avaliação aparece para outras
                      pessoas após revisão.
                    </Text>
                    {reviewId && <PhotoPicker reviewId={reviewId} />}
                  </Card>
                ) : (
                  loginPrompt(
                    "Entre para avaliar o lugar e compartilhar sua experiência.",
                  )
                )}
                <Text accessibilityRole="header" style={m.section}>
                  O que a comunidade conta
                </Text>
                {reviews.isPending && <Copy>Carregando avaliações…</Copy>}
                {reviews.isError && (
                  <>
                    <ErrorState error={reviews.error} />
                    <QuietButton
                      title="Tentar carregar avaliações"
                      onPress={() => void reviews.refetch()}
                    />
                  </>
                )}
                {reviews.data?.pages.flat().length === 0 && (
                  <EmptyState text="Ainda não há avaliações aprovadas. Sua experiência pode ser a primeira." />
                )}
                {reviews.data?.pages.flat().map((review) => (
                  <Card key={review.id}>
                    <AuthorLabel id={review.author_id} />
                    <Text
                      style={{
                        fontFamily: "Inter_600SemiBold",
                        color: "#A87823",
                        fontSize: 16,
                      }}
                    >
                      {"★".repeat(review.rating)}
                      <Text style={m.small}>
                        {" "}
                        ·{" "}
                        {new Date(review.created_at).toLocaleDateString(
                          "pt-BR",
                        )}
                      </Text>
                    </Text>
                    <Copy>{review.body}</Copy>
                    {review.moderation_state !== "approved" && (
                      <StatusChip state={review.moderation_state} />
                    )}
                    <PhotoGallery reviewId={review.id} hideWhenEmpty />
                    {session && (
                      <ContentActions
                        type="reviews"
                        id={review.id}
                        author={
                          review.author_id === session.user.id
                            ? undefined
                            : review.author_id
                        }
                      />
                    )}
                    {review.author_id === session?.user.id && (
                      <QuietButton
                        title="Excluir minha avaliação"
                        disabled={busy}
                        onPress={() => confirmDelete("reviews", review.id)}
                      />
                    )}
                  </Card>
                ))}
                {reviews.hasNextPage && (
                  <QuietButton
                    title={
                      reviews.isFetchingNextPage
                        ? "Carregando…"
                        : "Avaliações anteriores"
                    }
                    disabled={reviews.isFetchingNextPage}
                    onPress={() => void reviews.fetchNextPage()}
                  />
                )}
              </>
            ))}
          {tab === "Sala" &&
            (pending ? (
              <GentleNote>
                A sala da comunidade abre depois que este lugar for aprovado.
              </GentleNote>
            ) : (
              <>
                <GentleNote>
                  Uma boa conversa também ajuda a conhecer o lugar. Mensagens
                  passam por revisão antes de ficar públicas.
                </GentleNote>
                {messages.isPending && <Copy>Carregando conversas…</Copy>}
                {messages.isError && (
                  <>
                    <ErrorState error={messages.error} />
                    <QuietButton
                      title="Tentar carregar conversas"
                      onPress={() => void messages.refetch()}
                    />
                  </>
                )}
                {messages.data?.pages.flat().length === 0 && (
                  <EmptyState text="A conversa ainda está começando. Compartilhe uma dica ou uma boa pergunta." />
                )}
                {messages.data?.pages.flat().map((message) => (
                  <Card key={message.id}>
                    <AuthorLabel id={message.author_id} />
                    {message.reply_to && (
                      <ReplyContext id={message.reply_to} placeId={id} />
                    )}
                    <Copy>{message.body}</Copy>
                    {message.moderation_state !== "approved" && (
                      <StatusChip state={message.moderation_state} />
                    )}
                    <Text style={m.small}>
                      {new Date(message.created_at).toLocaleString("pt-BR")}
                    </Text>
                    {message.moderation_state === "approved" && session && (
                      <QuietButton
                        title="Responder mensagem"
                        onPress={() => {
                          setReplyTo(message.id);
                          setError(undefined);
                        }}
                      />
                    )}
                    {session && (
                      <ContentActions
                        type="place_messages"
                        id={message.id}
                        author={
                          message.author_id === session.user.id
                            ? undefined
                            : message.author_id
                        }
                      />
                    )}
                    {message.author_id === session?.user.id && (
                      <QuietButton
                        title="Excluir minha mensagem"
                        disabled={busy}
                        onPress={() =>
                          confirmDelete("place_messages", message.id)
                        }
                      />
                    )}
                  </Card>
                ))}
                {messages.hasNextPage && (
                  <QuietButton
                    title={
                      messages.isFetchingNextPage
                        ? "Carregando…"
                        : "Conversas anteriores"
                    }
                    disabled={messages.isFetchingNextPage}
                    onPress={() => void messages.fetchNextPage()}
                  />
                )}
                {session ? (
                  <Card>
                    <Text style={m.section}>Deixe sua dica</Text>
                    {replyTo && (
                      <>
                        <ReplyContext id={replyTo} placeId={id} />
                        <QuietButton
                          title="Cancelar resposta"
                          onPress={() => setReplyTo(null)}
                        />
                      </>
                    )}
                    <Field
                      label="Mensagem pública"
                      value={messageText}
                      onChangeText={setMessageText}
                      multiline
                      style={{ minHeight: 90, textAlignVertical: "top" }}
                      maxLength={1000}
                      editable={!busy}
                    />
                    <PrimaryButton
                      title={
                        busy
                          ? "Enviando mensagem…"
                          : error
                            ? "Tentar enviar novamente"
                            : "Enviar mensagem para análise"
                      }
                      disabled={busy || !messageText.trim()}
                      onPress={() => void submit()}
                    />
                  </Card>
                ) : (
                  loginPrompt(
                    "Entre para conversar com a comunidade deste lugar.",
                  )
                )}
              </>
            ))}
        </>
      )}
    </Screen>
  );
}
