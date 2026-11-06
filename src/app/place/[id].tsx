import { useState, useEffect } from "react";
import { View, Pressable, Text } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import {
  useQuery,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Screen,
  Title,
  Copy,
  Card,
  Field,
  PrimaryButton,
  ErrorState,
  EmptyState,
} from "../../components/ui";
import { AppHeader, StatusChip, RatingStars } from "../../components/design";
import { PlaceActions } from "../../components/place-actions";
import { ContentActions } from "../../components/content-actions";
import { PhotoGallery, PhotoPicker } from "../../components/photos";
import { LiveReports } from "../../components/live-reports";
import { db, supabase } from "../../services/supabase";
import { sendMessage, saveReview } from "../../services/catalog";
import { useSession } from "../../hooks/use-session";
export default function Detail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();
  const session = useSession();
  const [tab, setTab] = useState("Geral");
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);
  const [error, setError] = useState<unknown>();
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [reviewId, setReviewId] = useState("");
  const place = useQuery({
    queryKey: ["place", id],
    queryFn: async () => {
      const r = await db()
        .from("places")
        .select(
          "id,name,address,category,city,state,description,verification_status,moderation_state,created_by",
        )
        .eq("id", id)
        .single();
      if (r.error) throw r.error;
      return r.data;
    },
  });
  const aggregate = useQuery({
    queryKey: ["rating", id],
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
    initialPageParam: null as { time: string; id: string } | null,
    queryFn: async ({ pageParam }) => {
      let query = db()
        .from("place_messages")
        .select("id,author_id,body,created_at,moderation_state")
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
  const reviews = useQuery({
    queryKey: ["reviews", id],
    queryFn: async () => {
      const r = await db()
        .from("reviews")
        .select("id,rating,body,author_id,moderation_state")
        .eq("place_id", id)
        .order("created_at", { ascending: false })
        .limit(50);
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
    setBusy(true);
    setError(undefined);
    setNotice("");
    try {
      if (tab === "Sala") await sendMessage(id, text);
      else setReviewId(await saveReview(id, { rating, body: text }));
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
      setBusy(false);
    }
  }
  const ownReview = reviews.data?.find((r) => r.author_id === session?.user.id);
  return (
    <Screen>
      <AppHeader title={place.data?.name ?? "Lugar"} back />
      {place.isError ? (
        <>
          <ErrorState error={place.error} />
          <PrimaryButton
            title="Tentar novamente"
            onPress={() => void place.refetch()}
          />
        </>
      ) : place.isPending ? (
        <Copy>Carregando lugar…</Copy>
      ) : (
        <>
          <PhotoGallery placeId={id} />
          <Title>{place.data.name}</Title>
          <Copy>
            {place.data.category} · {place.data.address} · {place.data.city},{" "}
            {place.data.state}
          </Copy>
          <StatusChip state={place.data.moderation_state} />
          <RatingStars
            rating={aggregate.data?.rating ?? null}
            count={Number(aggregate.data?.review_count ?? 0)}
          />
        </>
      )}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {["Geral", "Avaliações", "Ao vivo", "Sala"].map((t) => (
          <Pressable
            key={t}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t }}
            onPress={() => {
              setTab(t);
              setText("");
              setNotice("");
            }}
            style={{
              padding: 12,
              borderRadius: 20,
              backgroundColor: tab === t ? "#D1FAE5" : "#F1F5F9",
            }}
          >
            <Text style={{ color: "#0F766E", fontFamily: "Inter_600SemiBold" }}>
              {t}
            </Text>
          </Pressable>
        ))}
      </View>
      {tab === "Geral" && (
        <>
          <Copy>
            {place.data?.description ||
              "Informações do catálogo comunitário. Relatos refletem experiências pessoais."}
          </Copy>
          <PlaceActions id={id} />
          <PhotoPicker placeId={id} />
          <ContentActions
            type="places"
            id={id}
            author={place.data?.created_by ?? undefined}
          />
        </>
      )}
      {tab === "Ao vivo" && (
        <>
          <Card>
            <Title>Como está agora?</Title>
            <Copy>
              Pergunte à comunidade e receba atualizações com horário e
              validade.
            </Copy>
            <PrimaryButton
              title="Perguntar agora"
              onPress={() =>
                router.push({ pathname: "/question", params: { id } })
              }
            />
          </Card>
          <LiveReports placeId={id} />
        </>
      )}
      {tab === "Sala" && (
        <>
          {messages.isPending && <Copy>Carregando conversas…</Copy>}
          {messages.isError && <ErrorState error={messages.error} />}
          {messages.data?.pages.flat().length === 0 && (
            <EmptyState text="Nenhuma conversa aprovada ainda. Sua contribuição pode iniciar a comunidade." />
          )}
          {messages.data?.pages.flat().map((m) => (
            <Card key={m.id}>
              <StatusChip state={m.moderation_state} />
              <Copy>{m.body}</Copy>
              <Copy>{new Date(m.created_at).toLocaleString("pt-BR")}</Copy>
              <ContentActions
                type="place_messages"
                id={m.id}
                author={m.author_id}
              />
              {m.author_id === session?.user.id && (
                <PrimaryButton
                  title="Excluir minha mensagem"
                  onPress={async () => {
                    const r = await db()
                      .from("place_messages")
                      .delete()
                      .eq("id", m.id);
                    if (r.error) setError(r.error);
                    else
                      await qc.invalidateQueries({
                        queryKey: ["messages", id],
                      });
                  }}
                />
              )}
            </Card>
          ))}
          {messages.hasNextPage && (
            <PrimaryButton
              title="Conversas anteriores"
              disabled={messages.isFetchingNextPage}
              onPress={() => void messages.fetchNextPage()}
            />
          )}
        </>
      )}
      {tab === "Avaliações" && (
        <>
          {reviews.isPending && <Copy>Carregando avaliações…</Copy>}
          {reviews.isError && <ErrorState error={reviews.error} />}
          {reviews.data?.length === 0 && (
            <EmptyState text="Sem avaliações aprovadas." />
          )}
          {reviews.data?.map((r) => (
            <Card key={r.id}>
              <StatusChip state={r.moderation_state} />
              <Copy>
                {"★".repeat(r.rating)} · {r.body}
              </Copy>
              <PhotoGallery reviewId={r.id} />
              <ContentActions type="reviews" id={r.id} author={r.author_id} />
              {r.author_id === session?.user.id && (
                <PrimaryButton
                  title="Excluir minha avaliação"
                  onPress={async () => {
                    const result = await db()
                      .from("reviews")
                      .delete()
                      .eq("id", r.id);
                    if (result.error) setError(result.error);
                    else await qc.invalidateQueries();
                  }}
                />
              )}
            </Card>
          ))}
          {ownReview && (
            <PrimaryButton
              title="Editar minha avaliação"
              onPress={() => {
                setText(ownReview.body);
                setRating(ownReview.rating);
                setReviewId(ownReview.id);
              }}
            />
          )}
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            {[1, 2, 3, 4, 5].map((v) => (
              <Pressable
                key={v}
                accessibilityRole="button"
                accessibilityLabel={v + " estrelas"}
                accessibilityState={{ selected: rating === v }}
                onPress={() => setRating(v)}
                style={{ padding: 8 }}
              >
                <Text
                  style={{
                    fontSize: 32,
                    color: v <= rating ? "#F59E0B" : "#CBD5E1",
                  }}
                >
                  ★
                </Text>
              </Pressable>
            ))}
          </View>
          {reviewId && <PhotoPicker reviewId={reviewId} />}
        </>
      )}
      {["Sala", "Avaliações"].includes(tab) && (
        <>
          <Field
            label={
              tab === "Sala" ? "Mensagem pública" : "Conte sua experiência"
            }
            value={text}
            onChangeText={setText}
            multiline
            maxLength={tab === "Sala" ? 1000 : 500}
          />
          <PrimaryButton
            title={
              tab === "Sala"
                ? "Enviar mensagem para análise"
                : "Enviar avaliação para revisão"
            }
            disabled={busy || !text.trim()}
            onPress={() => void submit()}
          />
        </>
      )}
      {notice !== "" && <Copy>{notice}</Copy>}
      {error != null && <ErrorState error={error} />}
    </Screen>
  );
}
