// The complete detail journey uses API fixtures only. No real account, email, or remote write.
const { chromium } = require("@playwright/test");
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path");
const { readEnvironment } = require("../scripts/setup-mobile.cjs");
(async () => {
  const env = readEnvironment(process.cwd());
  assert(env.EXPO_PUBLIC_SUPABASE_URL);
  const host = new URL(env.EXPO_PUBLIC_SUPABASE_URL).hostname,
    base = process.env.SMOKE_URL || "http://127.0.0.1:8770";
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    const uid = "90000000-0000-0000-0000-000000000001",
      id = "11000000-0000-0000-0000-000000000001";
    const place = {
      id,
      name: "Café de demonstração",
      category: "Comer",
      city: "Recife",
      state: "PE",
      address: "Rua da Praça, 10 & Anexo",
      description: "Um lugar de exemplo para testar a visita e a descoberta.",
      moderation_state: "approved",
      verification_status: "approved",
      created_by: uid,
      content_revision: "fixture-revision",
      rating: null,
      review_count: 0,
    };
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
    const user = { id: uid, aud: "authenticated", role: "authenticated" };
    const auth = {
      access_token: jwt,
      refresh_token: "fixture",
      token_type: "bearer",
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user,
    };
    const favorites = new Set(),
      photoLimits = [];
    let favoriteWrites = 0,
      failFavorite = true,
      review = null,
      reviewWrites = 0;
    const image = await browser.newPage({
      viewport: { width: 80, height: 50 },
    });
    await image.setContent(
      '<body style="margin:0;background:#b7d6c6"><div style="width:40px;height:50px;background:#0f766e"></div></body>',
    );
    const jpeg = await image.screenshot({ type: "jpeg" });
    await image.close();
    const intercept = async (route) => {
      const request = route.request(),
        u = new URL(request.url()),
        method = request.method(),
        owner = request.headers().authorization === `Bearer ${jwt}`;
      let data = [];
      if (u.pathname === "/rest/v1/rpc/safe_is_admin") data = false;
      else if (u.pathname === "/auth/v1/user") data = user;
      else if (u.pathname === "/auth/v1/token") data = auth;
      else if (u.pathname === "/rest/v1/rpc/search_places") data = [place];
      else if (u.pathname === "/rest/v1/places") {
        assert.equal(method, "GET");
        if (u.searchParams.get("created_by") === `eq.${uid}`) {
          assert(owner);
          await route.fulfill({ json: [place] });
          return;
        }
        if (u.searchParams.get("id") !== `eq.${id}`) {
          await route.fulfill({
            status: 406,
            json: { code: "PGRST116", message: "fixture unavailable" },
          });
          return;
        }
        data = place;
      } else if (u.pathname === "/rest/v1/place_ratings") data = null;
      else if (u.pathname === "/rest/v1/favorites") {
        if (method === "POST") {
          assert(owner);
          favoriteWrites++;
          assert.deepEqual(request.postDataJSON(), {
            user_id: uid,
            place_id: id,
          });
          if (failFavorite) {
            await route.fulfill({
              status: 503,
              json: { message: "fixture unavailable" },
            });
            return;
          }
          favorites.add(id);
        } else if (method === "DELETE") {
          assert(owner);
          assert.equal(u.searchParams.get("user_id"), `eq.${uid}`);
          assert.equal(u.searchParams.get("place_id"), `eq.${id}`);
          favorites.delete(id);
        }
        if (method === "GET")
          data = u.searchParams.has("place_id")
            ? favorites.has(id)
              ? { place_id: id }
              : null
            : favorites.has(id)
              ? [
                  {
                    place_id: id,
                    places: { id, name: place.name, city: place.city },
                  },
                ]
              : [];
      } else if (u.pathname === "/rest/v1/reviews") {
        if (method === "POST") {
          assert(owner);
          reviewWrites++;
          const value = request.postDataJSON();
          assert.equal(value.rating, 4);
          assert.equal(value.body, "Uma experiência para lembrar.");
          review = {
            ...value,
            id: "80000000-0000-0000-0000-000000000001",
            created_at: "2026-01-01T12:00:00Z",
            moderation_state: "pending",
          };
          data = { id: review.id };
        } else {
          assert.equal(method, "GET");
          data = u.searchParams.has("author_id")
            ? owner
              ? review
              : null
            : review && owner
              ? [review]
              : [];
        }
      } else if (u.pathname === "/rest/v1/photos") {
        assert.equal(method, "GET");
        if (u.searchParams.get("place_id") === `eq.${id}`) {
          assert.equal(u.searchParams.get("moderation_state"), "eq.approved");
          const limit = Number(u.searchParams.get("limit"));
          photoLimits.push(limit);
          data = [1, 2, 3].slice(0, limit).map((n) => ({
            id: `photo-${n}`,
            owner_id: uid,
            content_revision: `revision-${n}`,
            object_path: `${uid}/photo-${n}.jpg`,
          }));
        }
      } else if (
        u.pathname.startsWith("/storage/v1/object/sign/reviewed-photos/") &&
        method === "POST"
      )
        data = {
          signedURL: "/object/sign/reviewed-photos/fixture.jpg?token=fixture",
        };
      else if (
        u.pathname.startsWith("/storage/v1/object/sign/reviewed-photos/") &&
        method === "GET"
      ) {
        await route.fulfill({ contentType: "image/jpeg", body: jpeg });
        return;
      } else if (method !== "GET")
        throw new Error("Unexpected operation blocked");
      await route.fulfill({ json: data });
    };
    const setup = async (signed) => {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
      });
      if (signed)
        await context.addInitScript(
          ({ host, auth }) =>
            localStorage.setItem(
              `sb-${host.split(".")[0]}-auth-token`,
              JSON.stringify(auth),
            ),
          { host, auth },
        );
      await context.route(`https://${host}/**`, intercept);
      await context.routeWebSocket(`wss://${host}/**`, (socket) =>
        socket.close(),
      );
      await context.route(base + "/place/**", (route) =>
        route.fulfill({ path: "dist/index.html", contentType: "text/html" }),
      );
      await context.route(base + "/profile", (route) =>
        route.fulfill({ path: "dist/index.html", contentType: "text/html" }),
      );
      await context.route("https://www.google.com/maps/**", (route) =>
        route.fulfill({ contentType: "text/html", body: "<p>Maps test</p>" }),
      );
      return context;
    };
    const context = await setup(true),
      page = await context.newPage(),
      errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base);
    await page
      .getByRole("button", { name: "Explorar como visitante", exact: true })
      .click();
    await page
      .getByRole("button", { name: `Abrir ${place.name}`, exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: `Abrir ${place.name}`, exact: true })
      .click();
    await page
      .getByRole("heading", { name: place.name, exact: true })
      .waitFor();
    await page.getByText("1/3", { exact: true }).waitFor();
    assert(
      photoLimits.includes(1) && photoLimits.includes(6),
      "Compact list photos must not limit the detail gallery",
    );
    if (process.env.UI_SCREENSHOT_PATH)
      await page.screenshot({
        path: process.env.UI_SCREENSHOT_PATH,
        fullPage: true,
      });
    await page
      .getByRole("button", { name: "Ampliar foto 1", exact: true })
      .click();
    await page
      .getByRole("img", { name: "Foto ampliada da comunidade", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Próxima foto", exact: true })
      .click();
    await page.getByText("Foto 2 de 3", { exact: true }).waitFor();
    await page
      .getByRole("button", { name: "Fechar foto", exact: true })
      .click();
    const popupPromise = context.waitForEvent("page");
    await page
      .getByRole("button", { name: "Como chegar", exact: true })
      .click();
    const popup = await popupPromise;
    await popup.waitForURL("https://www.google.com/maps/**");
    const route = new URL(popup.url());
    assert.equal(
      route.searchParams.get("destination"),
      "Rua da Praça, 10 & Anexo, Recife, PE, Brasil",
    );
    assert.equal(route.searchParams.has("origin"), false);
    await popup.close();
    await page
      .getByRole("button", { name: "Salvar nos favoritos", exact: true })
      .click();
    await page.getByRole("alert").waitFor();
    assert.equal(favorites.has(id), false);
    assert.equal(
      await page
        .getByRole("button", { name: "Remover dos favoritos", exact: true })
        .count(),
      0,
    );
    failFavorite = false;
    await page
      .getByRole("button", { name: "Salvar nos favoritos", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Remover dos favoritos", exact: true })
      .waitFor();
    assert.equal(favoriteWrites, 2);
    await page.reload();
    await page
      .getByRole("button", { name: "Remover dos favoritos", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Remover dos favoritos", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Salvar nos favoritos", exact: true })
      .waitFor();
    assert.equal(favorites.has(id), false);
    await page.getByRole("tab", { name: "Avaliações", exact: true }).click();
    await page
      .getByRole("textbox", { name: "Conte sua experiência", exact: true })
      .fill("Uma experiência para lembrar.");
    assert.equal(
      await page
        .getByRole("button", {
          name: "Enviar avaliação para revisão",
          exact: true,
        })
        .isDisabled(),
      true,
    );
    await page.getByRole("button", { name: "4 estrelas", exact: true }).click();
    await page.getByRole("tab", { name: "Sala", exact: true }).click();
    await page
      .getByRole("textbox", { name: "Mensagem pública", exact: true })
      .fill("Tem fila hoje?");
    await page.getByRole("tab", { name: "Avaliações", exact: true }).click();
    assert.equal(
      await page
        .getByRole("textbox", { name: "Conte sua experiência", exact: true })
        .inputValue(),
      "Uma experiência para lembrar.",
    );
    assert.equal(
      await page
        .getByRole("button", { name: "4 estrelas", exact: true })
        .getAttribute("aria-pressed"),
      "true",
    );
    await page
      .getByRole("button", {
        name: "Enviar avaliação para revisão",
        exact: true,
      })
      .click();
    await page
      .getByText("Contribuição recebida para análise.", { exact: false })
      .waitFor();
    assert.equal(reviewWrites, 1);
    assert.equal(review.moderation_state, "pending");
    await page.getByRole("tab", { name: "Sala", exact: true }).click();
    assert.equal(
      await page
        .getByRole("textbox", { name: "Mensagem pública", exact: true })
        .inputValue(),
      "Tem fila hoje?",
    );
    const guest = await setup(false),
      visitor = await guest.newPage();
    visitor.on("pageerror", (error) => errors.push(error.message));
    await visitor.goto(`${base}/place/${id}`);
    await visitor
      .getByRole("heading", { name: place.name, exact: true })
      .waitFor();
    await visitor.getByRole("tab", { name: "Avaliações", exact: true }).click();
    await visitor
      .getByText("Ainda não há avaliações aprovadas.", { exact: false })
      .waitFor();
    assert.equal(
      await visitor
        .getByText("Uma experiência para lembrar.", { exact: true })
        .count(),
      0,
    );
    await visitor
      .getByRole("button", { name: "Salvar nos favoritos", exact: true })
      .click();
    await visitor
      .getByRole("heading", { name: "Que bom ter você aqui.", exact: true })
      .waitFor();
    await visitor
      .getByRole("textbox", { name: "E-mail", exact: true })
      .fill("pessoa@example.com");
    await visitor.getByLabel("Senha", { exact: true }).fill("FixturePass123!");
    await visitor.getByRole("button", { name: "Entrar", exact: true }).click();
    await visitor
      .getByRole("tab", { name: "Avaliações", exact: true })
      .waitFor();
    await visitor
      .getByRole("textbox", { name: "Conte sua experiência", exact: true })
      .waitFor();
    assert.equal(
      await visitor
        .getByRole("tab", { name: "Avaliações", exact: true })
        .getAttribute("aria-selected"),
      "true",
    );
    await visitor.goto(`${base}/place/22000000-0000-0000-0000-000000000002`);
    await visitor
      .getByText("Este lugar não está disponível agora.", { exact: false })
      .waitFor();
    assert.equal(
      await visitor
        .getByRole("button", { name: "Como chegar", exact: true })
        .count(),
      0,
    );
    place.moderation_state = "pending";
    place.verification_status = "pending";
    await visitor.goto(`${base}/profile`);
    await visitor
      .getByRole("button", { name: "Lugares que compartilhei", exact: false })
      .click();
    await visitor
      .getByRole("button", { name: `Abrir ${place.name}`, exact: true })
      .click();
    await visitor
      .getByText("Avaliações após a aprovação do lugar", { exact: true })
      .waitFor();
    await visitor.getByRole("tab", { name: "Avaliações", exact: true }).click();
    assert.equal(
      await visitor
        .getByRole("textbox", { name: "Conte sua experiência", exact: true })
        .count(),
      0,
    );
    await guest.close();
    await context.close();
    assert.deepEqual(errors, []);
    console.log(
      "PASS detail journey: discovery to gallery, photo enlargement, directions, favorite failure/save/reload/remove, explicit stars, persistent drafts, pending review visibility and login return; fixtures only, zero JS errors.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
