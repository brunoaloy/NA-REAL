import { AuthorLabel } from "../components/message-context";
import { questionInput } from "../validation/domain";
import { StatusChip } from "../components/design";
import { ContentActions } from "../components/content-actions";
import { useState, useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";
import {
  useQuery,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Screen,
  Title,
  Copy,
  Field,
  PrimaryButton,
  ErrorState,
  Card,
  EmptyState,
} from "../components/ui";
import { db, supabase } from "../services/supabase";
import { userId } from "../services/catalog";
function Answers({
  id,
  allowReply = true,
}: {
  id: string;
  allowReply?: boolean;
}) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["answers", id],
    queryFn: async () => {
      const r = await db()
        .from("question_answers")
        .select("id,body,created_at,author_id,moderation_state")
        .eq("question_id", id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (r.error) throw r.error;
      return r.data;
    },
  });
  useEffect(() => {
    if (!supabase) return;
    const ch = supabase
      .channel("answers:" + id)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "question_answers",
          filter: "question_id=eq." + id,
        },
        () => void qc.invalidateQueries({ queryKey: ["answers", id] }),
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED")
          void qc.invalidateQueries({ queryKey: ["answers", id] });
      });
    return () => {
      void supabase?.removeChannel(ch);
    };
  }, [id, qc]);
  return (
    <Card>
      {q.isError && <ErrorState error={q.error} />}
      {q.data?.length === 0 && <Copy>Aguardando respostas</Copy>}
      {q.data?.map((a) => (
        <Card key={a.id}>
          <AuthorLabel id={a.author_id} />
          <StatusChip state={a.moderation_state} />
          <Copy>
            {a.body} · Relato de usuário ·{" "}
            {new Date(a.created_at).toLocaleTimeString("pt-BR")}
          </Copy>
          <ContentActions
            type="question_answers"
            id={a.id}
            author={a.author_id}
          />
        </Card>
      ))}
      {allowReply && (
        <>
          <Field
            label="Sua resposta (relato pessoal)"
            value={body}
            onChangeText={setBody}
            maxLength={500}
          />
          {error != null && <ErrorState error={error} />}
          <PrimaryButton
            title="Responder"
            disabled={busy || !body.trim()}
            onPress={async () => {
              setBusy(true);
              setError(undefined);
              try {
                const author_id = await userId();
                const r = await db()
                  .from("question_answers")
                  .insert({ question_id: id, author_id, body: body.trim() });
                if (r.error) throw r.error;
                setBody("");
                await qc.invalidateQueries({ queryKey: ["answers", id] });
              } catch (e) {
                setError(e);
              } finally {
                setBusy(false);
              }
            }}
          />
        </>
      )}
    </Card>
  );
}
export default function Questions() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [mode, setMode] = useState("active");
  const [custom, setCustom] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const q = useInfiniteQuery({
    queryKey: ["questions", id, mode],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      let query = db()
        .from("place_questions")
        .select("id,body,expires_at,created_at,author_id,moderation_state")
        .eq("place_id", id)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false });
      query =
        mode === "active"
          ? query.gt("expires_at", new Date().toISOString())
          : query.lte("expires_at", new Date().toISOString());
      const r = await query.range(pageParam * 20, pageParam * 20 + 19);
      if (r.error) throw r.error;
      return r.data;
    },
    getNextPageParam: (last, pages) =>
      last.length === 20 ? pages.length : undefined,
    refetchInterval: 30000,
  });
  const visible =
    q.data?.pages
      .flat()
      .filter((p) => mode === "history" || Date.parse(p.expires_at) > now) ??
    [];
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel("questions:" + id)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "place_questions",
          filter: "place_id=eq." + id,
        },
        () => void qc.invalidateQueries({ queryKey: ["questions", id] }),
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED")
          void qc.invalidateQueries({ queryKey: ["questions", id] });
      });
    return () => {
      void supabase?.removeChannel(channel);
    };
  }, [id, qc]);
  async function ask(kind: string, body: string) {
    setBusy(true);
    setError(undefined);
    try {
      questionInput.parse({ kind, body });
      const author_id = await userId();
      const r = await db()
        .from("place_questions")
        .insert({ place_id: id, author_id, kind, body });
      if (r.error) throw r.error;
      setNotice("Pergunta recebida para análise. Ainda não está pública.");
      setCustom("");
      await qc.invalidateQueries({ queryKey: ["questions", id] });
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen>
      <Title>Perguntar agora</Title>
      <Copy>
        Relatos pessoais com horário. Perguntas urgentes expiram em 60 minutos.
        Envios ficam pendentes até análise; nenhuma publicação é imediata.
      </Copy>
      {[
        ["movement", "Como está o movimento?"],
        ["movement", "Está muito cheio?"],
        ["queue", "Tem fila agora?"],
        ["open", "Está funcionando?"],
        ["parking", "Como está o estacionamento?"],
      ].map(([kind, text]) => (
        <PrimaryButton
          key={kind}
          title={text}
          disabled={busy}
          onPress={() => void ask(kind, text)}
        />
      ))}
      {error != null && <ErrorState error={error} />}
      {q.isError && <ErrorState error={q.error} />}
      <Field
        label="Outra pergunta"
        value={custom}
        onChangeText={setCustom}
        maxLength={500}
      />
      <PrimaryButton
        title="Enviar minha pergunta"
        disabled={busy || custom.trim().length < 3}
        onPress={() => void ask("other", custom.trim())}
      />
      {notice !== "" && <Copy>{notice}</Copy>}
      <PrimaryButton
        title={
          mode === "active"
            ? "Ver histórico de perguntas encerradas"
            : "Ver perguntas atuais"
        }
        onPress={() => setMode(mode === "active" ? "history" : "active")}
      />
      {mode === "history" && (
        <Copy>
          Histórico: perguntas encerradas. Respostas antigas não representam a
          situação atual e não aceitam novos envios.
        </Copy>
      )}
      {q.isPending ? (
        <Copy>Carregando perguntas…</Copy>
      ) : (
        !q.isError &&
        visible.length === 0 && (
          <EmptyState
            text={
              mode === "active"
                ? "Sem informações recentes."
                : "Nenhuma pergunta encerrada."
            }
          />
        )
      )}
      {visible.map((p) => (
        <Card key={p.id}>
          <StatusChip state={p.moderation_state} />
          <AuthorLabel id={p.author_id} />
          <Title>{p.body}</Title>
          <Copy>
            {new Date(p.created_at).toLocaleString("pt-BR")} •{" "}
            {mode === "history"
              ? "Encerrada"
              : "Válida até " +
                new Date(p.expires_at).toLocaleTimeString("pt-BR")}
          </Copy>
          <ContentActions
            type="place_questions"
            id={p.id}
            author={p.author_id}
          />
          <Answers
            id={p.id}
            allowReply={mode === "active" && Date.parse(p.expires_at) > now}
          />
        </Card>
      ))}
      {q.hasNextPage && (
        <PrimaryButton
          title="Carregar mais perguntas"
          disabled={q.isFetchingNextPage}
          onPress={() => void q.fetchNextPage()}
        />
      )}
      <PrimaryButton title="Voltar" onPress={() => router.back()} />
    </Screen>
  );
}
