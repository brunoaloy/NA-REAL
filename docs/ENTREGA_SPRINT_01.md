# NA REAL — entrega incremental do Sprint 01

6 de novembro de 2026. Branch: `codex/na-real-dev`. **Sprint ainda não concluído:** schema remoto vazio e escrita SQL recusada. Este relatório distingue código validado de integração remota pendente.

## A. Funcionalidades

Preservados o projeto Expo existente, Expo Router, identidade Inter/verde/teal e componentes. Diagnóstico de entrada em AUDITORIA_SPRINT_01.md. O código anterior já oferece cadastro moderado, duplicatas com lock transacional, busca nacional/viewport, mapas MapLibre, detalhes, favoritos, compartilhamento, reviews únicas por autor/lugar, médias de aprovadas, fotos privadas e navegação para sala/perguntas. Nada disso foi recriado nem preenchido com avaliações fictícias.

Implementado nesta continuidade:

- Ordenação por proximidade no PostGIS, sob RLS do chamador, filtros nacionais e páginas de 50. Coordenadas são solicitadas somente ao acionar o botão. Sem autorização, a busca nacional continua disponível. A ordenação considera lugares com coordenadas; não exclui outras cidades por um raio arbitrário.
- Reviews em páginas de 30 com cursor composto por data/UUID. Datas iguais não perdem avaliações entre páginas.
- Consulta independente da própria avaliação, permitindo editar conteúdo mais antigo que a primeira página. As queries incluem identidade de sessão e mantêm a invalidação existente.
- Configuração pública Supabase recuperada em `.env.local` ignorado, sem sobrescrever arquivo existente e sem salvar chave administrativa.
- Teste SQL adicional e teste de regressão Chromium com fixtures interceptadas, incluindo WebSocket bloqueado. Nenhum dado de teste foi publicado no projeto real.

## B. Arquivos

| Arquivo                                                            | Alteração                                                         |
| ------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `src/app/(tabs)/index.tsx`                                         | Localização opcional e troca da ordenação                         |
| `src/services/catalog.ts`                                          | RPC de proximidade                                                |
| `src/app/place/[id].tsx`                                           | Cursor de reviews e consulta própria independente                 |
| `supabase/migrations/202611060010_nearby_reviews.sql`              | Nova RPC e índice do cursor                                       |
| `tests/sql/sprint01.sql`                                           | Proximidade, filtros, RLS e empate de datas                       |
| `tests/reviews-smoke.cjs`                                          | Regressão de interface com 35 reviews e geolocalização autorizada |
| `scripts/test-db.sh`                                               | Imagem Alpine configurável e nova suíte SQL                       |
| `package.json`                                                     | Comando `test:reviews-ui`                                         |
| `README.md`, `docs/STATUS.md`, `docs/AUDITORIA_SUPABASE_REMOTO.md` | Estado atual e execução                                           |
| `docs/AUDITORIA_SPRINT_01.md`, este relatório                      | Diagnóstico e evidências                                          |

O lockfile e dependências do aplicativo permanecem preservados. `.env.local`, caches, logs e bundles não entram no Git.

## C. Migrations e permissões

As migrations 001–010 foram aplicadas **somente no banco descartável** dos testes. A nova 010 mantém `search_places` intacta, acrescenta `search_places_near` como invoker, revoga EXECUTE de PUBLIC e concede apenas a anon/authenticated, além de índice `(place_id,created_at desc,id desc)` em reviews. Não muda políticas existentes nem reclassifica dados.

O projeto remoto autorizado `zcnfssihiqmbrlwvlsme` respondeu ACTIVE_HEALTHY. Consultas de catálogo SQL retornaram zero tabelas em public e supabase_migrations. A tentativa transacional de inicialização recebeu HTTP 400 / SQLSTATE 25006 em CREATE SCHEMA: transação somente leitura. Consultas posteriores confirmaram `current_user=supabase_read_only_user`, `transaction_read_only=on` e zero tabelas públicas. **Nenhuma migration ou política foi aplicada remotamente.** Não foram alterados papéis nem tentado contornar esse acesso.

A tentativa de CLI para deploy de funções parou na criação do diretório local de configuração em home somente leitura; não houve deploy. Como o schema remoto também está pendente, funções e pipelines reais não estão operacionais nesta sessão.

## D. Testes executados

