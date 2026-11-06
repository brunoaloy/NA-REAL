import { Image } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { db } from "../services/supabase";
import { Copy, ErrorState } from "./ui";
export function ModerationPhoto({ path }: { path: string }) {
  const q = useQuery({
    queryKey: ["moderation-photo", path],
    queryFn: async () => {
      const row = await db()
        .from("photos")
        .select("owner_id,content_revision,sanitized_at")
        .eq("object_path", path)
        .single();
      if (row.error) throw row.error;
      const r = await db()
        .storage.from(
          row.data.sanitized_at ? "reviewed-photos" : "community-photos",
        )
        .createSignedUrl(
          row.data.sanitized_at
            ? row.data.owner_id + "/" + row.data.content_revision + ".jpg"
            : path,
          120,
        );
      if (r.error) throw r.error;
      return r.data.signedUrl;
    },
    staleTime: 90000,
  });
  return q.isError ? (
    <ErrorState error={q.error} />
  ) : q.isPending ? (
    <Copy>Carregando mídia privada para revisão…</Copy>
  ) : (
    <Image
      source={{ uri: q.data }}
      accessibilityLabel="Mídia não aprovada, visível somente ao autor e moderador"
      style={{ height: 240, width: "100%", borderRadius: 16 }}
    />
  );
}
