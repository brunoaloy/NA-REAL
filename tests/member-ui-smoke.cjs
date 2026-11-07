// Signed-in UX regression. All Supabase requests use intercepted fixtures; no remote writes.
const { chromium } = require("@playwright/test");
const assert = require("node:assert/strict");
const fs = require("node:fs"),
  path = require("node:path");
const { readEnvironment } = require("../scripts/setup-mobile.cjs");
(async () => {
  const env = readEnvironment(process.cwd());
  assert(env.EXPO_PUBLIC_SUPABASE_URL);
  const host = new URL(env.EXPO_PUBLIC_SUPABASE_URL).hostname;
  const base = process.env.SMOKE_URL || "http://127.0.0.1:8769";
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    const uid = "90000000-0000-0000-0000-000000000001";
    let profile = {
      id: uid,
      display_name: "Bruno",
      handle: "bruno",
      bio: "Adoro descobrir cafés.",
      moderation_state: "approved",
    };
    let profileWrites = 0,
      photoWrites = 0,
      uploads = 0,
      placeWrites = 0,
      duplicateChecks = 0,
      photoRows = [];
    let failPhoto = false;
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
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
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
    await context.routeWebSocket(`wss://${host}/**`, (socket) =>
      socket.close(),
    );
    const fixtureImage = await browser.newPage({
      viewport: { width: 40, height: 40 },
    });
    await fixtureImage.setContent(
      '<body style="margin:0;background:#0F766E"></body>',
    );
    const jpeg = await fixtureImage.screenshot({ type: "jpeg" });
    await fixtureImage.close();
    await context.route(`https://${host}/**`, async (route) => {
      const request = route.request(),
        url = new URL(request.url()),
        method = request.method();
      let data = [];
      if (url.pathname === "/auth/v1/user")
        data = { id: uid, aud: "authenticated", role: "authenticated" };
      else if (url.pathname === "/rest/v1/profiles") {
        if (method === "GET") data = profile;
        else {
          assert(["PATCH", "POST"].includes(method));
          const value = request.postDataJSON();
          assert.equal(value.handle, method === "POST" ? null : "bruno");
          profileWrites++;
          profile = { ...profile, ...value, moderation_state: "pending" };
          data = profile;
        }
      } else if (url.pathname === "/rest/v1/photos") {
        if (method === "POST") {
          photoWrites++;
          const photoRow = {
            ...request.postDataJSON(),
            id:
              "70000000-0000-0000-0000-" +
              String(photoWrites).padStart(12, "0"),
            content_revision: "fixture-revision",
            sanitized_at: null,
            moderation_state: "pending",
          };
          photoRows.unshift(photoRow);
          data = { id: photoRow.id };
        } else if (method === "DELETE") {
          const removed = url.searchParams.get("id")?.replace(/^eq\./, "");
          photoRows = photoRows.filter((row) => row.id !== removed);
          data = [];
        } else
          data = url.searchParams.has("profile_id")
            ? (photoRows[0] ?? null)
            : photoRows;
      } else if (
        url.pathname.startsWith("/storage/v1/object/sign/") &&
        method === "POST"
      )
        data = {
          signedURL: "/object/sign/community-photos/fixture.jpg?token=fixture",
        };
      else if (
        url.pathname.startsWith("/storage/v1/object/sign/") &&
        method === "GET"
      ) {
        await route.fulfill({ contentType: "image/jpeg", body: jpeg });
        return;
      } else if (
        url.pathname.startsWith("/storage/v1/object/community-photos/") &&
        method === "POST"
      ) {
        uploads++;
        if (failPhoto) {
          await route.fulfill({
            status: 503,
            json: { error: "fixture upload unavailable" },
          });
          return;
        }
        data = { Key: "fixture", Id: "70000000-0000-0000-0000-000000000001" };
      } else if (url.pathname === "/rest/v1/places" && method === "POST") {
        placeWrites++;
        const value = request.postDataJSON();
        assert.equal("latitude" in value, false);
        assert.equal("longitude" in value, false);
        data = { id: "11000000-0000-0000-0000-000000000001" };
      } else if (url.pathname === "/rest/v1/rpc/duplicate_candidates") {
        duplicateChecks++;
        data = [];
      } else if (
        method !== "GET" &&
        !url.pathname.startsWith("/rest/v1/rpc/search_places")
      )
        throw new Error("Unexpected operation blocked");
      await route.fulfill({ json: data });
    });
    const page = await context.newPage(),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base);
    await page
      .getByRole("button", { name: "Explorar como visitante", exact: true })
      .click();
    await page.getByRole("tab", { name: /Perfil/ }).click();
    await page.getByRole("heading", { name: "Bruno", exact: true }).waitFor();
    assert.equal(
      await page
        .getByRole("textbox", { name: "Seu nome", exact: true })
        .count(),
      0,
    );
    if (process.env.UI_SCREENSHOT_DIR) {
      fs.mkdirSync(process.env.UI_SCREENSHOT_DIR, { recursive: true });
      await page.screenshot({
        path: path.join(process.env.UI_SCREENSHOT_DIR, "profile.png"),
        fullPage: true,
      });
    }
    await page
      .getByRole("button", { name: "Editar perfil", exact: true })
      .click();
    assert.equal(
      await page
        .getByRole("textbox", { name: "Seu nome", exact: true })
        .inputValue(),
      "Bruno",
    );
    assert.equal(
      await page
        .getByRole("textbox", { name: "Sobre você", exact: true })
        .inputValue(),
      "Adoro descobrir cafés.",
    );
    await page
      .getByRole("textbox", { name: "Seu nome", exact: true })
      .fill("Bruno atualizado");
    await page
      .getByRole("textbox", { name: "Sobre você", exact: true })
      .fill("Gosto de lugares especiais.");
    const choosing = page.waitForEvent("filechooser");
    await page
      .getByRole("button", { name: "Escolher foto", exact: true })
      .click();
    const chooser = await choosing;
    await chooser.setFiles({
      name: "avatar.jpg",
      mimeType: "image/jpeg",
      buffer: jpeg,
    });
    await page
      .getByRole("img", { name: "Prévia da sua foto", exact: true })
      .waitFor();
    assert.equal(profileWrites, 0);
    assert.equal(photoWrites, 0);
    assert.equal(uploads, 0);
    if (process.env.UI_SCREENSHOT_DIR)
      await page.screenshot({
        path: path.join(process.env.UI_SCREENSHOT_DIR, "edit-profile.png"),
        fullPage: true,
      });
    await page
      .getByRole("button", { name: "Salvar alterações", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Bruno atualizado", exact: true })
      .waitFor();
    await page
      .getByText("Pronto! Seu perfil foi salvo.", { exact: false })
      .waitFor();
    assert.equal(profileWrites, 1);
    assert.equal(photoWrites, 1);
    assert.equal(uploads, 1);
    await page
      .getByRole("button", { name: "Editar perfil", exact: true })
      .click();
    await page
      .getByRole("textbox", { name: "Seu nome", exact: true })
      .fill("Bruno com foto pendente");
    const choosingAgain = page.waitForEvent("filechooser");
    await page
      .getByRole("button", { name: "Escolher foto", exact: true })
      .click();
    await (
      await choosingAgain
    ).setFiles({ name: "avatar.jpg", mimeType: "image/jpeg", buffer: jpeg });
    await page
      .getByRole("img", { name: "Prévia da sua foto", exact: true })
      .waitFor();
    failPhoto = true;
    await page
      .getByRole("button", { name: "Salvar alterações", exact: true })
      .click();
    await page
      .getByRole("alert")
      .filter({ hasText: "Seu nome e sua descrição foram salvos" })
      .waitFor();
    await page
      .getByRole("img", { name: "Prévia da sua foto", exact: true })
      .waitFor();
    assert.equal(profile.display_name, "Bruno com foto pendente");
    assert.equal(
      photoRows.length,
      1,
      "A failed photo must not remove the previous successful upload",
    );
    await page.getByRole("button", { name: "Voltar", exact: true }).click();
    await page.getByRole("tab", { name: /Adicionar/ }).click();
    await page
      .getByRole("textbox", { name: "Nome do lugar", exact: true })
      .fill("Cantinho de teste");
    await page
      .getByRole("textbox", { name: "Cidade", exact: true })
      .fill("Recife");
    await page.getByRole("textbox", { name: "UF", exact: true }).fill("PE");
    await page
      .getByRole("textbox", { name: "Endereço público", exact: true })
      .fill("Rua da Praça, 10");
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
    assert.equal(duplicateChecks, 0);
    assert.equal(placeWrites, 0);
    if (process.env.UI_SCREENSHOT_DIR)
      await page.screenshot({
        path: path.join(process.env.UI_SCREENSHOT_DIR, "add-place.png"),
        fullPage: true,
      });
    await page
      .getByRole("button", { name: "Encontrar pelo endereço", exact: true })
      .click();
    await page
      .getByRole("alert")
      .filter({ hasText: "no aplicativo do celular" })
      .waitFor();
    assert.equal(duplicateChecks, 0);
    assert.equal(placeWrites, 0);
    profile = null;
    photoRows = [];
    await page.goto(base);
    await page
      .getByRole("button", { name: "Explorar como visitante", exact: true })
      .click();
    await page.getByRole("tab", { name: /Perfil/ }).click();
    await page
      .getByRole("button", { name: "Editar perfil", exact: true })
      .click();
    await page
      .getByRole("textbox", { name: "Seu nome", exact: true })
      .fill("Nova pessoa");
    await page
      .getByRole("button", { name: "Salvar alterações", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Nova pessoa", exact: true })
      .waitFor();
    assert.equal(
      profile.handle,
      null,
      "A first profile does not require a technical identifier",
    );
    assert.equal(profile.bio, "");
    assert.deepEqual(errors, []);
    console.log(
      "PASS member UX: simple prefilled profile, deferred photo upload, save and partial photo failure, preserved handle, no coordinate inputs, manual-geocoder fallback; fixtures only, zero JS errors.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