| Verificação                                                     | Resultado atual                                                                                                                                                        |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm ci --cache /workspace/work/npm-cache --no-audit --no-fund` | Passou; tentativa inicial sem cache local falhou na home somente leitura                                                                                               |
| `npm run typecheck`                                             | Passou                                                                                                                                                                 |
| `EXPO_NO_TELEMETRY=1 npm run lint`                              | Passou; tentativa inicial sem essa variável falhou na telemetria em home                                                                                               |
| `npm test`                                                      | 17 testes unitários passaram                                                                                                                                           |
| `npm run test:db`                                               | 001–010 e suites RLS/Safe/Fase 3/Sprint 01 passaram em Postgres 17/PostGIS 3.5 descartável                                                                             |
| `npm run test:reviews-ui`                                       | Chromium 390×844: paginação com 35 datas iguais, edição própria antiga, proximidade opcional e retorno à busca nacional; zero erros JavaScript; fixtures interceptadas |
| `npm run test:functions`                                        | Deno verificou as quatro Edge Functions                                                                                                                                |
| `npm run format:check`                                          | Passou                                                                                                                                                                 |
| `npm run mobile:check`                                          | Passou configuração; IDs definitivos e vínculo EAS seguem pendentes                                                                                                    |
| `EXPO_OFFLINE=1 npx expo export --platform all`                 | Bundles iOS, Android e web gerados                                                                                                                                     |
| `npm run services:check`                                        | Formato público ready; estilo de mapa, IA e EAS ausentes; não é teste de conectividade                                                                                 |

O primeiro teste Docker com imagem Debian esgotou disco na criação do container. A imagem criada nesta execução foi removida; a variante Alpine permitiu executar e passar toda a suíte. Não foram removidos volumes existentes.

O primeiro smoke novo encontrou falta de fallback SPA no servidor estático. O teste agora serve index.html ao abrir a rota de detalhe. Outra asserção confundia “Review fixture 1” com “Review fixture 10”; foi corrigida para correspondência exata e a suíte passou. O smoke legado `test:smoke` exige build sem Supabase e não foi usado para declarar integração deste build conectado.

Não executados: autenticação SMTP remota, criação/upload/review por duas contas reais, persistência após reinício em aparelhos, mapa com tiles licenciados, APK/IPA, simulador ou dispositivo físico. SQL local e mocks de UI não substituem esses cenários.

## E. Dependências externas

1. Acesso de escrita autorizado ao banco remoto ou aplicação manual revisada das migrations 001–010 no schema vazio; não solicitar novamente o token já configurado.
2. Deploy das quatro Edge Functions, SMTP e redirects PKCE; responsável humano com safe_admins para revisão. Sem moderação, conteúdo fica pendente.
3. Estilo MapLibre de provedor licenciado em EXPO_PUBLIC_MAP_STYLE_URL, com políticas/quotas adequadas. Não há geocodificação pública irrestrita.
4. SDK Android/Xcode, development builds, identificadores definitivos e testes em aparelhos. MapLibre Native requer development build.
5. Mockups originais para comparação completa; referências visuais já versionadas foram preservadas.

## F. Erros e limites conhecidos

O app tem URL/chave pública válidas em formato, mas o banco remoto ainda não tem tabelas/RPCs; consultas funcionais continuam indisponíveis até a aplicação. Não há sucesso fictício. Os testes completos de serviços não foram executados contra esse ambiente. Avaliação de média e RLS foi validada no Postgres descartável, não em Auth/Storage reais.

Permanecem as limitações operacionais anteriores: cache offline em memória, revisão humana de estabelecimentos e fotos, rate limit de gateway/monitoramento, revisão legal e ausência de push/OAuth. A localização é uma captura para ordenar a busca; usuário pode desativar e solicitar novamente para atualizar. Fidelidade integral aos mockups e desempenho nativo não foram comprovados.

## G. Execução

```sh
npm ci
# Neste checkout a configuração pública já foi recuperada; não sobrescreva .env.local.
npm start
npm run web
npm run typecheck
EXPO_NO_TELEMETRY=1 npm run lint
npm test
npm run test:db
```

Em outro checkout, copiar `.env.example` para `.env.local` e configurar somente URL/chave publicável e estilo licenciado. Antes do teste conectado, conferir/aplicar migrations e implantar funções com acesso autorizado. Em bancos que já possuem 001–009, aplicar somente 010 após dry-run; nunca reaplicar todo o schema sobre tabelas existentes.

Nesta nuvem, exportar sem escrever configurações na home:

```sh
EXPO_NO_TELEMETRY=1 EXPO_OFFLINE=1 __UNSAFE_EXPO_HOME_DIRECTORY=/workspace/work/expo npx expo export --platform all
python3 -m http.server 8765 --bind 127.0.0.1 --directory dist
# Em outro terminal, com o servidor ativo:
npm run test:reviews-ui
```

Os bundles gerados não são binários assinados. Para aparelhos, seguir README e VALIDACAO_MOBILE.md.

## H. Continuidade recomendada

Concluir primeiro a validação conectada do Sprint 01: aplicar migrations, implantar funções e executar o roteiro com duas contas (cadastro, moderação, descoberta, review, edição, fotos, persistência e tentativa de edição por terceiro). Depois validar mapa/câmera em Android/iOS e comparar mockups. Sala e perguntas já existem no código; validar sua entrega e moderação antes de expandir notificações no sprint seguinte.

## GitHub Desktop

Atualizar o repositório NA-REAL com Fetch origin e selecionar `codex/na-real-dev`; revisar o histórico e Pull origin quando disponível. Não fazer merge automático em main. O resultado real do envio e hashes serão informados no chat; este arquivo não presume push bem-sucedido.
