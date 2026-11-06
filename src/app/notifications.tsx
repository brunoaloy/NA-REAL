import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Screen,
  Title,
  Copy,
  Card,
  PrimaryButton,
  ErrorState,
  EmptyState,
} from "../components/ui";
import { db } from "../services/supabase";
import { userId } from "../services/catalog";
export default function Notifications() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const uid = await userId();
      const r = await db()
        .from("notifications")
        .select("id,body,place_id,created_at,read_at")
        .eq("recipient_id", uid)
        .order("created_at", { ascending: false })
        .limit(50);
      if (r.error) throw r.error;
      return r.data;
    },
  });
  return (
    <Screen>
      <Title>Notificações</Title>
      {q.isPending && <Copy>Carregando…</Copy>}
      {q.isError && <ErrorState error={q.error} />}
      {q.data?.length === 0 && <EmptyState text="Nenhuma notificação." />}
      {q.data?.map((n) => (
        <Card key={n.id}>
          <Copy>{n.body}</Copy>
          <Copy>
            {n.read_at ? "Lida" : "Não lida"} ·{" "}
            {new Date(n.created_at).toLocaleString("pt-BR")}
          </Copy>
          <PrimaryButton
            title="Abrir lugar"
            onPress={async () => {
              const r = await db()
                .from("notifications")
                .update({ read_at: new Date().toISOString() })
                .eq("id", n.id);
              if (!r.error)
                await qc.invalidateQueries({ queryKey: ["notifications"] });
              router.push({
                pathname: "/place/[id]",
                params: { id: n.place_id },
              });
            }}
          />
        </Card>
      ))}
      <PrimaryButton title="Voltar" onPress={() => router.back()} />
    </Screen>
  );
}
