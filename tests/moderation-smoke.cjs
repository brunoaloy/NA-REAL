// All API responses are intercepted: no real decisions, accounts or IA calls.
const { chromium } = require("@playwright/test");
const assert = require("node:assert/strict");
const { readEnvironment } = require("../scripts/setup-mobile.cjs");
(async () => {
  const base = process.env.SMOKE_URL || "http://127.0.0.1:8775";
  const host = new URL(readEnvironment(process.cwd()).EXPO_PUBLIC_SUPABASE_URL)
    .hostname;
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const uid = "90000000-0000-0000-0000-000000000001";
  const user = { id: uid, role: "authenticated", aud: "authenticated" };
  const jwt =
    Buffer.from("{}").toString("base64url") +
    "." +
    Buffer.from(
      JSON.stringify({
        sub: uid,
        role: "authenticated",
        exp: Math.floor(Date.now() / 1000) + 3600,
      }),
    ).toString("base64url") +
    ".fixture";
  const auth = {
    access_token: jwt,
    refresh_token: "fixture",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user,
  };
  try {
    for (const mode of ["guest", "denied", "moderator"]) {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
      });
      if (mode !== "guest")
        await context.addInitScript(
          ({ host, auth }) =>
            localStorage.setItem(
              `sb-${host.split(".")[0]}-auth-token`,
              JSON.stringify(auth),
            ),
          { host, auth },
        );
      await context.routeWebSocket(`wss://${host}/**`, (s) => s.close());
      await context.route(base + "/admin", (r) =>
        r.fulfill({ path: "dist/index.html", contentType: "text/html" }),
      );
      let queueReads = 0,
        decisions = 0,
        pending = true,
        result = false,
        triages = 0;
      await context.route(`https://${host}/**`, async (r) => {
        const u = new URL(r.request().url());
        let data = [];
        let headers = {};
        if (
          u.pathname.startsWith("/functions/v1/") &&
          r.request().method() === "GET"
        ) {
          await r.fulfill({
            status: 405,
            json: { error: "Method not allowed" },
          });
          return;
        }
        if (u.pathname === "/auth/v1/user") data = user;
        else if (u.pathname === "/rest/v1/rpc/safe_is_admin")
          data = mode === "moderator";
        else if (u.pathname === "/rest/v1/moderation_items") {
          queueReads++;
          assert.equal(mode, "moderator");
          assert.equal(u.searchParams.get("target_type"), "eq.places");
          data = pending
            ? [
                {
                  id: "11000000-0000-0000-0000-000000000001",
                  target_type: "places",
                  target_id: "22000000-0000-0000-0000-000000000002",
                  state: "pending",
                  payload: {
                    name: "Café em revisão",
                    city: "Osório",
                    state: "RS",
                    address: "Rua Exemplo, 10",
                    category: "Comer",
                    secret: "PRIVATE_FIXTURE",
                  },
                  analysis: null,
                },
              ]
            : [];
          headers = { "content-range": pending ? "0-0/1" : "*/0" };
        } else if (u.pathname === "/rest/v1/rpc/moderate_content") {
          decisions++;
          const body = r.request().postDataJSON();
          assert.equal(body.decision, "approved");
          assert.ok(body.reason.length >= 3);
          data = result;
          if (result) pending = false;
        } else if (u.pathname === "/functions/v1/moderate-pending") {
          triages++;
          data = { status: "not_configured", processed: 0 };
        }
        await r.fulfill({ json: data, headers });
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(base + "/admin");
      if (mode === "guest") {
        await page
          .getByText("Entre com a conta de moderador", { exact: false })
          .waitFor();
        assert.equal(queueReads, 0);
      } else if (mode === "denied") {
        await page
          .getByText("Acesso restrito a moderadores autorizados.", {
            exact: true,
          })
          .waitFor();
        assert.equal(queueReads, 0);
      } else {
        await page.getByText("Café em revisão", { exact: true }).waitFor();
        await page.getByText("Rua Exemplo, 10", { exact: true }).waitFor();
        assert.equal(
          await page.getByText("PRIVATE_FIXTURE", { exact: false }).count(),
          0,
        );
        const approve = page.getByRole("button", {
          name: "Aprovar após revisão",
          exact: true,
        });
        assert.equal(await approve.isDisabled(), true);
        await page
          .getByLabel("Motivo da decisão (obrigatório)", { exact: true })
          .fill("Endereço revisado pela moderação");
        await approve.click();
        await page
          .getByText("Este conteúdo mudou.", { exact: false })
          .waitFor();
        assert.equal(
          await page.getByText("Decisão registrada.", { exact: false }).count(),
          0,
        );
        assert.equal(decisions, 1);
        await page
          .getByRole("button", { name: "Ferramentas", exact: true })
          .click();
        await page
          .getByRole("button", {
            name: "Analisar fila com IA",
            exact: true,
          })
          .click();
        await page
          .getByText("A IA ainda não está configurada.", { exact: false })
          .waitFor();
        assert.equal(triages, 1);
        assert.equal(pending, true);
        result = true;
        await page
          .getByRole("button", { name: "Cadastros", exact: true })
          .click();
        await approve.click();
        await page.getByText("Decisão registrada.", { exact: false }).waitFor();
        await page
          .getByText("Nenhum conteúdo nesta página.", { exact: false })
          .waitFor();
        assert.equal(decisions, 2);
        assert.equal(pending, false);
        await page.setViewportSize({ width: 320, height: 740 });
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
        );
      }
      assert.deepEqual(errors, []);
      await context.close();
    }
    console.log(
      "Moderation UI passed: guest/role gate, readable place, reason, stale decision, unavailable IA, approval/refetch, 320px. Fixtures only.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
