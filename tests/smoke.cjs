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
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(process.env.SMOKE_URL || "http://127.0.0.1:8765");
    await page.getByRole("button", { name: "Começar como visitante" }).click();
    await page
      .getByText("Supabase não configurado.", { exact: false })
      .waitFor();
    await page.screenshot({
      path: "docs/screenshots/fase2-explorar.png",
      fullPage: true,
    });
    await page.getByRole("button", { name: "Filtros avançados" }).click();
    await page
      .getByRole("textbox", { name: "Cidade", exact: true })
      .fill("Recife");
    await page.getByRole("textbox", { name: "UF", exact: true }).fill("PE");
    await page.getByRole("button", { name: "Mapa", exact: true }).click();
    await page.getByText("Mapa não configurado.", { exact: false }).waitFor();
    await page.screenshot({
      path: "docs/screenshots/fase2-mapa-nao-configurado.png",
      fullPage: true,
    });
    await page.getByRole("button", { name: "Voltar à lista" }).click();
    await page.getByRole("tab", { name: "Adicionar" }).click();
    await page.getByLabel("Nome do lugar").fill("Mercado de teste");
    await page
      .getByRole("textbox", { name: "Cidade", exact: true })
      .fill("Recife");
    await page.getByRole("textbox", { name: "UF", exact: true }).fill("PE");
    await page
      .getByLabel("Endereço público", { exact: true })
      .fill("Rua Pública 10");
    const submit = page.getByRole("button", {
      name: "Enviar para revisão",
      exact: true,
    });
    assert.equal(await submit.getAttribute("aria-disabled"), "true");
    await page
      .getByRole("button", { name: "Pesquisar possíveis duplicatas" })
      .click();
    await page
      .getByRole("alert")
      .filter({ hasText: "Supabase não configurado." })
      .waitFor();
    assert.equal(await submit.getAttribute("aria-disabled"), "true");
    await page.screenshot({
      path: "docs/screenshots/fase2-adicionar.png",
      fullPage: true,
    });
    await page.getByRole("tab", { name: /Perfil/ }).click();
    await page
      .getByRole("button", { name: "Privacidade e configurações" })
      .click();
    await page.getByRole("button", { name: "Política de privacidade" }).click();
    await page
      .getByText("Versão preliminar para desenvolvimento.", { exact: false })
      .waitFor();
    await page.getByRole("button", { name: "Voltar", exact: true }).click();
    await context.setOffline(true);
    await page
      .getByRole("alert")
      .filter({ hasText: "Sem internet." })
      .waitFor();
    await context.setOffline(false);
    assert.deepEqual(errors, []);
    console.log(
      "PASS: visitante, filtros, mapa sem configuração, cadastro protegido, perfil, privacidade e offline; zero erros JS.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
