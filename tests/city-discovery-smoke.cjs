// City discovery QA: all Supabase/map style responses are intercepted; no real writes.
const { chromium } = require("@playwright/test"),
  assert = require("node:assert/strict");
const { readEnvironment } = require("../scripts/setup-mobile.cjs");
(async () => {
  const base = process.env.SMOKE_URL || "http://127.0.0.1:8774",
    host = new URL(readEnvironment(process.cwd()).EXPO_PUBLIC_SUPABASE_URL)
      .hostname;
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox", "--enable-unsafe-swiftshader"],
  });
  try {
    const uid = "90000000-0000-0000-0000-000000000001",
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
    const rows = Array.from({ length: 51 }, (_, i) => ({
      id: "11000000-0000-0000-0000-" + String(i + 1).padStart(12, "0"),
      name: "Lugar da comunidade " + (i + 1),
      category: "Comer",
      city: "Osório",
      state: "RS",
      address: "Rua de exemplo, " + (i + 1),
      rating: null,
      review_count: 0,
      latitude: i === 0 ? -29.8881 : null,
      longitude: i === 0 ? -50.2691 : null,
    }));
    const queries = [],
      errors = [];
    let writes = 0;
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
    await context.route("**/*map-style.json", (r) =>
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
    await context.route(base + "/map?**", (r) =>
      r.fulfill({ path: "dist/index.html", contentType: "text/html" }),
    );
    await context.route(`https://${host}/**`, async (r) => {
      const req = r.request(),
        u = new URL(req.url());
      let data = [];
      if (u.pathname === "/auth/v1/user") data = user;
      else if (u.pathname === "/rest/v1/rpc/safe_is_admin") data = false;
      else if (u.pathname === "/rest/v1/rpc/search_places") {
        const q = req.postDataJSON();
        queries.push(q);
        if (q.city_filter === "Osório" && !q.term)
          data = rows.slice(q.page_number * 50, (q.page_number + 1) * 50);
      } else if (u.pathname === "/rest/v1/rpc/duplicate_candidates") data = [];
      else if (u.pathname === "/rest/v1/places" && req.method() === "POST") {
        writes++;
        const value = req.postDataJSON();
        assert.equal(value.city, "São Paulo");
        assert.equal(value.state, "SP");
        assert.equal(value.name, "Novo café");
        assert.equal(
          "geom" in value,
          false,
          "Neither city centers nor the discarded old pin may be submitted",
        );
        data = { id: newId };
      } else assert.equal(req.method(), "GET", "Unexpected operation blocked");
      await r.fulfill({ json: data });
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    const b = (name) => page.getByRole("button", { name, exact: true }),
      f = (name) => page.getByRole("textbox", { name, exact: true });
    const choose = async (name, uf) => {
      await f("Cidade").fill(name);
      await f("UF").fill(uf);
      await b("Usar " + name + ", " + uf).click();
      await b("Explorar cidade").click();
    };
    await page.goto(base);
    await b("Explorar como visitante").click();
    await b("Escolher cidade").click();
    await b("Explorar cidade").click();
    await page.getByRole("alert").filter({ hasText: "UF válida" }).waitFor();
    const before = queries.length;
    await f("Cidade").fill("Osório");
    await f("UF").fill("RS");
    await b("Usar Osório, RS").click();
    assert.equal(
      queries.length,
      before,
      "City suggestions do not query a remote directory",
    );
    await b("Explorar cidade").click();
    await page
      .getByRole("heading", { name: "Sua cidade no mapa", exact: true })
      .waitFor();
    assert.equal(new URL(page.url()).searchParams.get("scope"), "city");
    await page.getByText("Região: Osório, RS", { exact: true }).waitFor();
    await b("Ver lista de lugares NA REAL").click();
    await b("Abrir Lugar da comunidade 50").waitFor();
    await b("Carregar mais nesta cidade").click();
    await b("Abrir Lugar da comunidade 51").waitFor();
    const scoped = queries.filter((q) => q.city_filter === "Osório");
    assert(
      scoped.length > 0 &&
        scoped.every(
          (q) =>
            q.west === -74 &&
            q.south === -34 &&
            q.east === -34 &&
            q.north === 6,
        ),
      "City catalog must not exclude records outside the current map viewport",
    );
    assert(scoped.some((q) => q.page_number === 1));
    await b("Cadastrar lugar nesta cidade").click();
    if (await b("Começar cadastro desta busca").count())
      await b("Começar cadastro desta busca").click();
    await f("Nome do lugar").fill("Rascunho antigo");
    await b("Continuar").click();
    assert.equal(await f("Cidade").inputValue(), "Osório");
    assert.equal(await f("UF").inputValue(), "RS");
    await f("Endereço público").fill("Rua anterior, 10");
    await b("Marcar entrada no mapa").click();
    const canvas = page.locator(
      '[aria-label="Mapa interativo de lugares"] canvas:visible',
    );
    await canvas.waitFor();
    const box = await canvas.boundingBox();
    await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
    await b("Usar este local").click();
    await page.getByText("Entrada marcada.", { exact: false }).waitFor();
    await page.getByRole("tab", { name: /Explorar/ }).click();
    await b("Explorar locais da cidade no mapa").click();
    await b("Escolher cidade no mapa").click();
    await f("UF").fill("");
    await choose("São Paulo", "SP");
    await page.getByText("Região: São Paulo, SP", { exact: true }).waitFor();
    await b("Cadastrar lugar nesta cidade").click();
    await page
      .getByRole("heading", {
        name: "Recebemos os dados da sua busca.",
        exact: true,
      })
      .waitFor();
    await b("Continuar meu cadastro anterior").click();
    assert.equal(await f("Cidade").inputValue(), "Osório");
    assert.equal(await f("Endereço público").inputValue(), "Rua anterior, 10");
    await page.getByText("Entrada marcada.", { exact: false }).waitFor();
    await page.getByRole("tab", { name: /Explorar/ }).click();
    await page
      .getByRole("button", { name: "Escolher cidade", exact: true })
      .getByText("São Paulo, SP", { exact: true })
      .waitFor();
    await f("Buscar lugares ou cidades").fill("Novo café");
    await b("Buscar").click();
    await b("Adicionar lugar").click();
    await b("Começar cadastro desta busca").click();
    assert.equal(await f("Nome do lugar").inputValue(), "Novo café");
    await b("Continuar").click();
    assert.equal(await f("Cidade").inputValue(), "São Paulo");
    assert.equal(await f("UF").inputValue(), "SP");
    assert.equal(await f("Endereço público").inputValue(), "");
    await page.setViewportSize({ width: 320, height: 568 });
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await f("Endereço público").fill("Avenida de exemplo, 20");
    await b("Continuar").click();
    await b("Continuar sem foto").click();
    await page
      .getByRole("switch", { name: "Confirmo que é estabelecimento público" })
      .check();
    await b("Enviar para revisão").click();
    await b("Acompanhar aprovação").waitFor();
    assert.equal(writes, 1);
    assert.deepEqual(errors, []);
    console.log(
      "PASS city discovery: offline picker, in-app city map, whole-city paginated community list, missing-place registration, city/UF/name prefill, preserved draft/pin, explicit replacement and no stale geometry; fixtures only, zero JS errors.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
