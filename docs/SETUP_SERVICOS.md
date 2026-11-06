# Setup de serviços — Fase 4

Esta fase não cria projeto remoto, contas pagas ou novas funcionalidades de produto. O proprietário confirmou que ainda não criou Supabase; o alvo é desenvolvimento local. Nenhum segredo deve ser enviado em chat ou commitado.

## 1. Desenvolvimento local real

Pré-requisitos: Node 24, npm 11, Docker e Chromium para o teste de fotos. CLI Supabase 3.0.0 fixada nas dependências.

```sh
npm ci
npm run services:check
npm run services:start
npm run test:services
```

A configuração local habilita API/Postgres 17, Auth com confirmação, SMTP de teste, Storage e Realtime. Studio/analytics/imgproxy/pooler não são necessários à suíte. Portas locais: API 54321, banco 54322, captura SMTP 54324. Não encaminhe essas portas publicamente. SMTP local captura e-mails para testes; não entrega e-mails pela Internet.

A primeira inicialização aplica 001–009 somente no banco local. Não use reset para preservar dados existentes; `services:stop` conserva volumes. `test:services` recusa URL não loopback, cria contas de fixture com senhas aleatórias em memória, executa operações HTTP reais, usa SMTP capturado e tenta limpar suas fixtures. Nunca apontar essa suíte para produção. Relatório em `.local-services/report.json`, ignorado pelo Git.

A suíte cobre criação/confirmacão/login, recuperação, mercado de teste, avaliação em outra sessão, RLS negativa, pergunta/resposta com Realtime, notificação, mensagens/retry, favoritos/denúncia, upload privado/cópia revisada e ausência de IA. Aprovações usam uma conta de operador de teste; não representam análise de IA ou avaliação humana real do conteúdo.

Para conectar o app: consulte `supabase status` somente em terminal privado e copie **apenas** URL e chave anon/publicável para `.env.local`. Não publique a saída completa: contém service_role local. Defina `NA_REAL_ALLOW_LOCAL_HTTP=1` apenas em desenvolvimento HTTP. Em celular físico, 127.0.0.1 aponta para o próprio celular: use IP privado do computador acessível, restrinja firewall à rede de testes e ajuste redirects. Nenhuma porta/URL localhost é um preview público.

```sh
npm start
```

MapLibre exige development build, não Expo Go. A configuração pública rejeita service_role/sb_secret antes de iniciar o bundler e em runtime. Isso não autoriza guardar qualquer segredo na variável EXPO_PUBLIC.

## 2. Rede deste ambiente

Na primeira tentativa, um componente opcional recebeu Forbidden em `public.ecr.aws`; ele foi excluído da configuração mínima. A adição temporária de domínio foi desfeita, preservando a política anterior. As imagens essenciais foram baixadas de ghcr.io, já permitido.

A inicialização mínima avançou até o schema, mas o Docker `vfs` desta máquina retornou `no space left on device`. O uso chegou a 97% (58 GB de 63 GB), apesar de tamanhos virtuais de imagens menores. As oito imagens baixadas nesta execução foram removidas, sem apagar checkout, volumes ou a imagem PostGIS anterior; espaço recuperado para 46 GB livres. Não foi alterado storage driver nem executado prune global.

Resultado: stack completa **bloqueada por capacidade de disco**, não configurada. Use Docker Desktop com espaço suficiente (recomenda-se pelo menos 100 GB disponíveis para imagens/containers e margem) ou ambiente maior. Não repita o start sem resolver a capacidade; ele não comprova disponibilidade só por baixar imagens.

## 3. Futuro Supabase hospedado (não executado nesta fase)

