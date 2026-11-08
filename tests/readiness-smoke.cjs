// Readiness QA with intercepted fixtures and a mocked share sheet. No email or feedback is sent.
const { chromium } = require("@playwright/test"),
  assert = require("node:assert/strict");
const { readEnvironment } = require("../scripts/setup-mobile.cjs");
(async () => {
  const base = process.env.SMOKE_URL || "http://127.0.0.1:8773",
    host = new URL(readEnvironment(process.cwd()).EXPO_PUBLIC_SUPABASE_URL)
      .hostname;
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    const uid = "90000000-0000-0000-0000-000000000001",
      id = "11000000-0000-0000-0000-000000000001";
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
    const user = { id: uid, role: "authenticated", aud: "authenticated" },
      auth = {
        access_token: jwt,
        refresh_token: "fixture",
        token_type: "bearer",
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user,
      };
    const actions = [
      {
        id: "b",
        decision: "rejected",
        reason: "Informe o número do endereço.",
        created_at: "2026-11-08T12:00:00Z",
      },
      {
        id: "a",
        decision: "pending",
        reason: "Internal old reason must not show",
        created_at: "2026-11-07T12:00:00Z",
      },
    ];
    const items = [
      {
        id: "new",
        target_type: "places",
        target_id: id,
        title: "Cadastro com ajuste",
        state: "rejected",
        created_at: "2026-11-08T12:00:00Z",
        moderation_actions: actions,
      },
      {
        id: "old",
        target_type: "places",
        target_id: id,
        title: "Old version must not show",
        state: "approved",
        created_at: "2026-11-07T12:00:00Z",
        moderation_actions: [],
      },
      {
        id: "photo",
        target_type: "photos",
        target_id: "photo",
        state: "pending",
        created_at: "2026-11-08T13:00:00Z",
        moderation_actions: [],
      },
      {
        id: "review",
        target_type: "reviews",
        target_id: "review",
        place_id: id,
        body: "Minha experiência",
        state: "approved",
        created_at: "2026-11-08T14:00:00Z",
        moderation_actions: [],
      },
    ];
    const place = {
      id,
      name: "Lugar aprovado",
      address: "Rua do exemplo, 10",
      category: "Comer",
      city: "Osório",
      state: "RS",
      created_by: uid,
      moderation_state: "approved",
      verification_status: "approved",
    };
    const review = {
      id: "80000000-0000-0000-0000-000000000001",
      place_id: id,
      author_id: uid,
      rating: 4,
      body: "Minha experiência",
      moderation_state: "approved",
      created_at: "2026-11-08T14:00:00Z",
    };
    let appeals = 0,
      failAppeal = true;
    const errors = [],
      requests = [];
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    await context.addInitScript(
      ({ host, auth }) => {
        localStorage.setItem(
          `sb-${host.split(".")[0]}-auth-token`,
          JSON.stringify(auth),
        );
        window.__reports = [];
        window.__shareMode = "cancel";
        Object.defineProperty(navigator, "share", {
          configurable: true,
          value: async (data) => {
            if (window.__shareMode === "cancel")
              throw new DOMException("Cancelled", "AbortError");
            window.__reports.push(data);
          },
        });
      },
      { host, auth },
    );
    await context.routeWebSocket(`wss://${host}/**`, (s) => s.close());
    for (const path of ["/place/**", "/feedback"])
      await context.route(base + path, (r) =>
        r.fulfill({ path: "dist/index.html", contentType: "text/html" }),
      );
    await context.route(`https://${host}/**`, async (r) => {
      const req = r.request(),
        u = new URL(req.url());
      requests.push(u.pathname);
      let data = [];
      if (u.pathname === "/auth/v1/user") data = user;
      else if (u.pathname === "/rest/v1/rpc/safe_is_admin") data = false;
      else if (u.pathname === "/rest/v1/rpc/search_places") data = [];
      else if (u.pathname === "/rest/v1/profiles")
        data = {
          id: uid,
          display_name: "Pessoa de teste",
          bio: "",
          handle: "",
          moderation_state: "approved",
        };
      else if (u.pathname === "/rest/v1/moderation_items") data = items;
      else if (u.pathname === "/rest/v1/moderation_appeals") {
        assert.equal(req.method(), "POST");
        appeals++;
        assert.deepEqual(req.postDataJSON(), {
          item_id: "new",
          author_id: uid,
          reason: "O número correto é 20.",
        });
        if (failAppeal) {
          await r.fulfill({
            status: 503,
            json: { message: "fixture unavailable" },
          });
          return;
        }
      } else if (u.pathname === "/rest/v1/places")
        data = u.searchParams.has("created_by") ? [] : place;
      else if (u.pathname === "/rest/v1/reviews")
        data = req.headers().accept?.includes("object") ? review : [review];
      else if (
        u.pathname === "/rest/v1/safe_accounts" ||
        u.pathname === "/rest/v1/place_ratings"
      )
        data = null;
      else if (u.pathname === "/rest/v1/photos")
        data = u.searchParams.has("profile_id") ? null : [];
      else if (
        u.pathname === "/rest/v1/favorites" &&
        u.searchParams.has("place_id")
      )
        data = null;
      else assert.equal(req.method(), "GET", "Unexpected operation blocked");
      await r.fulfill({ json: data });
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    const b = (name) => page.getByRole("button", { name, exact: true });
    await page.goto(base);
    await b("Explorar como visitante").click();
    await page.getByRole("tab", { name: /Perfil/ }).click();
    await b("Acompanhar contribuições").click();
    await page
      .getByText("Lugar · Cadastro com ajuste", { exact: true })
      .waitFor();
    await page.getByText("Precisa de ajuste", { exact: true }).waitFor();
    await page
      .getByText("Informe o número do endereço.", { exact: true })
      .waitFor();
    assert.equal(
      await page
        .getByText("Old version must not show", { exact: false })
        .count(),
      0,
    );
    assert.equal(
      await page
        .getByText("Internal old reason must not show", { exact: false })
        .count(),
      0,
    );
    const reason = page.getByRole("textbox", {
      name: "Conte por que devemos revisar",
      exact: true,
    });
    await reason.fill("O número correto é 20.");
    await b("Pedir revisão").click();
    await page.getByRole("alert").waitFor();
    assert.equal(await reason.inputValue(), "O número correto é 20.");
    failAppeal = false;
    await b("Pedir revisão").click();
    await page
      .getByText("Seu pedido foi recebido para revisão.", { exact: false })
      .waitFor();
    assert.equal(await reason.inputValue(), "");
    assert.equal(appeals, 2);
    await b("Abrir lugar para editar avaliação").click();
    await page.getByRole("tab", { name: "Avaliações", exact: true }).waitFor();
    assert.equal(
      await page
        .getByRole("tab", { name: "Avaliações", exact: true })
        .getAttribute("aria-selected"),
      "true",
    );
    await b("Editar minha avaliação").click();
    assert.equal(
      await page
        .getByRole("textbox", { name: "Conte sua experiência", exact: true })
        .inputValue(),
      "Minha experiência",
    );
    await page.goto(base + "/feedback");
    await b("Compartilhar relato").click();
    await page.getByRole("alert").filter({ hasText: "tela" }).waitFor();
    assert.equal(await page.evaluate(() => window.__reports.length), 0);
    await page
      .getByRole("textbox", { name: "Em qual tela?", exact: true })
      .fill("Busca");
    await page
      .getByRole("textbox", { name: "O que aconteceu?", exact: true })
      .fill("Não encontrei o botão para procurar.");
    await b("Compartilhar relato").click();
    await page
      .getByText("Compartilhamento cancelado.", { exact: false })
      .waitFor();
    assert.equal(
      await page
        .getByRole("textbox", { name: "O que aconteceu?", exact: true })
        .inputValue(),
      "Não encontrei o botão para procurar.",
    );
    await page.evaluate(() => {
      window.__shareMode = "share";
    });
    await b("Compartilhar relato").click();
    await page.getByText("Relato preparado.", { exact: false }).waitFor();
    const report = await page.evaluate(() => window.__reports[0]);
    assert(
      report.text.includes("NA REAL") && report.text.includes("Não encontrei"),
    );
    assert(
      !report.text.includes(uid) &&
        !report.text.includes(jwt) &&
        !report.text.includes("fixture"),
    );
    assert(
      !requests.some((p) => /feedback|smtp|mailer/.test(p)),
      "Feedback must not be silently uploaded",
    );
    await page.setViewportSize({ width: 320, height: 568 });
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS readiness: current contribution/version/reason, appeal failure/retry, review edit link, feedback validation/cancel/draft/share and narrow layout; fixtures only, no real messages, zero JS errors.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
