import { View, Pressable, Text } from "react-native";
import { ModerationPhoto } from "../components/moderation-photo";
import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Screen,
  Title,
  Copy,
  Card,
  Field,
  PrimaryButton,
  ErrorState,
} from "../components/ui";
import { AppHeader, StatusChip } from "../components/design";
import { router } from "expo-router";
import { useSession } from "../hooks/use-session";
import { GentleNote, QuietButton, m } from "../components/member-design";
import { moderationPreview } from "../validation/moderation-preview";
import { db } from "../services/supabase";
export default function Admin() {
  const qc = useQueryClient();
  const session = useSession();
  const lock = useRef(false);
  const [queueType, setQueueType] = useState("places");
  const [notice, setNotice] = useState("");
  const [page, setPage] = useState(0);
  const [state, setState] = useState("pending");
  const pageSize = 25;
  const [reason, setReason] = useState("");
  const [target, setTarget] = useState("");
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  const q = useQuery({
    queryKey: ["admin-queue", session?.user.id, state, page, queueType],
    enabled: Boolean(session),
    queryFn: async () => {
      const a = await db().rpc("safe_is_admin");
      if (a.error) throw a.error;
      if (a.data !== true)
        throw new Error("Acesso restrito a moderadores autorizados.");
      let queueQuery = db()
        .from("moderation_items")
        .select("id,target_type,target_id,state,payload,analysis,created_at", {
          count: "exact",
        })
        .neq("state", "superseded")
        .order("created_at", { ascending: false })
        .order("id", { ascending: false });
      if (state !== "all") queueQuery = queueQuery.eq("state", state);
      if (queueType !== "all")
        queueQuery = queueQuery.eq("target_type", queueType);
      const queue = await queueQuery.range(
        page * pageSize,
        page * pageSize + pageSize - 1,
      );
      const suggestions = await db()
        .from("place_change_suggestions")
        .select("id,place_id,field,proposed_value,reason")
        .eq("status", "pending")
        .order("created_at")
        .limit(50);
      if (suggestions.error) throw suggestions.error;
      const reports = await db()
        .from("ugc_reports")
        .select("id,target_type,target_id,reason")
        .order("created_at", { ascending: false })
        .limit(50);
      const accountAppeals = await db()
        .from("account_appeals")
        .select("user_id,reason");
      if (accountAppeals.error) throw accountAppeals.error;
      const legacy = await db()
        .from("content_reports")
        .select("id,place_id,reason")
        .order("created_at", { ascending: false })
        .limit(50);
      if (legacy.error) throw legacy.error;
      const appeals = await db()
        .from("moderation_appeals")
        .select("id,item_id,reason")
        .order("created_at", { ascending: false })
        .limit(50);
      if (queue.error || reports.error || appeals.error)
        throw queue.error ?? reports.error ?? appeals.error;
      return {
        queue: queue.data,
        suggestions: suggestions.data,
        queueCount: queue.count ?? 0,
        reports: [
          ...reports.data,
          ...legacy.data.map((r) => ({
            id: r.id,
            target_type: "places",
            target_id: r.place_id,
            reason: r.reason,
          })),
        ],
        appeals: appeals.data,
        accountAppeals: accountAppeals.data,
      };
    },
  });
  async function decide(item: string, decision: string) {
    if (lock.current) return;
    lock.current = true;
    setNotice("");
    setBusy(true);
    setError(undefined);
    try {
      const r = await db().rpc("moderate_content", { item, decision, reason });
      if (r.error) throw r.error;
      if (r.data !== true) {
        await qc.invalidateQueries({ queryKey: ["admin-queue"] });
        throw new Error(
          "Este conteúdo mudou. Atualize a fila e revise a versão atual antes de decidir.",
        );
      }
      setReason("");
      setNotice(
        "Decisão registrada. A lista da comunidade será atualizada conforme o resultado da revisão.",
      );
      await qc.invalidateQueries();
    } catch (e) {
      setError(e);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Screen
      onRefresh={session ? () => void q.refetch() : undefined}
      refreshing={q.isRefetching}
    >
      <AppHeader title="NA REAL Safe" back />
      {!session ? (
        <>
          <Copy>Entre com a conta de moderador para revisar os cadastros.</Copy>
          <PrimaryButton
            title="Entrar para revisar"
            onPress={() => router.push("/auth")}
          />
        </>
      ) : q.isError ? (
        <ErrorState error={q.error} />
      ) : q.isPending ? (
        <Copy>Verificando acesso…</Copy>
      ) : (
        <>
          <Copy>
            Revisão humana. Não aprove dados pessoais, residências privadas ou
            mídia sem verificar o arquivo. As decisões registram autor, versão e
            motivo.
          </Copy>
          <GentleNote>
            Novos lugares aguardam aprovação humana. A IA pode ajudar na
            triagem, mas não comprova endereço, existência ou funcionamento de
            um estabelecimento.
          </GentleNote>
          {notice !== "" && <GentleNote>{notice}</GentleNote>}
          <View style={{ flexDirection: "row", gap: 8 }}>
            {[
              ["places", "Lugares"],
              ["all", "Toda a comunidade"],
            ].map(([value, label]) => (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityLabel={label}
                aria-pressed={queueType === value}
                disabled={busy}
                onPress={() => {
                  setQueueType(value);
                  setPage(0);
                }}
                style={{
                  padding: 12,
                  minHeight: 44,
                  borderRadius: 16,
                  backgroundColor: queueType === value ? "#D1FAE5" : "#F1F5F9",
                }}
              >
                <Text style={m.label}>{label}</Text>
              </Pressable>
            ))}
          </View>
          <QuietButton
            title="Atualizar fila"
            disabled={busy || q.isFetching}
            onPress={() => void q.refetch()}
          />
          <Field
            label="Motivo da decisão (obrigatório)"
            value={reason}
            onChangeText={setReason}
            maxLength={1000}
          />
          <PrimaryButton
            title="Executar triagem IA configurada"
            disabled={busy}
            onPress={async () => {
              setBusy(true);
              setNotice("");
              setError(undefined);
              try {
                const r = await db().functions.invoke("moderate-pending", {
                  body: {},
                });
                if (r.error) throw r.error;
                if (r.data.status === "not_configured")
                  throw new Error(
                    "Provedor de IA não configurado. Conteúdos permanecem pendentes.",
                  );
                setNotice(
                  `Triagem concluída: ${r.data.processed ?? 0} itens processados. Cadastros de lugares continuam sujeitos à aprovação humana.`,
                );
                await qc.invalidateQueries();
              } catch (e) {
                setError(e);
              } finally {
                setBusy(false);
              }
            }}
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {[
              ["pending", "Pendentes"],
              ["approved", "Aprovados"],
              ["rejected", "Rejeitados"],
              ["removed", "Removidos"],
              ["all", "Todos"],
            ].map(([value, label]) => (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityState={{ selected: state === value }}
                onPress={() => {
                  setState(value);
                  setPage(0);
                }}
                style={{
                  padding: 12,
                  borderRadius: 18,
                  backgroundColor: state === value ? "#D1FAE5" : "#F1F5F9",
                }}
              >
                <Text>{label}</Text>
              </Pressable>
            ))}
          </View>
          <Copy>
            {q.data.queueCount} itens neste filtro • página {page + 1}
          </Copy>
          {q.data.queue.length === 0 && (
            <Copy>Nenhum conteúdo nesta página.</Copy>
          )}
          {q.data.queue.map((i) => (
            <Card key={i.id}>
              <Title>{moderationPreview(i.target_type, i.payload).title}</Title>
              {moderationPreview(i.target_type, i.payload).fields.map(
                (field) => (
                  <View key={field.label} style={{ gap: 4 }}>
                    <Text style={m.label}>{field.label}</Text>
                    <Copy>{field.value}</Copy>
                  </View>
                ),
              )}
              <StatusChip state={i.state} />
              <Copy>ID {i.target_id}</Copy>
              {i.target_type === "photos" && (
                <PrimaryButton
                  title="Preparar imagem sem metadados para revisão"
                  disabled={busy}
                  onPress={async () => {
                    setBusy(true);
                    setError(undefined);
                    try {
                      const r = await db().functions.invoke("prepare-photo", {
                        body: { id: i.target_id },
                      });
                      if (r.error) throw r.error;
                      if (!r.data?.prepared)
                        throw new Error("Preparação não confirmada");
                      await qc.invalidateQueries({
                        queryKey: ["moderation-photo"],
                      });
                    } catch (e) {
                      setError(e);
                    } finally {
                      setBusy(false);
                    }
                  }}
                />
              )}
              {i.target_type === "photos" &&
                typeof i.payload.object_path === "string" &&
                !i.analysis?.categories?.["sexual/minors"] && (
                  <ModerationPhoto path={i.payload.object_path} />
                )}

              <Copy>
                Análise:{" "}
                {i.analysis ? JSON.stringify(i.analysis) : "Não realizada"}
              </Copy>
              {["approved", "pending", "rejected", "removed"].map((d) => (
                <PrimaryButton
                  key={d}
                  title={
                    {
                      approved: "Aprovar após revisão",
                      pending: "Manter pendente",
                      rejected: "Rejeitar",
                      removed: "Remover",
                    }[d]!
                  }
                  disabled={busy || reason.trim().length < 3}
                  onPress={() => void decide(i.id, d)}
                />
              ))}
            </Card>
          ))}
          <PrimaryButton
            title="Página anterior da fila"
            disabled={busy || page === 0}
            onPress={() => setPage((p) => p - 1)}
          />
          <PrimaryButton
            title="Próxima página da fila"
            disabled={busy || (page + 1) * pageSize >= q.data.queueCount}
            onPress={() => setPage((p) => p + 1)}
          />
          <Title>Correções de lugares</Title>
          {q.data.suggestions.map((s) => (
            <Card key={s.id}>
              <Copy>
                {s.place_id} • {s.field}
              </Copy>
              <Copy>{s.proposed_value}</Copy>
              <Copy>{s.reason}</Copy>
              {[true, false].map((approve) => (
                <PrimaryButton
                  key={String(approve)}
                  title={
                    approve ? "Aplicar correção revisada" : "Rejeitar correção"
                  }
                  disabled={busy || reason.trim().length < 3}
                  onPress={async () => {
                    setBusy(true);
                    setError(undefined);
                    try {
                      const r = await db().rpc("review_place_suggestion", {
                        suggestion: s.id,
                        approve,
                        reason,
                      });
                      if (r.error) throw r.error;
                      await qc.invalidateQueries();
                    } catch (e) {
                      setError(e);
                    } finally {
                      setBusy(false);
                    }
                  }}
                />
              ))}
            </Card>
          ))}
          <Title>Denúncias</Title>
          {q.data.reports.map((r) => (
            <Card key={r.id}>
              <Copy>
                {r.target_type} · {r.target_id}
              </Copy>
              <Copy>{r.reason}</Copy>
            </Card>
          ))}
          <Title>Recursos de suspensão</Title>
          {q.data.accountAppeals.map((a) => (
            <Card key={a.user_id}>
              <Copy>{a.user_id}</Copy>
              <Copy>{a.reason}</Copy>
            </Card>
          ))}
          <Title>Contestações</Title>
          {q.data.appeals.map((a) => (
            <Card key={a.id}>
              <Copy>Item {a.item_id}</Copy>
              <Copy>{a.reason}</Copy>
            </Card>
          ))}
          <Field
            label="UUID da conta para suspender/reintegrar"
            value={target}
            onChangeText={setTarget}
          />
          {[true, false].map((suspend) => (
            <PrimaryButton
              key={String(suspend)}
              title={suspend ? "Suspender conta" : "Reintegrar conta"}
              disabled={busy || !target || reason.length < 3}
              onPress={async () => {
                setError(undefined);
                setBusy(true);
                try {
                  const r = await db().rpc("suspend_account", {
                    target,
                    suspend,
                    reason,
                  });
                  if (r.error) throw r.error;
                  await qc.invalidateQueries();
                } catch (e) {
                  setError(e);
                } finally {
                  setBusy(false);
                }
              }}
            />
          ))}
        </>
      )}
      {error != null && <ErrorState error={error} />}
    </Screen>
  );
}
