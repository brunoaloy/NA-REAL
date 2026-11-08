const fs = require("node:fs"),
  path = require("node:path");
function emailBranding(root = path.resolve(__dirname, "..")) {
  return {
    smtp_sender_name: "NA REAL",
    mailer_subjects_confirmation: "Confirme seu e-mail no NA REAL",
    mailer_subjects_recovery: "Recupere seu acesso ao NA REAL",
    mailer_templates_confirmation_content: fs.readFileSync(
      path.join(root, "supabase/templates/confirmation.html"),
      "utf8",
    ),
    mailer_templates_recovery_content: fs.readFileSync(
      path.join(root, "supabase/templates/recovery.html"),
      "utf8",
    ),
  };
}
async function main() {
  const root = path.resolve(__dirname, ".."),
    payload = emailBranding(root),
    directory = path.join(root, ".local-services");
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(
    path.join(directory, "auth-email-branding.json"),
    JSON.stringify(payload, null, 2) + "\n",
  );
  console.log(
    "Preparado .local-services/auth-email-branding.json: nome NA REAL, dois assuntos e dois templates. Sem credenciais SMTP.",
  );
  if (!process.argv.includes("--apply")) {
    console.log("Nada foi aplicado ao Supabase; nenhum e-mail foi enviado.");
    return;
  }
  if (!process.env.SUPABASE_ACCESS_TOKEN)
    throw new Error(
      "Configure SUPABASE_ACCESS_TOKEN pelo ambiente seguro antes de aplicar.",
    );
  const response = await fetch(
    "https://api.supabase.com/v1/projects/zcnfssihiqmbrlwvlsme/config/auth",
    {
      method: "PATCH",
      headers: {
        Authorization: "Bearer " + process.env.SUPABASE_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    },
  );
  if (!response.ok)
    throw new Error(
      "Configuração Auth recusada: HTTP " +
        response.status +
        ". Verifique acesso de escrita às configurações Auth do projeto; conteúdo da resposta omitido.",
    );
  const saved = await response.json();
  if (Object.keys(payload).some((key) => saved[key] !== payload[key]))
    throw new Error(
      "A API não confirmou todos os campos de identidade. Confira o painel antes de anunciar como ativo.",
    );
  console.log(
    "API confirmou nome/assuntos/templates NA REAL. Não alteramos SMTP, redirects ou exigência de confirmação. Entrega real ainda precisa ser testada após configurar SMTP.",
  );
}
module.exports = { emailBranding };
if (require.main === module)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
