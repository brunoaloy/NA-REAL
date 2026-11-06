# Configuração externa e limites

## Cliente (público)

| Variável                             | Finalidade                                  |
| ------------------------------------ | ------------------------------------------- |
| EXPO_PUBLIC_SUPABASE_URL             | Projeto Supabase de desenvolvimento         |
| EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY | Chave publicável; acesso limitado por RLS   |
| EXPO_PUBLIC_MAP_STYLE_URL            | Estilo de produção licenciado para MapLibre |

Opção de mapas: MapTiler, com estilo contratado e chave pública restrita/quotas, por exemplo `https://api.maptiler.com/maps/streets-v2/style.json?key=SUA_CHAVE_PUBLICA`. Não foi criada conta, contratado plano ou feito consumo. Verifique licença, atribuição, cobertura, limites, domínio e orçamento antes de ativar. MapLibre mantém atribuição visível. Nenhuma base externa de lugares foi importada: não prometemos cobertura pré-carregada nacional.

## Backend

Supabase fornece `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` às Edge Functions. Não copie service_role para EXPO_PUBLIC, app.json, Git ou arquivos públicos. Configure via painel seguro os seguintes segredos opcionais:

- `MODERATION_API_KEY`: credencial OpenAI para a API de moderação, modelo `omni-moderation-latest`. Chamadas só ocorrem ao executar worker configurado. Não houve chamada real nesta execução. Revise contrato, retenção, LGPD e custos antes de fornecer a chave.
- `MODERATION_WORKER_TOKEN`: segredo aleatório somente para agendamento servidor-a-servidor. Endpoint também aceita JWT de moderador verificado. Não use token de usuário de longa duração como cron.

Deploy (após vincular ao projeto autorizado):

```sh
supabase functions deploy moderate-pending
supabase functions deploy prepare-photo
supabase functions deploy delete-photo
supabase functions deploy delete-account
```

`verify_jwt=false` no TOML permite chaves atuais e preflight; **não torna handlers públicos sem autenticação**. Cada handler usa Auth.getUser + RBAC ou segredo de worker comparado por digest. Não há cron configurado automaticamente; o botão no `/admin` executa lotes de até dez itens. Pendências com risco/decisão humana não são reprocessadas para aprovação automática.

Antes de aplicar 003, agende a revisão do legado: ela quarentena o UGC existente. Migrações criam buckets privados e políticas Storage. `tests/sql/bootstrap.sql` jamais deve ser aplicado no projeto real.

## Autenticação

Configure SMTP, política de senhas, confirmação, Site URL e redirects para development build e host web. PKCE requer o mesmo contexto/dispositivo. Teste confirmação e recuperação real antes do lançamento. Google/Apple continuam dependentes de OAuth, IDs/client secrets/entitlements e implementação final; botões de login social não são simulados.

## Lojas, notificações e suporte

EAS/APNs/FCM e contas Apple/Google são externos; nenhum push é enviado. Defina bundle ID definitivo, domínio, suporte, controlador LGPD, política de retenção e contato para denúncias antes de disponibilizar ao público. A rota web `/delete-account` existe, mas precisa ser hospedada em domínio público para informar sua URL ao Play Console.

## Rede

Necessários: registry.npmjs.org, domínio exato do projeto Supabase e domínios usados pelo estilo/tiles contratado. `api.openai.com` é usado pelo backend Supabase, não pelo app. A política deste ambiente ainda não tem domínio Supabase ou provedor escolhido; adicione-os às configurações após conhecer as URLs. Não substitua a allowlist desconhecida ou libere toda a Internet. CLI Expo foi operada em modo offline para usar o mapa de compatibilidade do SDK; TLS/checksums não foram desabilitados.
