# Continuidade sem Docker

Docker não é necessário para `supabase link`, consultas remotas, `migration list`, `db push --dry-run` ou `db push`. Ele era exigido pelo caminho de **backup via `supabase db dump`**. Não insistir na instalação para preparar migrations.

As dez migrations permanecem intactas e com os hashes do plano controlado. Nenhum comando novo de preparação aplica migrations, executa reset/drop/repair, modifica Vault, Auth, SMTP ou buckets.

## Windows: um comando de preparação

Na pasta existente NA-REAL, com checkout limpo antes de atualizar:

```powershell
git fetch origin
git switch codex/na-real-dev
git pull --ff-only origin codex/na-real-dev
npm.cmd ci
npm.cmd run remote:prepare
```

O comando Node usa a CLI 3.0.0 instalada pelo lockfile, sem chamar `.ps1` ou exigir mudanças na ExecutionPolicy. Usa explicitamente `zcnfssihiqmbrlwvlsme`. Executa verificação de hashes, inventário remoto read-only em **um único resultado**, registra metadados em `.local-services/remote-UUID/`, lista versões e executa:

```powershell
npx.cmd --no-install supabase db push --remote=zcnfssihiqmbrlwvlsme --dry-run --skip-vault
```

Aborta em qualquer erro. A CLI precisa do login já feito no computador; não inserir tokens em arquivos versionados ou no chat. Os arquivos de `.local-services` são privados, ignorados pelo Git e podem conter definições de funções; não compartilhar seu conteúdo publicamente.

**O inventário é um registro de metadados, não um backup completo nem um arquivo de restauração.** Inclui definições/owner/ACL das funções públicas, relações, extensões, policies, buckets e contagens de Auth/Storage. Não exporta linhas, arquivos, credenciais, configurações completas do provedor ou histórico de migrações em formato de recuperação. Não substitui pg_dump/snapshot.

## Backup sem Docker

Escolher uma das alternativas antes de uma alteração que exija recuperação:

1. Snapshot/backup/PITR oficial do Supabase, se disponível no plano, com possibilidade de restaurar uma cópia. A disponibilidade não foi confirmada: a API de backups retornou HTTP 403 nesta sessão, o que não prova ausência de backups.
2. Cliente PostgreSQL **nativo** (`pg_dump.exe`), da distribuição oficial, compatível com a versão do servidor (17 nesta auditoria). Não usa containers. Usar uma conexão/service profile já configurado de maneira segura a partir de Connect no dashboard, preferindo conexão direta ou session pooler compatível com a rede. Não usar transaction pooler para dump. Não inventar hostname nem colocar senha na linha de comando.

Para um service profile PostgreSQL chamado `nareal`, já configurado no computador:

```powershell
pg_dump.exe --version
$backupDir = Join-Path '.local-services' ('native-backup-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
pg_dump.exe --dbname='service=nareal' --schema=public --format=custom --file="$backupDir\public.dump"
if ($LASTEXITCODE -ne 0) { throw 'Backup nativo falhou; nao aplicar.' }
pg_restore.exe --list "$backupDir\public.dump"
if ($LASTEXITCODE -ne 0) { throw 'Arquivo nao pode ser lido; nao aplicar.' }
```

Esse exemplo não cria o service profile nem coleta credenciais. Senhas devem ficar no mecanismo seguro do cliente ou ser digitadas somente no prompt local. O dump public não cobre bytes de Storage, Auth ou configurações do provedor. `pg_restore --list` confirma legibilidade, não substitui ensaio de restauração em ambiente isolado. Não restaurar por cima do projeto real como teste.

Na última consulta real desta sessão, não havia tabelas públicas, histórico de migrations, usuários Auth, buckets ou arquivos. A função padrão `rls_auto_enable` existe e foi registrada. Isso reduz a superfície de conflito, mas não autoriza ignorar alterações concorrentes ou chamar o registro de metadados de backup completo.

## Aplicação manual controlada

Depois de revisar recuperação/backup, inventário e dry-run no computador:

```powershell
node scripts/check-migration-manifest.cjs
if ($LASTEXITCODE -ne 0) { throw 'SQL mudou; pare.' }
npx.cmd --no-install supabase db push --remote=zcnfssihiqmbrlwvlsme --dry-run --skip-vault
if ($LASTEXITCODE -ne 0) { throw 'Dry-run falhou; pare.' }
# Conferir as dez migrations esperadas antes de executar a proxima linha.
npx.cmd --no-install supabase db push --remote=zcnfssihiqmbrlwvlsme --skip-vault
if ($LASTEXITCODE -ne 0) { throw 'Aplicacao falhou; consultar historico antes de repetir.' }
npm.cmd run remote:verify
```

`remote:verify` lê o histórico pela CLI, exige as dez versões esperadas no SQL e verifica tabelas/RLS, extensões, buckets, RPCs, índice e privilégios mínimos. O dry-run final deve mostrar nenhuma pendência; se ainda houver versão pendente, não declarar conclusão. A verificação estrutural não atesta cadastro, upload ou avaliações por usuários reais. Executar [TESTES_REMOTOS_SPRINT_01.md](TESTES_REMOTOS_SPRINT_01.md) com A/B/moderador e dados legítimos, sem inventar notas ou publicar fixtures no ambiente production.

Preservar o histórico automático da CLI. Não usar SQL Editor para marcar versões, não usar --include-all/--include-seed/--include-roles/--yes e não executar reset/repair/drop. Os SQLs originais contêm substituições de policies/triggers/constraints, descritas em APLICACAO_CONTROLADA_WINDOWS.md; nenhuma foi executada nesta sessão. Se a proibição abranger inclusive essas substituições, parar e revisar o pacote antes da aplicação.

## O que foi observado e o que continua pendente

O novo inventário completo funcionou pela API/CLI read-only. Nesta nuvem, `migration list` continua bloqueado por IPv6, portanto `remote:prepare` interrompeu antes do dry-run; já há evidência enviada pelo proprietário de dry-run bem-sucedido no Windows com as dez versões. Isso não é evidência de aplicação.

Nenhuma migration foi aplicada remotamente. A nova verificação pós-aplicação não foi executada sobre schema remoto instalado, pois ele ainda não existe. Os novos comandos foram executados em Linux; não há alegação de execução do runner Node ou de pg_dump nativo em Windows. A suíte SQL histórica com os dez hashes passou no banco descartável; nenhum container foi iniciado nesta continuidade.
