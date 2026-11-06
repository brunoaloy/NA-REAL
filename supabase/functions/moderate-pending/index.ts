import { preparePhoto } from "../_shared/media.ts";
import { clients, verified, json, preflight } from "../_shared/http.ts";
import { moderationVerdict } from "./verdict.ts";
Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const c = clients(req);
    const worker = Deno.env.get("MODERATION_WORKER_TOKEN");
    const supplied = req.headers.get("x-worker-token");
    const digest = async (v: string) =>
      new Uint8Array(
        await crypto.subtle.digest("SHA-256", new TextEncoder().encode(v)),
      );
    let authorized = false;
    if (worker && supplied) {
      const a = await digest(worker),
        b = await digest(supplied);
      authorized = a.reduce((v, x, i) => v | (x ^ b[i]), 0) === 0;
    }
    if (!authorized) {
      const u = await verified(req);
      const r = await u.caller.rpc("safe_is_admin");
      if (r.error || r.data !== true)
        return json({ error: "Admin required" }, 403);
    }
    const key = Deno.env.get("MODERATION_API_KEY");
    if (!key) return json({ status: "not_configured", processed: 0 });
    const jobs = await c.admin
      .from("moderation_items")
      .select("id,target_type,payload")
      .eq("state", "pending")
      .eq("requires_human", false)
      .or(
        "attempted_at.is.null,attempted_at.lt." +
          new Date(Date.now() - 3600000).toISOString(),
      )
      .order("created_at")
      .limit(10);
    if (jobs.error) throw jobs.error;
    let processed = 0;
    for (const job of jobs.data) {
      // Send only content fields, never internal IDs, handles of reporters, tokens or private Auth data.
      const p = job.payload;
      const text = [
        "name",
        "description",
        "address",
        "display_name",
        "handle",
        "bio",
        "body",
        "value",
      ]
        .map((k) => p[k])
        .filter((v) => typeof v === "string")
        .join("\n");
      const input: unknown[] = [
        { type: "text", text: text || "Community photo" },
      ];
      if (job.target_type === "photos") {
        let bytes: Uint8Array;
        try {
          bytes = await preparePhoto(c.admin, p.id);
        } catch {
          continue;
        }
        let binary = "";
        for (let i = 0; i < bytes.length; i += 8192)
          binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
        input.push({
          type: "image_url",
          image_url: { url: "data:image/jpeg;base64," + btoa(binary) },
        });
      }
      let response: Response;
      try {
        response = await fetch("https://api.openai.com/v1/moderations", {
          method: "POST",
          headers: {
            Authorization: "Bearer " + key,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ model: "omni-moderation-latest", input }),
          signal: AbortSignal.timeout(20000),
        });
      } catch {
        continue;
      }
      if (!response.ok) continue;
      const verdict = moderationVerdict(
        await response.json(),
        text,
        job.target_type,
      );
      if (!verdict) continue;
      // Local indicators only triage risk. They never certify safety or identify a crime.
      const applied = await c.admin.rpc("safe_apply", {
        item: job.id,
        decision: verdict.decision,
        reason: verdict.reason,
        provider_name: "openai:omni-moderation-latest",
        result: verdict.evidence,
      });
      if (!applied.error && applied.data) processed++;
    }
    return json({ processed });
  } catch (e) {
    return json(
      {
        error:
          e instanceof Error && e.message === "UNAUTHORIZED"
            ? "Authentication required"
            : "Moderation unavailable; content stays pending",
      },
      e instanceof Error && e.message === "UNAUTHORIZED" ? 401 : 503,
    );
  }
});
