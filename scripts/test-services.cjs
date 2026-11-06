// End-to-end against a real LOCAL Supabase stack. No hosted credentials or mocks.
const { createClient } = require("@supabase/supabase-js");
const { capture } = require("./private-command.cjs");
const { randomUUID, randomBytes } = require("node:crypto");
const fs = require("node:fs");
const assert = (condition, label) => {
  if (!condition) throw new Error(label);
};
const result = [];
let stage = "configuration";
async function main() {
  let status;
  try {
    status = JSON.parse(
      capture("npx", ["--yes", "supabase@3.0.0", "status", "-o", "json"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      }),
    );
  } catch {
    throw new Error("Local Supabase status unavailable; start services first");
  }
  const url = status.API_URL || status.api_url;
  const anon = status.ANON_KEY || status.anon_key;
  const secret = status.SERVICE_ROLE_KEY || status.service_role_key;
  assert(url && anon && secret, "Local status lacks required bindings");
  const parsed = new URL(url);
  assert(
    ["127.0.0.1", "localhost"].includes(parsed.hostname),
    "This suite refuses hosted projects",
  );
  const options = {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  };
  const admin = createClient(url, secret, options);
  const A = createClient(url, anon, options),
    B = createClient(url, anon, options),
    C = createClient(url, anon, options);
  const users = [];
  let placeId;
  let photo;
  const run = randomUUID().slice(0, 8);
  const password = randomBytes(24).toString("base64url");
  async function step(name, fn) {
    stage = name;
    await fn();
    result.push({ test: name, status: "passed" });
    console.log("PASS " + name);
  }
  async function ok(promise) {
    const r = await promise;
    if (r.error)
      throw new Error(
        "Service request failed (" +
          (r.error.code || r.error.name || "unknown") +
          ")",
      );
    return r.data;
  }
  async function mailLink(email, type) {
    for (let i = 0; i < 40; i++) {
      const response = await fetch("http://127.0.0.1:54324/api/v1/messages");
      assert(response.ok, "Local mail service unavailable");
      const inbox = await response.json();
      for (const m of inbox.messages ?? []) {
        if (!(m.To ?? []).some((to) => to.Address === email)) continue;
        const body = await (
          await fetch("http://127.0.0.1:54324/api/v1/message/" + m.ID)
        ).json();
        const text = (body.Text || body.HTML || "").replaceAll("&amp;", "&");
        const links = text.match(/https?:\/\/[^\s<>"']+/g) || [];
        for (const link of links) {
          if (
            link.includes("/auth/v1/verify?") &&
            new URL(link).searchParams.get("type") === type
          )
            return link;
        }
      }
      await new Promise((r) => setTimeout(r, 250));
    }
    throw new Error("Confirmation email not captured");
  }
  async function approve(table, id) {
    const items = await ok(
      admin
        .from("moderation_items")
        .select("id")
        .eq("target_type", table)
        .eq("target_id", id)
        .eq("state", "pending"),
    );
    assert(items.length === 1, "Expected one pending revision");
    assert(
      await ok(
        C.rpc("moderate_content", {
          item: items[0].id,
          decision: "approved",
          reason: "Decisão administrativa controlada em teste LOCAL, sem IA",
        }),
      ),
      "Moderation decision not applied",
    );
  }
  try {
    await step("signup_email_confirmation_and_login", async () => {
      for (const [client, name] of [
        [A, "a"],
        [B, "b"],
      ]) {
        const email = `nareal-${run}-${name}@example.test`;
        const signed = await ok(client.auth.signUp({ email, password }));
        assert(
          signed.user && !signed.session,
          "Confirmation must precede session",
        );
        users.push(signed.user.id);
        const verify = await fetch(await mailLink(email, "signup"), {
          redirect: "manual",
        });
        assert(
          [302, 303].includes(verify.status),
          "Confirmation did not redirect",
        );
        await ok(client.auth.signInWithPassword({ email, password }));
      }
      const operator = await ok(
        admin.auth.admin.createUser({
          email: `nareal-${run}-operator@example.test`,
          password,
          email_confirm: true,
        }),
      );
      users.push(operator.user.id);
      await ok(admin.from("safe_admins").insert({ user_id: operator.user.id }));
      await ok(
        C.auth.signInWithPassword({
          email: `nareal-${run}-operator@example.test`,
          password,
        }),
      );
    });
    await step("password_recovery", async () => {
      const email = `nareal-${run}-a@example.test`;
      await ok(A.auth.resetPasswordForEmail(email));
      const verified = await fetch(await mailLink(email, "recovery"), {
        redirect: "manual",
      });
      const location = verified.headers.get("location");
      assert(location, "Recovery redirect absent");
      const tokens = new URLSearchParams(new URL(location).hash.slice(1));
      await ok(
        A.auth.setSession({
          access_token: tokens.get("access_token"),
          refresh_token: tokens.get("refresh_token"),
        }),
      );
      const next = randomBytes(24).toString("base64url");
      await ok(A.auth.updateUser({ password: next }));
      await ok(A.auth.signInWithPassword({ email, password: next }));
    });
    await step("place_creation_moderation_and_catalogue", async () => {
      const row = await ok(
        A.from("places")
          .insert({
            name: "Mercado integração " + run,
            category: "Compras",
            city: "Recife",
            state: "PE",
            address: "Endereço público de fixture LOCAL 10",
            is_public_venue: true,
            created_by: users[0],
            geom: "SRID=4326;POINT(-34.9 -8.05)",
          })
          .select("id")
          .single(),
      );
      placeId = row.id;
      const hidden = await ok(B.from("places").select("id").eq("id", placeId));
      assert(hidden.length === 0, "Unreviewed place leaked");
      await approve("places", placeId);
      const found = await ok(B.rpc("search_places", { term: run }));
      assert(
        found.some((p) => p.id === placeId),
        "Approved place not found by B",
      );
    });
    await step(
      "reviews_persist_across_sessions_and_authorization",
      async () => {
        const review = await ok(
          A.from("reviews")
            .insert({
              place_id: placeId,
              author_id: users[0],
              rating: 4,
              body: "Avaliação de integração local",
            })
            .select("id")
            .single(),
        );
        await approve("reviews", review.id);
        assert(
          (await ok(B.from("reviews").select("rating").eq("id", review.id)))
            .length === 1,
          "B cannot read approved review",
        );
        const altered = await B.from("reviews")
          .update({ rating: 1 })
          .eq("id", review.id)
          .select("id");
        assert(
          altered.error || altered.data.length === 0,
          "B modified review of A",
        );
        await ok(A.from("reviews").update({ rating: 5 }).eq("id", review.id));
        assert(
          (await ok(B.from("reviews").select("id").eq("id", review.id)))
            .length === 0,
          "Edited review bypassed moderation",
        );
        await approve("reviews", review.id);
        const rating = await ok(
          B.from("place_ratings")
            .select("rating")
            .eq("place_id", placeId)
            .single(),
        );
        assert(Number(rating.rating) === 5, "Aggregate rating wrong");
      },
    );
    await step("realtime_question_answer_notification", async () => {
      await ok(
        B.from("notification_preferences").insert({
          user_id: users[1],
          answers: true,
        }),
      );
      const question = await ok(
        B.from("place_questions")
          .insert({
            place_id: placeId,
            author_id: users[1],
            kind: "movement",
            body: "Como está o movimento neste teste local?",
          })
          .select("id")
          .single(),
      );
      await approve("place_questions", question.id);
      let resolveEvent;
      const event = new Promise((resolve) => (resolveEvent = resolve));
      const channel = B.channel("integration-" + run).on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "question_answers",
          filter: "question_id=eq." + question.id,
        },
        () => resolveEvent(),
      );
      await new Promise((resolve, reject) => {
        const t = setTimeout(
          () => reject(new Error("Realtime subscription timeout")),
          15000,
        );
        channel.subscribe((s) => {
          if (s === "SUBSCRIBED") {
            clearTimeout(t);
            resolve();
          }
        });
      });
      try {
        const answer = await ok(
          A.from("question_answers")
            .insert({
              question_id: question.id,
              author_id: users[0],
              body: "Resposta de fixture, não representa um lugar real",
            })
            .select("id")
            .single(),
        );
        await approve("question_answers", answer.id);
        let timer;
        await Promise.race([
          event,
          new Promise((_, reject) => {
            timer = setTimeout(
              () => reject(new Error("Realtime event timeout")),
              15000,
            );
          }),
        ]).finally(() => clearTimeout(timer));
        const notifications = await ok(
          B.from("notifications").select("id").eq("place_id", placeId),
        );
        assert(notifications.length === 1, "Response notification missing");
      } finally {
        await B.removeChannel(channel);
      }
    });
    await step("room_messages_retry_and_pending_content", async () => {
      for (const [client, user] of [
        [A, users[0]],
        [B, users[1]],
      ]) {
        const request = randomUUID();
        const id = await ok(
          client.rpc("submit_message", {
            place: placeId,
            body: "Mensagem LOCAL de integração",
            reply: null,
            request,
          }),
        );
        assert(
          id ===
            (await ok(
              client.rpc("submit_message", {
                place: placeId,
                body: "Mensagem LOCAL de integração",
                reply: null,
                request,
              }),
            )),
          "Retry changed message",
        );
        await approve("place_messages", id);
      }
      const pending = await ok(
        A.rpc("submit_message", {
          place: placeId,
          body: "Mensagem não analisada: retenção de teste, sem classificação IA",
          reply: null,
          request: randomUUID(),
        }),
      );
      assert(
        (await ok(B.from("place_messages").select("id").eq("id", pending)))
          .length === 0,
        "Unreviewed message leaked",
      );
    });
    await step("favorites_reports_and_admin_denial", async () => {
      await ok(
        B.from("favorites").insert({ user_id: users[1], place_id: placeId }),
      );
      assert(
        (
          await ok(
            B.from("favorites").select("place_id").eq("place_id", placeId),
          )
        ).length === 1,
        "Favorite missing",
      );
      await ok(
        B.from("ugc_reports").insert({
          reporter_id: users[1],
          target_type: "places",
          target_id: placeId,
          reason: "Denúncia de teste local",
        }),
      );
      assert(
        (await ok(C.from("ugc_reports").select("id").eq("target_id", placeId)))
          .length === 1,
        "Admin report missing",
      );
      assert(
        (await ok(B.rpc("safe_is_admin"))) === false,
        "Ordinary user is admin",
      );
    });
    await step("storage_private_upload_and_sanitized_photo", async () => {
      const { chromium } = require("@playwright/test");
      const browser = await chromium.launch({
        executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
        args: ["--no-sandbox"],
        headless: true,
      });
      let bytes;
      try {
        const page = await browser.newPage({
          viewport: { width: 16, height: 16 },
        });
        await page.setContent('<body style="background:white">');
        bytes = await page.screenshot({ type: "jpeg" });
      } finally {
        await browser.close();
      }
      const path = users[0] + "/" + randomUUID() + ".jpg";
      photo = await ok(
        A.from("photos")
          .insert({
            owner_id: users[0],
            place_id: placeId,
            object_path: path,
            byte_size: bytes.length,
          })
          .select("id,object_path,content_revision,owner_id")
          .single(),
      );
      await ok(
        A.storage
          .from("community-photos")
          .upload(path, bytes, { contentType: "image/jpeg" }),
      );
      const denied = await B.storage.from("community-photos").download(path);
      assert(denied.error, "Original photo readable by B");
      await ok(C.functions.invoke("prepare-photo", { body: { id: photo.id } }));
      await approve("photos", photo.id);
      const signed = await ok(
        B.storage
          .from("reviewed-photos")
          .createSignedUrl(
            users[0] + "/" + photo.content_revision + ".jpg",
            60,
          ),
      );
      const response = await fetch(signed.signedUrl);
      assert(
        response.ok && (await response.arrayBuffer()).byteLength > 0,
        "Reviewed photo not readable",
      );
    });
    await step("moderation_without_provider_stays_pending", async () => {
      const response = await ok(
        C.functions.invoke("moderate-pending", { body: {} }),
      );
      assert(
        response.status === "not_configured",
        "Provider absence was not explicit",
      );
    });
  } finally {
    let cleanupFailures = 0;
    async function cleanup(promise) {
      try {
        const r = await promise;
        if (r?.error) cleanupFailures++;
      } catch {
        cleanupFailures++;
      }
    }
    if (photo) {
      await cleanup(
        admin.storage.from("community-photos").remove([photo.object_path]),
      );
      await cleanup(
        admin.storage
          .from("reviewed-photos")
          .remove([photo.owner_id + "/" + photo.content_revision + ".jpg"]),
      );
    }
    if (placeId) await cleanup(admin.from("places").delete().eq("id", placeId));
    for (const id of users) await cleanup(admin.auth.admin.deleteUser(id));
    await Promise.all([
      A.removeAllChannels(),
      B.removeAllChannels(),
      C.removeAllChannels(),
    ]);
    result.push({
      test: "fixture_cleanup",
      status: cleanupFailures ? "failed" : "passed",
    });
    if (cleanupFailures) {
      console.error(
        "FAIL fixture cleanup; inspect local test data before another run",
      );
      process.exitCode = 1;
    }
  }
}
main()
  .catch((error) => {
    const blocked = stage === "configuration";
    result.push({
      test: stage,
      status: blocked ? "blocked" : "failed",
      reason: error.message,
    });
    console.error(
      (blocked ? "BLOCKED " : "FAIL ") + stage + " — " + error.message,
    );
    process.exitCode = blocked ? 2 : 1;
  })
  .finally(() => {
    fs.mkdirSync(".local-services", { recursive: true, mode: 0o700 });
    fs.writeFileSync(
      ".local-services/report.json",
      JSON.stringify(
        {
          scope:
            "real local Supabase; local SMTP capture; no hosted project or AI provider",
          results: result,
        },
        null,
        2,
      ),
      { mode: 0o600 },
    );
  });
