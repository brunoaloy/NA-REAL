# Verificação inicial do Supabase existente

O proprietário informou a criação do NA REAL e a configuração de SUPABASE_ACCESS_TOKEN. Não foi criado outro projeto. Nenhuma migração, deploy, alteração de produção ou comando destrutivo foi executado remotamente.

## Evidência desta tentativa

- Checkout limpo, branch codex/na-real-dev, HEAD de entrada 1e3c9a0.
- SUPABASE_ACCESS_TOKEN ausente no processo desta instância; status do ambiente e rascunho também não apresentavam esse binding.
- Tentativa read-only `supabase projects list -o json`, capturada em arquivos temporários privados e removidos após leitura: exit 1, diagnóstico **Access token not provided**. Nenhum token foi impresso e não se conclui invalidade da credencial que o proprietário cadastrou em outro contexto.
- CLI 3.0.0 precisou de permissão local para telemetria fora do checkout; a nova tentativa chegou à checagem de autenticação, confirmando que a falta do token é o bloqueio atual.
- Nove migrações locais presentes, sem mudanças. Projeto remoto ainda não identificado; versões aplicadas, estado do banco e dry-run **não consultados/executados** por falta de autenticação.

## Manifesto local (SHA-256 abreviado)

| Arquivo               | SHA-256 inicial |
| --------------------- | --------------- |
| 001_foundation        | 8b41ffa52607    |
| 002_community         | 77f274bb7fec    |
| 003_safe              | 630e24aa98a6    |
| 004_catalog_media     | 391a13049ae9    |
| 005_profile_media     | 8ede22253f5e    |
| 006_duplicates        | b83726f51cb0    |
| 007_appeals           | 18749e21b4a7    |
| 008_place_suggestions | 7bef22e524be    |
| 009_message_replies   | f2be1ddb6c14    |

## O que está pronto e o que falta

Código, migrações e roteiro de backup/dry-run estão disponíveis. A migração 003 modifica visibilidade do legado colocando conteúdo em pendência; não deve ser tratada como mudança sem impacto. Constraints e índices também precisam ser comparados ao banco real. Ver AUDITORIA_MIGRACOES.md e SETUP_SERVICOS.md.

Falta disponibilizar o binding seguro na instância desta conversa e informar URL/project-ref público. Foi preparado requisito de segredo SUPABASE_ACCESS_TOKEN destinado somente a api.supabase.com no rascunho do ambiente. Salvar rascunho não aplica à máquina nem valida o token. Rever/salvar e publicar pelas configurações do ambiente; reexecutar a checagem após a propagação. Nunca inserir valor em Git, .env versionado ou chat.

Depois de autenticado: identificar projeto exato; conferir permissões e ambiente; listar histórico remoto; consultar estado do banco com operações de leitura; executar somente `db push --remote --dry-run --skip-vault` no alvo identificado. Nenhuma aprovação de aplicação real está presumida.

O comando de listagem pode exigir projects_read; token estritamente limitado pode não permitir listar todos os projetos. Nesse caso usar o project-ref informado e testar acesso específico. Acesso a histórico/SQL pode exigir permissões adicionais; ainda não foram diagnosticadas. Senha de banco não foi solicitada: só será requisito se a operação efetiva exigir após testar autenticação disponível. Não ampliar para acesso de organização inteira por conveniência.

## Identificador recebido

Projeto-alvo informado pelo proprietário: `zcnfssihiqmbrlwvlsme`, URL pública `https://zcnfssihiqmbrlwvlsme.supabase.co`. Isso identifica o alvo autorizado; ainda não confirma existência/saúde pela API.

Nova verificação: token continua ausente no processo e nos bindings ativos. O rascunho possui requisito SUPABASE_ACCESS_TOKEN com `has_saved_binding: false`, sem valor vinculado a esta configuração. URL pública sugerida e domínio exato do projeto foram salvos no rascunho, preservando api.supabase.com; a gravação não aplica nem publica automaticamente.

Tentativa sem credenciais ao health de Auth: HTTP 000, curl exit 56; conectividade não confirmada. Não é evidência de banco fora do ar. Não houve consulta SQL, listagem de histórico ou dry-run remoto nesta etapa. Próximo requisito é salvar o valor pelo canal seguro desta configuração e aplicar/publicar o ambiente; depois testar novamente a autenticação, sem criar outro projeto ou aplicar SQL.

## Atualização — continuidade Sprint 01

O binding de gestão está disponível nesta execução. GET do projeto reconheceu NA REAL, ref zcnfssihiqmbrlwvlsme, ACTIVE_HEALTHY. Consulta read-only de information_schema retornou zero tabelas em public e supabase_migrations. A configuração pública foi recuperada em .env.local ignorado; nenhum token administrativo gravado no app.

Após validar 001–010 em Postgres/PostGIS descartável, a tentativa transacional de inicialização foi recusada: HTTP 400, SQLSTATE 25006, CREATE SCHEMA em transação somente leitura. Consultas com read_only=false e sem esse parâmetro continuaram indicando current_user=supabase_read_only_user, transaction_read_only=on. Nova consulta confirmou zero tabelas públicas. Nenhuma migration/política foi aplicada e nenhum papel foi alterado para contornar a restrição.

Deploy via CLI parou antes da chamada de implantação por tentar criar .supabase na home somente leitura. Funções não foram implantadas nesta sessão. O relatório ENTREGA_SPRINT_01.md registra os testes que passaram e a integração que permanece pendente. Relatos anteriores de token ausente descrevem tentativas históricas.

## Aplicação controlada — inventário atualizado

Em 06/11/2026 20:57 UTC, pg_catalog confirmou ausência de tabelas/views em public e supabase_migrations; to_regclass do ledger retornou NULL. Existe a função padrão public.rls_auto_enable(), preservada. Auth/Storage retornaram zero usuários/objetos/buckets/policies próprias. A publication supabase_realtime existe. PostGIS/pg_trgm/unaccent ainda não instalados.

CLI 3.0.0 vinculou o projeto e executou preflight read-only com sucesso após usar SUPABASE_HOME em pasta temporária permitida, sem mudar HOME. O problema anterior de diretório da CLI foi resolvido para esta preparação. Migration list e db push --dry-run --skip-vault falharam em DbConfigIpv6Error nesta rede; não houve dry-run concluído nem aplicação. CLI identifica alvo como production. A confirmação de ausência do ledger vem da consulta de catálogo, não de migration list.

Plano Windows, impactos de metadados, backup e aplicação manual separada em APLICACAO_CONTROLADA_WINDOWS.md. Hashes dos dez SQLs preservados, nenhuma migration histórica reescrita. Testes remotos preparados em TESTES_REMOTOS_SPRINT_01.md, não executados. Nenhum reset/drop/repair foi executado no remoto.
