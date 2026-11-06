# Continuidade — preparação sem Docker e melhorias do app

6 de novembro de 2026. Branch codex/na-real-dev. Sprint 01 permanece aberto até validar banco e fluxos remotos.

## Implementado

- `npm run remote:prepare`: runner Node multiplataforma, sem scripts PowerShell e sem Docker. Confere versão/hashes, salva inventário privado, lista versões e faz dry-run. Não contém modo de aplicação.
- `npm run remote:verify`: verificação estrutural read-only de histórico 001–010, 24 tabelas/RLS, extensões, buckets, RPCs, índice e privilégios. Não substitui testes reais de usuários.
- Preflight e postflight agora retornam um único resultado JSON, corrigindo a exibição de somente a última consulta pela CLI. Inventário privado captura metadados/definições sem exportar dados de usuários.
- Cadastro exige autenticação antes do formulário e abre o detalhe após salvar. O autor pode continuar enviando fotos do detalhe, com estado de revisão preservado.
- Fotos têm seleção, compressão e prévia antes do envio explícito; é possível descartar a seleção. Falha mantém a prévia para tentar novamente. O formulário de foto é reiniciado quando seu alvo muda.
- Mensagens de erro para validação, rede, permissões, indisponibilidade do serviço, autenticação e duplicatas. Objetos Supabase não aparecem mais como [object Object]; diagnósticos internos e credenciais não são exibidos.
- KeyboardAvoidingView em iOS, mantendo safe area e rolagem existentes. Comportamento com teclado nativo ainda precisa de aparelho.

## Preservação

Nenhuma das dez migrations foi reescrita, nenhuma migration nova criada, nenhum reset/drop/repair ou alteração de dados/configurações foi executado no remoto. Identidade verde/teal/Inter e componentes existentes preservados. Nenhum dado de teste foi publicado no Supabase.

## Verificações

- TypeScript e lint passaram, após corrigir o reset de seleção de foto por remount com key (a primeira tentativa com setState em effect foi rejeitada pelo lint).
- 20 testes unitários passaram: 17 existentes e três novos de mensagens/validação/rede/diagnósticos.
- Chromium 390×844, com requisições e WebSocket interceptados: reviews paginadas/edição própria, proximidade opcional, cadastro abrindo detalhe, prévia de JPEG sem upload antecipado, envio explícito e rota de login para visitante. Não é teste remoto nem teste de câmera nativa.
- Bundles iOS/Android/web gerados; nenhum binário instalado/assinado e nenhum aparelho testado.
- Manifest dos dez SQLs passou. A suíte SQL desses mesmos arquivos passou em execução anterior descartável; não foi repetida com Docker nesta continuidade.
- Inventário read-only real confirmou zero tabelas públicas, histórico ausente, Auth/Storage vazios. Runner salvou metadados e parou em migration list por DbConfigIpv6Error; nenhuma versão aplicada. O dry-run Windows de dez arquivos foi mostrado pelo proprietário em screenshot anterior.
- Backup e listagem de funções via Management API retornaram 403; não é prova de ausência de backup/funções. Uma tentativa de deploy sem Docker foi interrompida pelo consentimento do CLI antes de qualquer mudança; não foi repetida e não há deploy declarado.
- O novo postflight agregado ainda depende de schema remoto instalado. Testes reais A/B/moderador e recuperação de backup continuam pendentes.

## Arquivos

Operação: `scripts/remote-migrations.cjs`, `scripts/migrations/inventory.sql`, `preflight.sql`, `postflight.sql`, `package.json`, `docs/SEM_DOCKER.md` e documentação de status.

Aplicativo: `src/app/(tabs)/add.tsx`, `src/components/photos.tsx`, `src/components/ui.tsx`, `src/services/photos.ts`, `src/validation/errors.ts`.

Testes: `tests/errors.test.ts`, `tests/reviews-smoke.cjs`, atualização do smoke de visitante para exigir login antes de cadastrar. O smoke legado de build sem backend não foi usado para atestar este build conectado.

## Execução e próximos passos

Seguir SEM_DOCKER.md: atualizar checkout limpo, npm ci, npm run remote:prepare; verificar alternativa de recuperação/backup e executar o push manual separado somente depois do dry-run válido. Depois rodar npm run remote:verify e TESTES_REMOTOS_SPRINT_01.md. Sem alterar política de execução do Windows ou pedir credenciais pelo chat.

Permanecem pendentes: aplicação remota, Edge Functions, responsável de moderação, entrega SMTP/PKCE, estilo de mapa licenciado, fluxos de duas contas, Storage real, comparação integral com mockups e Android/iOS em aparelhos. O app pode apresentar indisponibilidade até o schema ser aplicado; nunca simula persistência.