1. Criar projeto de desenvolvimento no painel Supabase, escolher região, guardar senha do banco no gerenciador seguro e anotar project-ref/URL pública.
2. Configurar `SUPABASE_ACCESS_TOKEN`/senha por canal seguro quando necessário à CLI; no app apenas `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Nunca service_role.
3. Vincular explicitamente o projeto e inventariar versões antes de escrever:

```sh
npx supabase link --project-ref PROJECT_REF_DE_DESENVOLVIMENTO
npx supabase migration list --remote
npx supabase db push --remote --dry-run --skip-vault
```

Esses exemplos usam **CLI 3.0.0**: o padrão é local e `--remote` seleciona o projeto vinculado. Não reutilize flags de guias CLI 2 sem conferir `--help`. Nenhum desses comandos remotos foi executado aqui. Não faça migration repair para marcar versões como aplicadas sem comparar o esquema real.

4. Comparar banco real com histórico e revisar `AUDITORIA_MIGRACOES.md`. Fazer backup e ensaiar recuperação antes de aplicar. Se o projeto já contém 001–007, pendentes são 008/009; não repetir SQL aplicado.
5. Aplicar somente o plano revisado no alvo de desenvolvimento autorizado. A opção dry-run lista versões, mas não prevê efeitos sobre todos os dados; ensaiar em cópia é obrigatório para alterações de acesso/constraints.

## 4. Backup e recuperação

Antes de atualização remota: registrar project-ref, versões, horário, HEAD Git e responsáveis. Verificar backup/PITR disponível no plano e possibilidade de restaurar uma cópia. Não presumir que backup existe.

Exportação adicional do schema/dados do aplicativo, em pasta privada e com permissões restritas:

```sh
umask 077
mkdir -p .local-services
npx supabase db dump --remote --schema public --file .local-services/app-schema.sql
npx supabase db dump --remote --schema public --data-only --use-copy --file .local-services/app-data.sql
```

Esses dumps **não são backup completo**: Auth, configurações do provedor, segredos e bytes do Storage exigem estratégia própria. Exporte arquivos dos dois buckets por Storage API para armazenamento privado criptografado, preserve metadados e teste checksums. Não grave bytes fazendo SQL direto em storage.objects. Guardar o histórico auth.users é essencial para FKs/autoria; restaurar dump public isolado não recria contas. Usar snapshot/PITR do provedor e procedimentos oficiais de Auth, com revisão de sessões e segredos.

Ensaio de recuperação: restaurar em projeto de teste isolado com versões compatíveis e identidades preservadas; restaurar Storage, configurar Auth/redirects/funções e testar anon/A/B/admin. Conferir contagens, autoria, RLS, índices, arquivos e fila pendente. Produção só pode ser restaurada com decisão humana explícita; nunca usar db reset remoto para rollback. Correções devem preferir migração futura; downgrade ad hoc pode apagar dados.

## 5. Auth/e-mail

Local: confirmação ativada e e-mail capturado pelo SMTP local. Hospedado: definir Site URL, redirects do development client/web e SMTP transacional com domínio verificado. PKCE precisa abrir no mesmo contexto que iniciou a solicitação. Testar entrega real, expiração, recuperação e logout entre aparelhos. Google/Apple continuam dependentes de implementação/credenciais próprias e não estão operacionais.

## 6. Storage e Safe

001–009 criam os buckets/políticas; deploy das funções `moderate-pending`, `prepare-photo`, `delete-photo`, `delete-account` no projeto autorizado. URL/anon/service_role são bindings do backend Supabase; não copiar para o mobile. Nomear moderador por SQL privilegiado em safe_admins.

No servidor, configurar `MODERATION_API_KEY` para OpenAI e opcional `MODERATION_WORKER_TOKEN` para cron protegido. Sem chave/resposta válida, conteúdo não analisado fica pendente. Fotos/perfis/lugares continuam exigindo revisão humana. Não foi contratada IA nem feito consumo nesta fase. Confirmar política de dados/custos antes de fornecer a credencial.

## 7. Mapas e notificações

Contratar/configurar estilo MapTiler ou equivalente licenciado. Chave pública restrita/quotas em `EXPO_PUBLIC_MAP_STYLE_URL`; manter atribuição. Validar tiles, pin/cluster e geografia no aparelho. Não usar Nominatim público/OSM gratuito como backend nacional.

Notificações internas são persistidas no banco após aprovação da resposta e opt-in. Push/FCM/APNs não implementados; não são ativados apenas adicionando chaves. Relação de seguidores e preferências não equivale a entrega de push.

## 8. Builds Android/iOS

Leia `VALIDACAO_MOBILE.md`. Development client/MapLibre e permissões já estão na configuração. IDs com.example.nareal são provisórios. Android local requer JDK compatível e Android SDK; iOS requer macOS/Xcode/CocoaPods. EAS exige conta/projeto e assinatura. Não gerar builds remotos pagos ou publicar automaticamente. Teste em aparelho real antes de qualquer declaração de prontidão de loja.
