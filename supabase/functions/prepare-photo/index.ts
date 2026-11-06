import { verified, json, preflight } from "../_shared/http.ts";
import { preparePhoto } from "../_shared/media.ts";
Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const { admin, caller } = await verified(req);
    const role = await caller.rpc("safe_is_admin");
    if (role.error || role.data !== true)
      return json({ error: "Admin required" }, 403);
    const { id } = await req.json();
    await preparePhoto(admin, id);
    return json({ prepared: true });
  } catch {
    return json({ error: "Foto não preparada; mantenha pendente." }, 503);
  }
});
