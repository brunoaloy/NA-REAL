import { StatusChip } from "../components/design";
import { ContentActions } from "../components/content-actions";
import { useState, useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
function Answers({ id }: { id: string }) {
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
    </Card>
  );
}
export default function Questions() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const q = useQuery({
    queryKey: ["questions", id],
    queryFn: async () => {
      const r = await db()
        .from("place_questions")
        .select("id,body,expires_at,author_id,moderation_state")
        .eq("place_id", id)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(20);
      if (r.error) throw r.error;
      return r.data;
    },
    refetchInterval: 30000,
  });
  async function ask(kind: string, body: string) {
    setBusy(true);
    setError(undefined);
    try {
      const author_id = await userId();
      const r = await db()
        .from("place_questions")
        .insert({ place_id: id, author_id, kind, body });
      if (r.error) throw r.error;
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
      {q.data?.filter((p) => Date.parse(p.expires_at) > now).length === 0 && (
        <EmptyState text="Sem informações recentes." />
      )}
      {q.data
        ?.filter((p) => Date.parse(p.expires_at) > now)
        .map((p) => (
          <Card key={p.id}>
            <StatusChip state={p.moderation_state} />
            <Title>{p.body}</Title>
            <ContentActions
              type="place_questions"
              id={p.id}
              author={p.author_id}
            />
            <Answers id={p.id} />
          </Card>
        ))}
      <PrimaryButton title="Voltar" onPress={() => router.back()} />
    </Screen>
  );
}
