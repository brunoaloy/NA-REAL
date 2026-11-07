// Auth/API responses are intercepted. This test never creates accounts or sends real email.
const { chromium } = require("@playwright/test");
const assert = require("node:assert/strict");
const fs = require("node:fs"),
  path = require("node:path");
const { readEnvironment } = require("../scripts/setup-mobile.cjs");
(async () => {
  const env = readEnvironment(process.cwd());
  assert(
    env.EXPO_PUBLIC_SUPABASE_URL,
    "Export with public Supabase config first.",
  );
  const host = new URL(env.EXPO_PUBLIC_SUPABASE_URL).hostname;
  const base = process.env.SMOKE_URL || "http://127.0.0.1:8768";
  const shots = process.env.UI_SCREENSHOT_DIR;
  if (shots) fs.mkdirSync(shots, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    let signup = 0,
      login = 0,
      recovery = 0;
    await context.routeWebSocket(`wss://${host}/**`, (socket) =>
      socket.close(),
    );
    await context.route(`https://${host}/**`, async (route) => {
      const request = route.request(),
        u = new URL(request.url());
      let data = [];
      if (u.pathname === "/auth/v1/signup") {
        signup++;
        const input = request.postDataJSON();
        assert.equal(input.email, "pessoa@example.com");
        assert.equal(input.password, "FixturePass123!");
        assert(u.searchParams.get("redirect_to").includes("auth-callback"));
        data = {
          user: {
            id: "90000000-0000-0000-0000-000000000001",
            aud: "authenticated",
            email: input.email,
            identities: [],
          },
          session: null,
        };
      } else if (u.pathname === "/auth/v1/recover") {
        recovery++;
        assert.equal(request.postDataJSON().email, "pessoa@example.com");
        assert(u.searchParams.get("redirect_to").includes("recovery"));
        data = {};
      } else if (u.pathname === "/auth/v1/token") {
        login++;
        if (request.postDataJSON().email === "erro@example.com") {
          await route.fulfill({
            status: 400,
            json: {
              error_code: "invalid_credentials",
              msg: "Invalid login credentials",
            },
          });
          return;
        }
        const uid = "90000000-0000-0000-0000-000000000001";
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
        data = {
          access_token: jwt,
          refresh_token: "fixture",
          token_type: "bearer",
          expires_in: 3600,
          user: {
            id: uid,
            aud: "authenticated",
            role: "authenticated",
            email: "pessoa@example.com",
          },
        };
      } else if (u.pathname === "/auth/v1/user")
        data = {
          id: "90000000-0000-0000-0000-000000000001",
          aud: "authenticated",
          role: "authenticated",
        };
      else if (
        request.method() !== "GET" &&
        u.pathname !== "/rest/v1/rpc/search_places"
      )
        throw new Error("Unexpected remote operation blocked");
      await route.fulfill({ json: data });
    });
    const page = await context.newPage(),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const screenshot = async (name) => {
      if (shots)
        await page.screenshot({
          path: path.join(shots, name + ".png"),
          fullPage: true,
        });
    };
    await page.goto(base);
    await page.getByRole("button", { name: "Começar", exact: true }).waitFor();
    await screenshot("welcome");
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await page
      .getByRole("heading", { name: "Que bom ter você aqui.", exact: true })
      .waitFor();
    await screenshot("login");
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await page
      .getByRole("alert")
      .filter({ hasText: "e-mail válido" })
      .waitFor();
    assert.equal(login, 0);
    await page
      .getByRole("textbox", { name: "E-mail", exact: true })
      .fill("erro@example.com");
    await page.getByLabel("Senha", { exact: true }).fill("FixturePass123!");
    await page
      .getByRole("button", { name: "Mostrar senha", exact: true })
      .click();
    assert.equal(
      await page
        .getByLabel("Senha", { exact: true })
        .evaluate((input) => input.type),
      "text",
    );
    await page
      .getByRole("button", { name: "Ocultar senha", exact: true })
      .click();
    assert.equal(
      await page
        .getByLabel("Senha", { exact: true })
        .evaluate((input) => input.type),
      "password",
    );
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await page
      .getByRole("alert")
      .filter({ hasText: "E-mail ou senha incorretos." })
      .waitFor();
    assert.equal(login, 1);
    await page
      .getByRole("button", { name: "Criar conta", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Seu olhar faz a diferença.", exact: true })
      .waitFor();
    await screenshot("signup");
    await page
      .getByRole("textbox", { name: "E-mail", exact: true })
      .fill(" pessoa@example.com ");
    await page.getByLabel("Senha", { exact: true }).fill("FixturePass123!");
    await page.getByLabel("Confirmar senha", { exact: true }).fill("different");
    await page
      .getByRole("button", { name: "Criar minha conta", exact: true })
      .click();
    await page
      .getByRole("alert")
      .filter({ hasText: "As senhas não conferem." })
      .waitFor();
    assert.equal(signup, 0);
    await page
      .getByRole("link", { name: "Termos de Uso", exact: true })
      .click();
    await page
      .getByText("Versão preliminar para desenvolvimento.", { exact: false })
      .waitFor();
    await page.getByRole("button", { name: "Voltar", exact: true }).click();
    await page
      .getByLabel("Confirmar senha", { exact: true })
      .fill("FixturePass123!");
    await page
      .getByRole("button", { name: "Criar minha conta", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Confira seu e-mail.", exact: true })
      .waitFor();
    assert.equal(signup, 1);
    assert.equal(
      await page.locator('input[aria-label="Senha"]:visible').count(),
      0,
    );
    await page
      .getByRole("button", { name: "Já confirmei, entrar", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Esqueci minha senha", exact: true })
      .click();
    await page
      .getByRole("heading", {
        name: "Vamos recuperar seu acesso.",
        exact: true,
      })
      .waitFor();
    assert.equal(
      await page.locator('input[aria-label="Senha"]:visible').count(),
      0,
    );
    await page
      .getByRole("textbox", { name: "E-mail", exact: true })
      .fill("pessoa@example.com");
    await page
      .getByRole("button", { name: "Enviar instruções", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Confira seu e-mail.", exact: true })
      .waitFor();
    assert.equal(recovery, 1);
    await page
      .getByRole("button", { name: "Voltar para entrar", exact: true })
      .click();
    await page
      .getByRole("textbox", { name: "E-mail", exact: true })
      .fill("pessoa@example.com");
    await page.getByLabel("Senha", { exact: true }).fill("FixturePass123!");
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await page
      .getByRole("heading", { name: "Descubra lugares", exact: true })
      .waitFor();
    assert.equal(login, 2);
    await context.close();
    const guest = await browser.newContext({
      viewport: { width: 320, height: 568 },
    });
    await guest.route(`https://${host}/**`, (route) =>
      route.fulfill({ json: [] }),
    );
    await guest.routeWebSocket(`wss://${host}/**`, (socket) => socket.close());
    const visitor = await guest.newPage();
    visitor.on("pageerror", (e) => errors.push(e.message));
    await visitor.goto(base);
    await visitor
      .getByRole("button", { name: "Começar", exact: true })
      .scrollIntoViewIfNeeded();
    assert(
      await visitor.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    );
    await visitor
      .getByRole("button", { name: "Explorar como visitante", exact: true })
      .click();
    await visitor
      .getByRole("heading", { name: "Descubra lugares", exact: true })
      .waitFor();
    await guest.close();
    assert.deepEqual(errors, []);
    console.log(
      "PASS onboarding: welcome, login, signup, validation, password visibility, terms, confirmation, recovery, navigation after login and guest access on small screen; zero JS errors; simulated APIs only.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
