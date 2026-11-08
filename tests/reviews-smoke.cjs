// Deterministic UI regression test; fixtures are intercepted, never sent to Supabase.
const { chromium } = require("@playwright/test");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const uid = "90000000-0000-0000-0000-000000000001";
    const place = "11000000-0000-0000-0000-000000000001";
    const time = "2026-01-01T00:00:00+00:00";
    const rows = Array.from({ length: 35 }, (_, i) => ({
      id: `80000000-0000-0000-0000-${String(35 - i).padStart(12, "0")}`,
      rating: 4,
      body: `Review fixture ${35 - i}`,
      author_id: uid,
      moderation_state: "approved",
      created_at: time,
    }));
    const payload = {
      sub: uid,
      exp: Math.floor(Date.now() / 1000) + 3600,
      role: "authenticated",
    };
    const jwt =
      Buffer.from("{}").toString("base64url") +
      "." +
      Buffer.from(JSON.stringify(payload)).toString("base64url") +
      ".fixture";
    let cursorSeen = false,
      ownSeen = false,
      nearSeen = false,
      photoWrites = 0,
      uploaded = 0,
      placeCreated = false;
    // Use the configured public project's host solely to match the bundled SDK URL.
    const { readEnvironment } = require("../scripts/setup-mobile.cjs");
    const url = readEnvironment(process.cwd()).EXPO_PUBLIC_SUPABASE_URL;
    assert(
      url,
      "This regression test requires a connected build and ignored public .env.local",
    );
    const host = new URL(url).hostname;
    await context.addInitScript(
      ({ host, jwt, uid }) =>
        localStorage.setItem(
          "sb-" + host.split(".")[0] + "-auth-token",
          JSON.stringify({
            access_token: jwt,
            refresh_token: "fixture",
            token_type: "bearer",
            expires_in: 3600,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            user: { id: uid, aud: "authenticated", role: "authenticated" },
          }),
        ),
      { host, jwt, uid },
    );
    await context.routeWebSocket("wss://" + host + "/**", (socket) =>
      socket.close(),
    );
    const interceptApi = async (route) => {
      const u = new URL(route.request().url());
      let data = [];
      if (u.pathname === "/auth/v1/user")
        data = { id: uid, aud: "authenticated", role: "authenticated" };
      else if (u.pathname === "/rest/v1/places") {
        if (route.request().method() === "POST") placeCreated = true;
        data = {
          id: place,
          name: "UI fixture place",
          address: "Fixture address",
          city: "Recife",
          state: "PE",
          category: "Comer",
          description: "Fixture only",
          moderation_state: "approved",
          verification_status: "approved",
          content_revision: "fixture",
        };
      } else if (u.pathname === "/rest/v1/place_ratings")
        data = { rating: 4, review_count: 35 };
      else if (u.pathname === "/rest/v1/reviews") {
        if (route.request().method() !== "GET")
          throw new Error("Unexpected review write");
        if (u.searchParams.has("author_id")) {
          ownSeen = true;
          data = {
            id: rows[34].id,
            rating: 2,
            body: "Own review beyond first page",
          };
        } else if (u.searchParams.has("or")) {
          const filter = u.searchParams.get("or");
          assert(
            filter.includes("created_at.lt." + time) &&
              filter.includes("id.lt." + rows[29].id),
          );
          cursorSeen = true;
          data = rows.slice(30);
        } else data = rows.slice(0, 30);
      } else if (u.pathname === "/rest/v1/rpc/search_places_near") {
        const args = route.request().postDataJSON();
        assert(Math.abs(args.origin_latitude + 8.05) < 0.001);
        assert(Math.abs(args.origin_longitude + 34.88) < 0.001);
        nearSeen = true;
        data = [];
      } else if (
        u.pathname === "/rest/v1/photos" &&
        route.request().method() === "POST"
      ) {
        photoWrites++;
        data = { id: "70000000-0000-0000-0000-000000000001" };
      } else if (
        u.pathname.startsWith("/storage/v1/object/community-photos/") &&
        route.request().method() === "POST"
      ) {
        uploaded++;
        data = { Key: "fixture", Id: "70000000-0000-0000-0000-000000000001" };
      } else if (
        u.pathname === "/rest/v1/rpc/search_places" ||
        u.pathname === "/rest/v1/rpc/duplicate_candidates"
      )
        data = [];
      else if (u.pathname.includes("/rpc/")) data = false;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(data),
        headers: { "access-control-allow-origin": "*" },
      });
    };
    await context.route("https://" + host + "/**", interceptApi);

    const base = process.env.SMOKE_URL || "http://127.0.0.1:8765";
    // The documented Python static server lacks SPA history fallback.
    await context.route(base + "/place/**", (route) =>
      route.fulfill({ path: "dist/index.html", contentType: "text/html" }),
    );
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(
      (process.env.SMOKE_URL || "http://127.0.0.1:8765") + "/place/" + place,
    );
    await page.getByRole("tab", { name: "Avaliações", exact: true }).click();
    await page.getByText("Review fixture 35", { exact: false }).waitFor();
    await page
      .getByRole("button", { name: "Editar minha avaliação", exact: true })
      .click();
    await page
      .getByRole("textbox", { name: "Conte sua experiência" })
      .waitFor();
    assert.equal(
      await page
        .getByRole("textbox", { name: "Conte sua experiência" })
        .inputValue(),
      "Own review beyond first page",
    );
    await page
      .getByRole("button", { name: "Avaliações anteriores", exact: true })
      .click();
    await page.getByText("Review fixture 1", { exact: true }).last().waitFor();
    await page
      .getByRole("button", { name: "Avaliações anteriores", exact: true })
      .waitFor({ state: "hidden" });
    assert(cursorSeen && ownSeen);
    await context.grantPermissions(["geolocation"], { origin: base });
    await context.setGeolocation({ latitude: -8.05, longitude: -34.88 });
    await page.goto(base);
    await page.getByRole("button", { name: "Explorar como visitante" }).click();
    await page.getByText("Lugares para conhecer", { exact: true }).waitFor();
    assert.equal(nearSeen, false);
    await page
      .getByRole("button", { name: "Ordenar por proximidade", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Voltar à ordem por nome", exact: true })
      .waitFor();
    await page
      .getByText("Nenhum lugar encontrado.", { exact: false })
      .waitFor();
    assert(nearSeen);
    await page
      .getByRole("button", { name: "Voltar à ordem por nome", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Ordenar por proximidade", exact: true })
      .waitFor();
    await page.getByRole("tab", { name: /Adicionar/ }).click();
    await page
      .getByRole("textbox", { name: "Nome do lugar", exact: true })
      .fill("Lugar de fixture");
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await page
      .getByRole("textbox", { name: "Cidade", exact: true })
      .fill("Recife");
    await page.getByRole("textbox", { name: "UF", exact: true }).fill("PE");
    await page
      .getByRole("textbox", { name: "Endereço público", exact: true })
      .fill("Endereço público de fixture 10");
    assert.equal(
      await page
        .getByRole("textbox", { name: "Latitude", exact: true })
        .count(),
      0,
    );
    assert.equal(
      await page
        .getByRole("textbox", { name: "Longitude", exact: true })
        .count(),
      0,
    );
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await page
      .getByRole("button", { name: "Continuar sem foto", exact: true })
      .click();
    await page
      .getByRole("switch", { name: "Confirmo que é estabelecimento público" })
      .check();
    await page
      .getByRole("button", { name: "Enviar para revisão", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Abrir lugar cadastrado", exact: true })
      .click();
    await page.getByRole("tab", { name: "Geral", exact: true }).waitFor();
    assert(placeCreated);
    const fixtureImage = await browser.newPage({
      viewport: { width: 32, height: 32 },
    });
    await fixtureImage.setContent(
      '<body style="margin:0;background:#0F766E"><div style="width:16px;height:16px;background:#10B981"></div></body>',
    );
    const jpeg = await fixtureImage.screenshot({ type: "jpeg" });
    await fixtureImage.close();
    const choosing = page.waitForEvent("filechooser");
    await page
      .getByRole("button", { name: "Escolher foto", exact: true })
      .click();
    const chooser = await choosing;
    await chooser.setFiles({
      name: "fixture.jpg",
      mimeType: "image/jpeg",
      buffer: jpeg,
    });
    await page
      .getByRole("img", { name: "Prévia da foto selecionada" })
      .waitFor();
    await page
      .getByRole("img", { name: "Prévia da foto selecionada" })
      .scrollIntoViewIfNeeded();
    if (process.env.UI_SCREENSHOT_PATH)
      await page.screenshot({
        path: process.env.UI_SCREENSHOT_PATH,
        fullPage: true,
      });
    assert.equal(photoWrites, 0);
    assert.equal(uploaded, 0);
    await page
      .getByRole("button", { name: "Enviar foto para revisão", exact: true })
      .click();
    await page
      .getByText(
        "Foto enviada. Aguardando moderação; ainda não está pública.",
        { exact: true },
      )
      .waitFor();
    assert.equal(photoWrites, 1);
    assert.equal(uploaded, 1);
    const guest = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    await guest.route("https://" + host + "/**", interceptApi);
    await guest.routeWebSocket("wss://" + host + "/**", (socket) =>
      socket.close(),
    );
    const visitor = await guest.newPage();
    visitor.on("pageerror", (e) => errors.push(e.message));
    await visitor.goto(base);
    await visitor
      .getByRole("button", { name: "Explorar como visitante" })
      .click();
    await visitor.getByRole("tab", { name: /Adicionar/ }).click();
    await visitor
      .getByRole("button", { name: "Entrar para adicionar lugar" })
      .click();
    await visitor
      .getByRole("textbox", { name: "E-mail", exact: true })
      .waitFor();
    await guest.close();
    assert.deepEqual(errors, []);
    console.log(
      "PASS reviews UI: 35 tied timestamps, second page cursor, own old review editing, opt-in proximity, national fallback, saved place navigation and explicit photo preview/upload and guest authentication route; intercepted fixtures only.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
