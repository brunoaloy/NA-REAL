// Pilot QA: intercepted fixtures only; never changes real accounts or data.
const { chromium } = require("@playwright/test"),
  assert = require("node:assert/strict");
const { readEnvironment } = require("../scripts/setup-mobile.cjs");
(async () => {
  const base = process.env.SMOKE_URL || "http://127.0.0.1:8772",
    host = new URL(readEnvironment(process.cwd()).EXPO_PUBLIC_SUPABASE_URL)
      .hostname;
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox", "--enable-unsafe-swiftshader"],
  });
  try {
    const uid = "90000000-0000-0000-0000-000000000001",
      id = "11000000-0000-0000-0000-000000000001",
      newId = "22000000-0000-0000-0000-000000000002";
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
    const place = {
      id,
      name: "Café existente",
      category: "Comer",
      city: "Osório",
      state: "RS",
      address: "Rua de exemplo, 10",
      longitude: -50.2691,
      latitude: -29.8881,
      rating: null,
      review_count: 0,
      moderation_state: "approved",
      verification_status: "approved",
      created_by: uid,
    };
    const queries = [],
      errors = [];
    let created = null,
      placeWrites = 0,
      photoWrites = 0,
      uploads = 0,
      duplicates = 0;
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    await context.addInitScript(
      ({ host, auth }) =>
        localStorage.setItem(
          `sb-${host.split(".")[0]}-auth-token`,
          JSON.stringify(auth),
        ),
      { host, auth },
    );
    await context.routeWebSocket(`wss://${host}/**`, (s) => s.close());
    await context.route("**/pilot-map-style.json", (r) =>
      r.fulfill({
        json: {
          version: 8,
          glyphs: base + "/fixture-fonts/{fontstack}/{range}.pbf",
          sources: {},
          layers: [
            {
              id: "background",
              type: "background",
              paint: { "background-color": "#edf3ed" },
            },
          ],
        },
      }),
    );
    for (const path of [
      "/map?**",
      "/profile?**",
      "/place/**",
      "/settings",
      "/test-guide",
      "/admin",
    ])
      await context.route(base + path, (r) =>
        r.fulfill({ path: "dist/index.html", contentType: "text/html" }),
      );
    await context.route(`https://${host}/**`, async (r) => {
      const req = r.request(),
        u = new URL(req.url()),
        method = req.method();
      let data = [];
      if (u.pathname === "/auth/v1/user") data = user;
      else if (u.pathname === "/rest/v1/rpc/safe_is_admin") data = true;
      else if (u.pathname === "/rest/v1/rpc/search_places") {
        queries.push(req.postDataJSON());
        data = [place];
      } else if (u.pathname === "/rest/v1/rpc/duplicate_candidates") {
        duplicates++;
        data = [place];
      } else if (u.pathname === "/rest/v1/profiles")
        data = {
          id: uid,
          display_name: "Pessoa de teste",
          bio: "",
          handle: "",
          moderation_state: "approved",
        };
      else if (u.pathname === "/rest/v1/places") {
        if (method === "POST") {
          placeWrites++;
          const v = req.postDataJSON();
          assert.equal(v.name, "Café do piloto");
          assert.equal(v.city, "Osório");
          assert.equal(
            "geom" in v,
            false,
            "City center must never become venue coordinates",
          );
          created = {
            ...v,
            id: newId,
            verification_status: "pending",
            moderation_state: "pending",
          };
          data = { id: newId };
        } else
          data = u.searchParams.has("created_by")
            ? created
              ? [created]
              : []
            : u.searchParams.get("id") === "eq." + newId
              ? created
              : place;
      } else if (u.pathname === "/rest/v1/photos") {
        if (method === "POST") {
          photoWrites++;
          assert.equal(req.postDataJSON().place_id, newId);
          if (photoWrites === 1) {
            await r.fulfill({
              status: 503,
              json: { message: "fixture photo failure" },
            });
            return;
          }
          data = { id: "70000000-0000-0000-0000-000000000001" };
        } else data = u.searchParams.has("profile_id") ? null : [];
      } else if (
        u.pathname.startsWith("/storage/v1/object/community-photos/") &&
        method === "POST"
      ) {
        uploads++;
        data = { Key: "fixture" };
      } else if (
        u.pathname === "/rest/v1/safe_accounts" ||
        u.pathname === "/rest/v1/place_ratings"
      )
        data = null;
      else if (
        u.pathname === "/rest/v1/favorites" &&
        u.searchParams.has("place_id")
      )
        data = null;
      else
        assert.equal(method, "GET", "Unexpected write blocked: " + u.pathname);
      await r.fulfill({ json: data });
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    const button = (name) => page.getByRole("button", { name, exact: true }),
      field = (name) => page.getByRole("textbox", { name, exact: true });
    const explore = async () => {
      await page.goto(base);
      await button("Explorar como visitante").click();
      await button("Abrir " + place.name).waitFor();
    };
    await explore();
    await button("Escolher cidade").click();
    const before = queries.length;
    await field("Cidade").fill("osorio");
    await button("Usar Osório, RS").click();
    assert.equal(await field("UF").inputValue(), "RS");
    assert.equal(
      queries.length,
      before,
      "Suggestions are offline and do not query Supabase",
    );
    await button("Explorar cidade").click();
    await button("Voltar à lista").click();
    await page
      .getByRole("button", { name: "Escolher cidade", exact: true })
      .getByText("Osório, RS", { exact: true })
      .waitFor();
    queries.length = 0;
    await explore();
    await page
      .getByRole("button", { name: "Escolher cidade", exact: true })
      .getByText("Osório, RS", { exact: true })
      .waitFor();
    assert(
      queries.length > 0 &&
        queries.every(
          (q) => q.city_filter === "Osório" && q.state_filter === "RS",
        ),
      "Cold launch must restore city before querying",
    );
    await button("Ver " + place.name + " no mapa").click();
    await button("Conhecer " + place.name).waitFor();
    assert.equal(new URL(page.url()).searchParams.get("placeId"), id);
    await button("Voltar à lista").click();
    await page.getByRole("tab", { name: /Adicionar/ }).click();
    await button("Continuar").click();
    await page
      .getByRole("alert")
      .filter({ hasText: "nome do lugar" })
      .waitFor();
    assert.equal(placeWrites, 0);
    await field("Nome do lugar").fill("Café do piloto");
    await button("Continuar").click();
    assert.equal(await field("Cidade").inputValue(), "Osório");
    await field("Cidade").fill("osorio");
    await button("Usar Osório, RS").click();
    await field("Endereço público").fill("Rua de exemplo, 20");
    await button("Continuar").click();
    const img = await browser.newPage({ viewport: { width: 40, height: 40 } });
    await img.setContent('<body style="margin:0;background:#0f766e"></body>');
    const jpeg = await img.screenshot({ type: "jpeg" });
    await img.close();
    const choosing = page.waitForEvent("filechooser");
    await button("Escolher foto").click();
    await (
      await choosing
    ).setFiles({ name: "fixture.jpg", mimeType: "image/jpeg", buffer: jpeg });
    await page
      .getByRole("img", { name: "Prévia da foto do lugar", exact: true })
      .waitFor();
    assert.equal(photoWrites, 0);
    await button("Voltar uma etapa").click();
    assert.equal(
      await field("Endereço público").inputValue(),
      "Rua de exemplo, 20",
    );
    await button("Continuar").click();
    await page
      .getByRole("img", { name: "Prévia da foto do lugar", exact: true })
      .waitFor();
    await button("Continuar").click();
    await page
      .getByRole("switch", { name: "Confirmo que é estabelecimento público" })
      .check();
    await button("Enviar para revisão").click();
    await button("É outro lugar, enviar para revisão").waitFor();
    assert.equal(placeWrites, 0);
    await button("É outro lugar, enviar para revisão").click();
    await button("Reenviar somente a foto").waitFor();
    assert.equal(placeWrites, 1);
    assert.equal(photoWrites, 1);
    await page
      .getByRole("alert")
      .filter({ hasText: "cadastro foi recebido" })
      .waitFor();
    await button("Reenviar somente a foto").click();
    await page
      .getByText("Foto recebida para revisão.", { exact: true })
      .waitFor();
    assert.equal(placeWrites, 1);
    assert.equal(photoWrites, 2);
    assert.equal(uploads, 1);
    assert.equal(duplicates, 2);
    await button("Acompanhar aprovação").click();
    await button("Abrir Café do piloto").waitFor();
    await button("Moderação da comunidade").waitFor();
    await button("Privacidade e configurações").click();
    await button("Guia dos primeiros testes").click();
    await page
      .getByRole("heading", { name: "Vamos descobrir juntos?", exact: true })
      .waitFor();
    const task = page.getByRole("checkbox").first();
    await task.click();
    assert.equal(await task.getAttribute("aria-checked"), "true");
    await page.setViewportSize({ width: 320, height: 568 });
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await button("Voltar").click();
    await button("Fontes e licenças").click();
    await page
      .getByRole("heading", { name: "Índice de cidades", exact: true })
      .waitFor();
    await page
      .getByText("Copyright (c) 2016 Kelvin S. do Prado", { exact: false })
      .waitFor();
    assert.deepEqual(errors, []);
    console.log(
      "PASS pilot: offline city suggestions/UF, cold-launch persistence, exact list-to-pin selection, guided steps/back drafts, duplicate guard, deferred photo, partial failure/retry without duplicate place, approval tracking, moderator entry, test guide; fixtures only, zero JS errors.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
