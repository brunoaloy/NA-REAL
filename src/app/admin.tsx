import { View, Pressable, Text } from "react-native";
import { ModerationPhoto } from "../components/moderation-photo";
import { useState } from "react";
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
import { db } from "../services/supabase";
export default function Admin() {
  const qc = useQueryClient();
  const [page, setPage] = useState(0);
  const [state, setState] = useState("pending");
  const pageSize = 25;
  const [reason, setReason] = useState("");
  const [target, setTarget] = useState("");
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  const q = useQuery({
    queryKey: ["admin-queue", state, page],
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
      const queue = await queueQuery.range(
        page * pageSize,
        page * pageSize + pageSize - 1,
      );
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
    setBusy(true);
    setError(undefined);
    try {
      const r = await db().rpc("moderate_content", { item, decision, reason });
      if (r.error) throw r.error;
      await qc.invalidateQueries();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen>
      <AppHeader title="NA REAL Safe" back />
      {q.isError ? (
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
          <Field
            label="Motivo da decisão (obrigatório)"
            value={reason}
            onChangeText={setReason}
            maxLength={1000}
          />
          <PrimaryButton
            title="Executar lote de análise IA configurada"
            disabled={busy}
            onPress={async () => {
              setBusy(true);
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
              <Title>{i.target_type}</Title>
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
              <Copy>{JSON.stringify(i.payload)}</Copy>
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
