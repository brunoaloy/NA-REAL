// Visual/navigation QA with intercepted fixtures. No remote writes or third-party map tiles.
const { chromium } = require("@playwright/test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { readEnvironment } = require("../scripts/setup-mobile.cjs");
(async () => {
  const base = process.env.SMOKE_URL || "http://127.0.0.1:8771";
  const host = new URL(readEnvironment(process.cwd()).EXPO_PUBLIC_SUPABASE_URL)
    .hostname;
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox", "--enable-unsafe-swiftshader"],
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const id = "11000000-0000-0000-0000-000000000001";
    const place = {
      id,
      name: "Café da Praça",
      category: "Comer",
      city: "Recife",
      state: "PE",
      address: "Praça do Bairro, 12",
      rating: 4.8,
      review_count: 12,
      latitude: -8.05,
      longitude: -34.88,
      moderation_state: "approved",
      verification_status: "approved",
    };
    let broken = false,
      photo = true;
    const queries = [],
      errors = [];
    const fixture = await browser.newPage({
      viewport: { width: 400, height: 200 },
    });
    await fixture.setContent(
      '<body style="margin:0;background:#afcdb9"><div style="width:100%;height:100px;background:#4c7766"></div></body>',
    );
    const jpeg = await fixture.screenshot({ type: "jpeg" });
    await fixture.close();
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
    await context.route(base + "/place/**", (r) =>
      r.fulfill({ path: "dist/index.html", contentType: "text/html" }),
    );
    await context.route(`https://${host}/**`, async (r) => {
      const req = r.request(),
        u = new URL(req.url());
      let data = [];
      if (u.pathname === "/rest/v1/rpc/search_places") {
        queries.push(req.postDataJSON());
        data = [place];
      } else if (u.pathname === "/rest/v1/photos")
        data = photo
          ? [
              {
                id: "photo",
                owner_id: "owner",
                content_revision: "revision",
                object_path: "owner/photo.jpg",
              },
            ]
          : [];
      else if (
        u.pathname.startsWith("/storage/v1/object/sign/") &&
        req.method() === "POST"
      )
        data = {
          signedURL: "/object/sign/reviewed-photos/fixture.jpg?token=fixture",
        };
      else if (
        u.pathname.startsWith("/storage/v1/object/sign/") &&
        req.method() === "GET"
      ) {
        await r.fulfill(
          broken
            ? { status: 503, body: "Unavailable" }
            : { body: jpeg, contentType: "image/jpeg" },
        );
        return;
      } else if (u.pathname === "/rest/v1/places") data = place;
      else if (u.pathname === "/rest/v1/place_ratings")
        data = { rating: 4.8, review_count: 12 };
      else assert.equal(req.method(), "GET", "Unexpected write blocked");
      await r.fulfill({ json: data });
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));

    const capture = async (name) => {
      if (process.env.UI_SCREENSHOT_DIR) {
        fs.mkdirSync(process.env.UI_SCREENSHOT_DIR, { recursive: true });
        await page.screenshot({
          path: `${process.env.UI_SCREENSHOT_DIR}/${name}.png`,
          fullPage: true,
        });
      }
    };
    const fits = async () =>
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        "Horizontal overflow",
      );
    await page.goto(base);
    await page
      .getByRole("button", { name: "Explorar como visitante", exact: true })
      .click();
    await page
      .getByRole("heading", {
        name: "O que vamos descobrir hoje?",
        exact: true,
      })
      .waitFor();
    const card = page.getByRole("button", {
      name: "Abrir " + place.name,
      exact: true,
    });
    await card.waitFor();
    const image = card.getByRole("img", {
      name: "Foto comunitária aprovada",
      exact: true,
    });
    await image.waitFor();
    const size = await image.boundingBox();
    assert(
      size.width > 300 && size.height >= 160,
      "Discovery card should feature a wide photo",
    );
    await fits();
    await capture("explore");
    await page
      .getByRole("button", { name: "Escolher cidade", exact: true })
      .click();
    await page
      .getByRole("textbox", { name: "Cidade", exact: true })
      .fill("Recife");
    await page.getByRole("textbox", { name: "UF", exact: true }).fill("PE");
    await page
      .getByRole("button", { name: "Explorar cidade", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Voltar à lista", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Escolher cidade", exact: true })
      .getByText("Recife, PE", { exact: true })
      .waitFor();
    assert(
      queries.some(
        (q) => q.city_filter === "Recife" && q.state_filter === "PE",
      ),
    );
    await page.setViewportSize({ width: 320, height: 568 });
    await fits();
    await capture("explore-small");
    photo = false;
    await page.goto(base);
    await page
      .getByRole("button", { name: "Explorar como visitante", exact: true })
      .click();
    await card
      .getByText("Cada lugar tem uma história", { exact: true })
      .waitFor();
    await fits();
    photo = true;
    broken = true;
    await page.goto(base);
    await page
      .getByRole("button", { name: "Explorar como visitante", exact: true })
      .click();
    await card.getByText("Foto indisponível", { exact: true }).waitFor();
    await fits();
    broken = false;
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base + "/map?latitude=-8.05&longitude=-34.88");
    const canvas = page.locator(
      '[aria-label="Mapa interativo de lugares"] canvas:visible',
    );
    await canvas.waitFor();
    // Wait for the community source to render at the seeded center, then select its real canvas point.
    await page.waitForFunction(
      () =>
        document.querySelector(".maplibregl-canvas")?.getAttribute("width") > 0,
    );
    let selected = false;
    for (let i = 0; i < 12 && !selected; i++) {
      const box = await canvas.boundingBox();
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
      try {
        await page
          .getByRole("button", { name: "Conhecer " + place.name, exact: true })
          .waitFor({ timeout: 800 });
        selected = true;
      } catch {}
    }
    if (!selected) await capture("map-failure");
    assert(selected, "Clicking a community map pin must open its preview");
    const previewAction = await page
      .getByRole("button", { name: "Conhecer " + place.name, exact: true })
      .boundingBox();
    const mapBox = await canvas.boundingBox();
    assert(
      previewAction &&
        previewAction.y + previewAction.height <= mapBox.y + mapBox.height - 20,
      "Preview must leave the bottom attribution visible",
    );
    assert(
      previewAction.y + previewAction.height <= 844,
      "Preview action should be visible on a regular phone without scrolling",
    );
    await fits();
    await capture("map-preview");
    await page
      .getByRole("button", { name: "Fechar prévia do lugar", exact: true })
      .click();
    assert.equal(
      await page
        .getByRole("button", { name: "Conhecer " + place.name, exact: true })
        .count(),
      0,
    );
    const box = await canvas.boundingBox();
    await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
    await page
      .getByRole("button", { name: "Conhecer " + place.name, exact: true })
      .click();
    await page
      .getByRole("heading", { name: place.name, exact: true })
      .waitFor();
    assert(new URL(page.url()).pathname.endsWith("/place/" + id));
    assert.deepEqual(errors, []);
    console.log(
      "PASS design: city selection, wide approved photo, no-photo illustration, broken-photo fallback, 320px layout, real WebGL pin selection/preview/close/detail; fixtures only, zero JS errors.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
