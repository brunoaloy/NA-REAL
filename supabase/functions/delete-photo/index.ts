import { verified, json, preflight } from "../_shared/http.ts";
Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const { caller, admin, user } = await verified(req);
    const { id } = await req.json();
    const p = await caller
      .from("photos")
      .select("object_path,owner_id,content_revision")
      .eq("id", id)
      .single();
    if (p.error || p.data.owner_id !== user.id)
      return json({ error: "Photo not found" }, 404);
    const removed = await admin.storage
      .from("community-photos")
      .remove([p.data.object_path]);
    if (removed.error) throw removed.error;
    const clean = await admin.storage
      .from("reviewed-photos")
      .remove([p.data.owner_id + "/" + p.data.content_revision + ".jpg"]);
    if (clean.error) throw clean.error;
    const row = await caller.from("photos").delete().eq("id", id);
    if (row.error) throw row.error;
    return json({ deleted: true });
  } catch {
    return json({ error: "Não foi possível remover a foto." }, 503);
  }
});
