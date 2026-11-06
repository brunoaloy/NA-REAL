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
