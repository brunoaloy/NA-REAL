import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { db } from "../services/supabase";
import { userId } from "../services/catalog";
import { QuietButton } from "./member-design";
import { Card, Copy, ErrorState, EmptyState } from "./ui";
import { StatusChip } from "./design";
import { ContentActions } from "./content-actions";
const values = [
  ["quiet", "Tranquilo"],
  ["moderate", "Moderado"],
  ["busy", "Cheio"],
] as const;
export function LiveReports({ placeId }: { placeId: string }) {
  const qc = useQueryClient();
  const [error, setError] = useState<unknown>();
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(t);
  }, []);
  const q = useQuery({
    queryKey: ["live", placeId],
    queryFn: async () => {
      const r = await db()
        .from("live_reports")
        .select(
          "id,body,value,author_id,created_at,expires_at,moderation_state,report_confirmations(agrees)",
        )
        .eq("place_id", placeId)
        .order("created_at", { ascending: false })
        .limit(30);
      if (r.error) throw r.error;
      return r.data;
    },
    refetchInterval: 30000,
  });
  async function post(value: string) {
    setError(undefined);
    setBusy(true);
    try {
      const r = await db()
        .from("live_reports")
        .insert({
          place_id: placeId,
          author_id: await userId(),
          kind: "movement",
          value,
        });
      if (r.error) throw r.error;
      setNotice(
        "Relato recebido para análise. Validade de 30 minutos desde o envio.",
      );
      await qc.invalidateQueries({ queryKey: ["live", placeId] });
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  async function confirm(report_id: string, agrees: boolean) {
    setError(undefined);
    try {
      const r = await db()
        .from("report_confirmations")
        .insert({ report_id, user_id: await userId(), agrees });
      if (r.error) throw r.error;
      await qc.invalidateQueries({ queryKey: ["live", placeId] });
    } catch (e) {
      setError(e);
    }
  }
  const reports = q.data?.filter((v) => Date.parse(v.expires_at) > now) ?? [];
  return (
    <>
      <Card>
        <Copy>
          Como está agora? Compartilhe somente sua experiência. Relatos não
          comprovam a situação universal do lugar.
        </Copy>
        {values.map(([value, label]) => (
          <QuietButton
            key={value}
            title={label}
            disabled={busy}
            onPress={() => void post(value)}
          />
        ))}
      </Card>
      {notice !== "" && <Copy>{notice}</Copy>}
      {error != null && <ErrorState error={error} />}
      {q.isError ? (
        <ErrorState error={q.error} />
      ) : q.isPending ? (
        <Copy>Carregando relatos…</Copy>
      ) : reports.length === 0 ? (
        <EmptyState
          icon="chatbubbles-outline"
          text="Como está por aí? Sua atualização pode ajudar quem está a caminho."
        />
      ) : (
        reports.map((v) => (
          <Card key={v.id}>
            <StatusChip state={v.moderation_state} />
            <Copy>
              {values.find((x) => x[0] === v.value)?.[1] ?? v.value} · Relato de
              usuário
            </Copy>
            <Copy>
              {new Date(v.created_at).toLocaleString("pt-BR")} • expira às{" "}
              {new Date(v.expires_at).toLocaleTimeString("pt-BR")}
            </Copy>
            <Copy>
              {v.report_confirmations.filter((c) => c.agrees).length}{" "}
              confirmações •{" "}
              {v.report_confirmations.filter((c) => !c.agrees).length}{" "}
              contestações
            </Copy>
            <QuietButton
              title="Confirmar relato"
              onPress={() => void confirm(v.id, true)}
            />
            <QuietButton
              title="Contestar relato"
              onPress={() => void confirm(v.id, false)}
            />
            <ContentActions
              type="live_reports"
              id={v.id}
              author={v.author_id}
            />
          </Card>
        ))
      )}
    </>
  );
}
