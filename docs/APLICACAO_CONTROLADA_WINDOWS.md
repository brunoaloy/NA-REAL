# Aplicação controlada — Windows / PowerShell

**Atualização:** se Docker ou a política de scripts PowerShell bloquear o fluxo, seguir [SEM_DOCKER.md](SEM_DOCKER.md). O runner `npm run remote:prepare` prepara sem containers, sem `.ps1` e sem aplicação automática. O registro de metadados não substitui backup completo.

Projeto autorizado: **NA REAL**, `zcnfssihiqmbrlwvlsme`. CLI fixada no lockfile: **3.0.0**. Os flags abaixo foram conferidos no `--help` dessa versão; na CLI 3, o alvo padrão é local e `--remote` seleciona o remoto. Não substituir por comandos de outros tutoriais sem conferir a versão.

**Este documento prepara a aplicação; nenhuma migration foi aplicada remotamente nesta etapa. O Sprint 01 permanece aberto.** O plano não recria projeto, não faz reset, não apaga tabelas/dados e não altera configurações Auth, SMTP, domínio ou chaves. Vault é explicitamente excluído do push. As substituições de metadados já presentes nos SQLs estão descritas abaixo e precisam ser revisadas.

## 1. Inventário remoto observado

Em 06/11/2026 às 17:57 de Brasília (20:57 UTC), consultas somente leitura ao catálogo `pg_catalog` confirmaram:

- Nenhuma tabela/view de aplicativo em `public` ou `supabase_migrations`.
- `to_regclass('supabase_migrations.schema_migrations')` retornou NULL: não há tabela de histórico a listar nesse snapshot. Isso é diferente de uma tabela existente com zero linhas; não marque versões como aplicadas.
- Existe uma função pública padrão `rls_auto_enable()`, sem colisão de nome com as migrations. Ela deve permanecer.
- Auth: zero usuários. Storage: zero objetos, zero buckets e nenhuma policy própria em storage.objects. Isso não autoriza apagar configurações do provedor.
- Publication `supabase_realtime` existe. PostGIS, pg_trgm e unaccent ainda não estão instaladas; as migrations usam `CREATE EXTENSION IF NOT EXISTS` no schema extensions.
- A consulta de gestão executa como `supabase_read_only_user`, `transaction_read_only=on`.
- A CLI identifica o alvo como **production**: não presumir um ambiente descartável.

`supabase link` passou e salvou o vínculo local, ignorado pelo Git. A consulta `db query --read-only --file scripts/migrations/preflight.sql` passou pela CLI. `migration list` e `db push --dry-run --skip-vault` foram tentados, mas pararam com **DbConfigIpv6Error: IPv6 is not supported on your current network**. Portanto, **o dry-run CLI ainda NÃO foi concluído**. A ausência de histórico foi comprovada pela consulta SQL de catálogo, não por uma execução bem-sucedida de migration list.

No Windows, testar novamente com a rede do computador e o vínculo oficial da CLI, que pode usar pooler IPv4 quando disponível. Se persistir erro de rede/permissão, parar e diagnosticar acesso ao endpoint exibido pela CLI. Não desabilitar SSL, não alterar configuração do projeto por tentativa e erro e não compartilhar strings de conexão ou logs com credenciais. A rede desta nuvem não comprova o comportamento da rede Windows.

## 2. Dez arquivos pendentes, em ordem

| Versão       | Arquivo                              | Impacto/conflito a revisar                                                                                                         |
| ------------ | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| 202611060001 | `202611060001_foundation.sql`        | Cria profiles/places/reviews/place_messages, RLS, índices PostGIS/pg_trgm e publication; falha se nomes já existirem sem histórico |
| 202611060002 | `202611060002_community.sql`         | Favoritos, perguntas, respostas, notificações e denúncias; FKs/grants/Realtime                                                     |
| 202611060003 | `202611060003_safe.sql`              | Moderação e filas; conteúdo legado passa a pendente e pode deixar de aparecer publicamente                                         |
| 202611060004 | `202611060004_catalog_media.sql`     | Busca, médias, duplicatas e fotos; upsert configura buckets community-photos/reviewed-photos como privados, JPEG, 5 MB             |
| 202611060005 | `202611060005_profile_media.sql`     | Fotos de perfil; substitui constraint/policies; validar alvos de fotos existentes                                                  |
| 202611060006 | `202611060006_duplicates.sql`        | unaccent, normalização, locks e índices; geração de coluna/índices pode bloquear tabelas grandes                                   |
| 202611060007 | `202611060007_appeals.sql`           | Recursos privados de suspensão                                                                                                     |
| 202611060008 | `202611060008_place_suggestions.sql` | Sugestões privadas, revisão e auditoria; não aplica correções automaticamente                                                      |
| 202611060009 | `202611060009_message_replies.sql`   | Replies e idempotência; unique/FK podem conflitar com dados preexistentes                                                          |
| 202611060010 | `202611060010_nearby_reviews.sql`    | RPC adicional de proximidade sob RLS e índice de cursor de reviews                                                                 |

