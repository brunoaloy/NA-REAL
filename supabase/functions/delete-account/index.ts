import { verified, json, preflight } from "../_shared/http.ts";
Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const { admin, user } = await verified(req);
    const body = await req.json();
    if (body.confirm !== "EXCLUIR")
      return json({ error: "Confirme EXCLUIR" }, 400);
    const token =
      req.headers.get("Authorization")?.replace(/^Bearer /i, "") ?? "";
    const claims = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    // getUser verified this same token above. Require recent authentication, not merely a refreshed access token.
    if (!claims.auth_time && !Array.isArray(claims.amr))
      return json({ error: "Entre novamente para excluir sua conta." }, 403);
    const authenticatedAt =
      claims.auth_time ??
      Math.max(...claims.amr.map((v: { timestamp: number }) => v.timestamp));
    if (
      !Number.isFinite(authenticatedAt) ||
      Date.now() / 1000 - authenticatedAt > 600
    )
      return json({ error: "Entre novamente nos últimos 10 minutos." }, 403);
    // Storage objects are physical files; remove through Storage API before deleting Auth data.
    for (const bucket of ["community-photos", "reviewed-photos"]) {
      for (let batch = 0; batch < 100; batch++) {
        const listed = await admin.storage
          .from(bucket)
          .list(user.id, { limit: 100 });
        if (listed.error) throw listed.error;
        if (!listed.data.length) break;
        const removed = await admin.storage
          .from(bucket)
          .remove(listed.data.map((f) => user.id + "/" + f.name));
        if (removed.error) throw removed.error;
        if (batch === 99) throw new Error("Too many files");
      }
    }
    // Community places survive without attribution; the public establishment is not the account's personal data.
    const deleted = await admin.auth.admin.deleteUser(user.id);
    if (deleted.error) throw deleted.error;
    return json({ deleted: true });
  } catch (e) {
    return json(
      {
        error:
          e instanceof Error && e.message === "UNAUTHORIZED"
            ? "Authentication required"
            : "Não foi possível concluir. Tente novamente; a conta não foi marcada como excluída.",
      },
      e instanceof Error && e.message === "UNAUTHORIZED" ? 401 : 503,
    );
  }
});
