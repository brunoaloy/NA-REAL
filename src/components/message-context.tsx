import { useQuery } from "@tanstack/react-query";
import { db } from "../services/supabase";
import { Copy } from "./ui";
export function AuthorLabel({ id }: { id: string }) {
  const q = useQuery({
    queryKey: ["public-author", id],
    queryFn: async () => {
      const r = await db()
        .from("profiles")
        .select("display_name,handle")
        .eq("id", id)
        .eq("moderation_state", "approved")
        .maybeSingle();
      if (r.error) throw r.error;
      return r.data;
    },
  });
  return (
    <Copy>
      {q.data?.display_name ?? "Pessoa da comunidade"}
      {q.data?.handle ? " @" + q.data.handle : ""}
    </Copy>
  );
}
export function ReplyContext({ id, placeId }: { id: string; placeId: string }) {
  const q = useQuery({
    queryKey: ["reply-context", placeId, id],
    queryFn: async () => {
      const r = await db()
        .from("place_messages")
        .select("body")
        .eq("id", id)
        .eq("place_id", placeId)
        .eq("moderation_state", "approved")
        .maybeSingle();
      if (r.error) throw r.error;
      return r.data;
    },
  });
  return (
    <Copy>
      {q.isPending
        ? "Carregando mensagem original…"
        : q.data
          ? "Em resposta: " + q.data.body
          : "Mensagem original indisponível"}
    </Copy>
  );
}