Todas estão em `supabase/migrations/`. Os dez hashes SHA-256 canônicos foram fixados em `scripts/migrations/manifest.json`. O verificador tolera apenas a conversão LF→CRLF do checkout Windows, sem tolerar mudanças no SQL. Passou na árvore real e em fixtures: aceitou CRLF e recusou arquivo alterado, extra ou ausente. O script PowerShell foi revisado, mas não foi executado em Windows nesta nuvem Linux; não há alegação de teste em Windows.

**Teste local confirmado:** os dez arquivos, com esses hashes, passaram sequencialmente em Postgres 17/PostGIS 3.5 descartável, junto com as suites RLS/Safe/Fase 3/Sprint 01. Foram cobertos visitante, autor, outro usuário e moderador, conteúdo pendente, duplicatas, mídia e médias. Auth/Storage foram emulados nesse teste SQL; não se trata de teste completo dos serviços remotos. Os scripts preflight/postflight também têm verificação em transação somente leitura no banco descartável; o ledger desse ensaio é uma fixture local, não histórico remoto.

## 3. Conflitos e regra de parada

Nenhuma colisão de tabelas/buckets/policies foi encontrada no snapshot remoto. A função padrão existente não é alterada pelo pacote. **Repetir o inventário imediatamente antes da aplicação**: o remoto pode mudar depois desta leitura.

As migrations são incrementais, não idempotentes. Se aparecer tabela de aplicativo sem versão correspondente, parar: não reaplicar 001, não remover tabelas, não editar o histórico manualmente e não usar migration repair para mascarar divergência. Se versões já existirem, a CLI deve propor apenas as realmente pendentes; conferir o schema e o SQL aplicado antes de aceitar.

Não há DROP TABLE, DROP SCHEMA ou TRUNCATE nos dez arquivos. Porém, existem substituições de metadados: 003 remove o trigger antigo notify_answer; 004 substitui community_photo_read; 005 substitui photos_check, photos_insert e photo_parent_read. **Nenhum desses DROP foi executado nesta etapa.** Se a exigência for proibir inclusive DROP de trigger/policy/constraint, não executar a etapa 6: o pacote original precisa de revisão específica. Não esconder essa característica nem reescrever histórico já aplicado.

003 muda visibilidade do legado; 004 altera configuração de buckets com esses nomes, caso passem a existir. Se o inventário novo mostrar dados/buckets, ensaiar em cópia representativa e revisar esse impacto antes de aplicar. Dry-run lista versões, mas não executa os SQLs nem prova que constraints, políticas e dados são compatíveis.

## 4. Preparação no Windows — não aplica migrations

Pré-requisitos: Git, Node 24/npm 11, acesso autorizado ao projeto e rede compatível com Postgres/pooler. Docker Desktop é necessário se a instalação CLI de pg_dump usada nos backups depender dele; Docker também é necessário para a stack local. Nenhum segredo entra nos comandos versionados ou no chat.

Abra PowerShell na pasta existente NA-REAL (o caminho varia por computador):

```powershell
Set-Location -LiteralPath (Read-Host 'Caminho completo da pasta existente NA-REAL')
git status --short
```

Se houver trabalho local, preservá-lo antes de trocar/puxar a branch. Não usar reset/clean/stash automático. Com o checkout limpo:

```powershell
git fetch origin
git switch codex/na-real-dev
git pull --ff-only origin codex/na-real-dev
npm ci
if ($LASTEXITCODE -ne 0) { throw 'npm ci falhou; pare aqui.' }
node scripts/check-migration-manifest.cjs
if ($LASTEXITCODE -ne 0) { throw 'Migrations diferem do plano auditado.' }
npx.cmd --no-install supabase --version
```

Versão esperada: 3.0.0. Se o terminal ainda não tiver autenticação válida, usar o fluxo oficial `npx.cmd --no-install supabase login`, somente no terminal/navegador local. Se já houver token seguro configurado, preservá-lo. Não colocar token ou senha em argumentos, arquivos versionados, screenshots ou chat.

A preparação automatizada abaixo executa apenas vínculo, inventário, consulta read-only e dry-run; aborta no primeiro erro e **não contém push real**:

```powershell
& .\scripts\prepare-remote-migrations.ps1
```

Não alterar a ExecutionPolicy global se o Windows impedir scripts. Os comandos equivalentes, executados um por vez com verificação de código de saída, são:

