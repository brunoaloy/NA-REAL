// Exploration QA uses intercepted fixtures only; never writes to the remote database.
const { chromium } = require("@playwright/test");
const assert = require("node:assert/strict");
const { readEnvironment } = require("../scripts/setup-mobile.cjs");
(async () => {
  const env = readEnvironment(process.cwd());
  assert(
    env.EXPO_PUBLIC_SUPABASE_URL,
    "Export with public Supabase config before this test.",
  );
  const host = new URL(env.EXPO_PUBLIC_SUPABASE_URL).hostname;
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const queries = [];
    let fail = true;
    await context.routeWebSocket(`wss://${host}/**`, (socket) =>
      socket.close(),
    );
    await context.route(`https://${host}/**`, async (route) => {
      const request = route.request(),
        url = new URL(request.url());
      if (url.pathname === "/rest/v1/rpc/search_places") {
        const args = request.postDataJSON();
        queries.push(args);
        if (args.term === "Erro" && fail) {
          await route.fulfill({
            status: 503,
            json: { message: "fixture unavailable" },
          });
          return;
        }
        const rows =
          args.term === "Café"
            ? [
                {
                  id: "11000000-0000-0000-0000-000000000001",
                  name: "Café de teste",
                  category: "Comer",
                  city: "Recife",
                  state: "PE",
                  address: "Endereço de teste",
                  latitude: -8.05,
                  longitude: -34.88,
                  rating: null,
                  review_count: 0,
                },
              ]
            : [];
        await route.fulfill({ json: rows });
        return;
      }
      assert.equal(
        request.method(),
        "GET",
        "Unexpected remote operation blocked",
      );
      await route.fulfill({ json: [] });
    });
    const page = await context.newPage(),
      errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(process.env.SMOKE_URL || "http://127.0.0.1:8767");
    await page.getByRole("button", { name: "Explorar como visitante" }).click();
    await page
      .getByRole("heading", { name: "A próxima descoberta pode ser sua." })
      .waitFor();
    if (process.env.UI_SCREENSHOT_PATH)
      await page.screenshot({
        path: process.env.UI_SCREENSHOT_PATH,
        fullPage: true,
      });
    await page.getByRole("button", { name: "Filtros avançados" }).click();
    const before = queries.length;
    await page
      .getByRole("textbox", { name: "Cidade", exact: true })
      .fill("Recife");
    await page.getByRole("textbox", { name: "UF", exact: true }).fill("XX");
    await page.getByRole("button", { name: "Aplicar filtros" }).click();
    await page.getByRole("alert").filter({ hasText: "UF válida" }).waitFor();
    assert.equal(
      queries.length,
      before,
      "Draft/invalid filters must not query the server",
    );
    await page.getByRole("textbox", { name: "UF", exact: true }).fill("pe");
    await page.getByRole("button", { name: "Aplicar filtros" }).click();
    await page
      .getByRole("heading", { name: "Nenhum lugar encontrado." })
      .waitFor();
    assert(
      queries.some(
        (q) => q.city_filter === "Recife" && q.state_filter === "PE",
      ),
    );
    const search = page.getByRole("textbox", {
      name: "Buscar lugares ou cidades",
      exact: true,
    });
    await search.fill("Café");
    await page.getByRole("button", { name: "Buscar", exact: true }).click();
    await page
      .getByRole("button", { name: "Abrir Café de teste", exact: true })
      .waitFor();
    await page.getByRole("button", { name: "Comer", exact: true }).click();
    await page
      .getByRole("button", { name: "Abrir Café de teste", exact: true })
      .waitFor();
    await page.getByRole("button", { name: "Mapa", exact: true }).click();
    await page
      .getByRole("textbox", { name: "Buscar nome ou cidade", exact: true })
      .waitFor();
    assert.equal(
      await page
        .getByRole("textbox", { name: "Buscar nome ou cidade", exact: true })
        .inputValue(),
      "Café",
    );
    await page.getByText("Região: Recife, PE", { exact: true }).waitFor();
    const params = new URL(page.url()).searchParams;
    assert.equal(params.get("category"), "Comer");
    assert.equal(params.get("city"), "Recife");
    assert.equal(params.get("state"), "PE");
    await page
      .getByRole("button", { name: "Voltar à lista", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Limpar busca e filtros", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "A próxima descoberta pode ser sua." })
      .waitFor();
    assert.equal(await search.inputValue(), "");
    const refreshed = page.waitForRequest(
      (request) =>
        request.url().includes("/rpc/search_places") &&
        request.postDataJSON().term === "",
    );
    await page
      .getByRole("button", { name: "Atualizar lugares", exact: true })
      .click();
    await refreshed;
    await search.fill("Erro");
    await page.getByRole("button", { name: "Buscar", exact: true }).click();
    await page
      .getByRole("button", { name: "Tentar novamente", exact: true })
      .waitFor();
    fail = false;
    await page
      .getByRole("button", { name: "Tentar novamente", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Nenhum lugar encontrado." })
      .waitFor();
    await page
      .getByRole("button", { name: "Limpar texto da busca", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "A próxima descoberta pode ser sua." })
      .waitFor();
    await page
      .getByRole("button", { name: "Adicionar lugar", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Entrar para adicionar lugar", exact: true })
      .waitFor();
    assert.deepEqual(errors, []);
    console.log(
      "PASS explore: empty catalog, draft filters, invalid UF, apply, search, list/map continuity, clear, refresh, retry and protected add; zero JS errors; fixtures only.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