```powershell
$projectRef = 'zcnfssihiqmbrlwvlsme'
npx.cmd --no-install supabase link --project-ref $projectRef
if ($LASTEXITCODE -ne 0) { throw 'Vinculo falhou.' }
npx.cmd --no-install supabase migration list "--remote=$projectRef"
if ($LASTEXITCODE -ne 0) { throw 'Historico nao confirmado; nao aplicar.' }
npx.cmd --no-install supabase db query "--remote=$projectRef" --read-only --file scripts/migrations/preflight.sql
if ($LASTEXITCODE -ne 0) { throw 'Inventario remoto falhou.' }
npx.cmd --no-install supabase db push "--remote=$projectRef" --dry-run --skip-vault
if ($LASTEXITCODE -ne 0) { throw 'Dry-run falhou; nao aplicar.' }
```

No estado auditado, esperar dez versões locais sem correspondência remota e as mesmas dez no dry-run. Nenhuma versão desconhecida, seed, roles extras ou alteração Vault deve ser proposta. Se a saída divergir, parar e revisar o novo estado.

## 5. Backup e revisão antes de aplicar

Confirmar backup/snapshot/PITR do provedor e plano de recuperação em cópia, sem presumir disponibilidade no plano. Guardar horário, HEAD Git, inventário e histórico em armazenamento privado. Os dumps abaixo usam o caminho com Docker; para backup nativo ou do provedor, seguir SEM_DOCKER.md. São complementares: não substituem Auth, configurações, segredos ou bytes de Storage. Não remover nenhum dado para fazer backup funcionar.

```powershell
$projectRef = 'zcnfssihiqmbrlwvlsme'
$backupDir = Join-Path '.local-services' ('backup-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
npx.cmd --no-install supabase db dump "--remote=$projectRef" --schema public --file (Join-Path $backupDir 'public-schema.sql')
if ($LASTEXITCODE -ne 0) { throw 'Backup de schema falhou.' }
npx.cmd --no-install supabase db dump "--remote=$projectRef" --schema public --data-only --use-copy --file (Join-Path $backupDir 'public-data.sql')
if ($LASTEXITCODE -ne 0) { throw 'Backup de dados falhou.' }
```

Essa pasta é ignorada no Git. Protegê-la por permissões/armazenamento seguro e não publicar seus arquivos. Se o histórico passar a existir, exportá-lo também por ferramenta oficial em armazenamento privado. Preservar as configurações Auth/SMTP/redirects, Storage e funções por procedimentos do provedor, sem copiá-las para o mobile.

## 6. Aplicação manual separada — NÃO executada pelo agente

Somente depois de backup, revisão dos impactos, histórico coerente e dry-run concluído. Não usar --yes, --include-all, --include-seed, --include-roles ou comandos de repair. Não copiar os SQLs para o SQL Editor em lote, pois isso perde o registro automático do CLI.

```powershell
$projectRef = 'zcnfssihiqmbrlwvlsme'
node scripts/check-migration-manifest.cjs
if ($LASTEXITCODE -ne 0) { throw 'Plano alterado; pare.' }
npx.cmd --no-install supabase db push "--remote=$projectRef" --dry-run --skip-vault
if ($LASTEXITCODE -ne 0) { throw 'Dry-run falhou; nao aplicar.' }
# Revisar a lista exibida antes de executar o proximo comando.
npx.cmd --no-install supabase db push "--remote=$projectRef" --skip-vault
if ($LASTEXITCODE -ne 0) { throw 'Aplicacao falhou; consultar historico antes de tentar novamente.' }
```

O CLI mantém `supabase_migrations.schema_migrations`; não inserir versões por SQL. A aplicação das dez não deve ser tratada como um lote globalmente atômico: uma falha pode deixar versões anteriores aplicadas. Nessa situação, consultar novamente history/inventário, preservar arquivos e corrigir por plano específico, sem reset, downgrade ou repetição cega.

## 7. Verificação após aplicação

```powershell
npx.cmd --no-install supabase migration list "--remote=$projectRef"
if ($LASTEXITCODE -ne 0) { throw 'Falha ao confirmar historico.' }
npx.cmd --no-install supabase db query "--remote=$projectRef" --read-only --file scripts/migrations/postflight.sql
if ($LASTEXITCODE -ne 0) { throw 'Verificacao SQL falhou.' }
npx.cmd --no-install supabase db push "--remote=$projectRef" --dry-run --skip-vault
if ($LASTEXITCODE -ne 0) { throw 'Verificacao de pendencias falhou.' }
```

Esperar dez versões alinhadas e nenhuma pendência no último dry-run; todas as tabelas esperadas presentes com RLS; PostGIS/pg_trgm/unaccent; buckets privados JPEG/5 MB; RPCs e índice presentes; visitor_search=true, visitor_insert=false, client_admin_escalation=false. Conferir que a função padrão rls_auto_enable continua presente. Essas verificações estruturais não comprovam sozinhas permissões de dois usuários, Storage ou autenticação.

Executar então [TESTES_REMOTOS_SPRINT_01.md](TESTES_REMOTOS_SPRINT_01.md). Não declarar conclusão até validar os fluxos reais e registrar resultados. Nenhum teste automatizado local deve ser renomeado como aprovação remota.
