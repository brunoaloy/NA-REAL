# Status — Fase 2, 6 de novembro de 2026

## Implementado nesta continuidade

Projeto anterior preservado. Auditoria detalhada em `AUDITORIA_FASE_2.md`.

- Safe: pendência por padrão em todo UGC, fila versionada, provider de IA opcional/fail-closed, revisão humana, auditoria, denúncias por conteúdo, bloqueios, suspensão e recursos. Conteúdo legado entra em revisão; não foi declarado seguro automaticamente.
- Painel protegido em `/admin`, com RBAC no servidor, decisões e motivos auditados. Fotos exigem cópia sanitizada e decisão humana.
- MapLibre Native/web, viewport PostGIS, clusters sobre resultados carregados, zoom, busca nome/cidade/UF/categoria, seleção de lugar, localização opcional e seleção de posição.
- Cadastro colaborativo com declaração de estabelecimento público, descrição, coordenadas/endereço, candidatos aproximados e bloqueio de duplicatas normalizadas no servidor.
- Fotos de lugares, reviews e perfis: câmera/galeria, compressão, limite, upload privado, sanitização de metadados no servidor, cópias imutáveis revisadas e remoção autorizada.
- Estrelas, edição/exclusão próprias, média de reviews aprovadas; cursor de mensagens e reconciliação Realtime; perguntas/respostas moderadas; relatos de movimento com validade e confirmação/contestação.
- Favoritos, acompanhamento persistido, perfil editável, histórico e preferências. Notificação interna de resposta aprovada com deduplicação. Push continua desabilitado.
- Callback PKCE/recuperação de senha; exclusão de conta com autenticação recente, limpeza Storage antes do Auth e rota web externa para hospedar.
- Cabeçalho com pin/ícones, categorias, cards, estrelas, chips de estado, hero/fotos reais quando aprovadas, espaçamento/fundo branco/Inter e navegação de três abas. Banner offline/cache em memória.

## Verificado nesta máquina

Validação final: TypeScript, lint, formatação e 11 testes unitários passaram. As sete migrações e asserts de RLS/Safe/mídia/recursos passaram em Postgres/PostGIS local descartável. Deno verificou as quatro Edge Functions. O smoke final em Chromium passou para visitante, filtros, cadastro protegido, perfil, privacidade e offline, com zero erros JavaScript. Bundles iOS/Android/web foram gerados. Prebuild gerou `ios/` e `android/` com plugins, sem instalar CocoaPods ou compilar APK/IPA. Evidências e comandos detalhados em `TESTES.md`; capturas reais em `screenshots/fase2-*`.

## Não validado com serviços reais

Nenhuma URL/chave Supabase, credencial de IA ou estilo de mapas estava configurado. Não houve chamada real de IA, upload remoto, autenticação SMTP, entrega Realtime entre dispositivos ou exclusão de conta real. Os testes locais não substituem esses fluxos. Não há Android SDK completo, Xcode ou dispositivo nesta execução; binários não foram instalados/assinados.

## Limitações de implementação restantes

- Fidelidade integral aos 12 mockups ainda não comprovada: falta arte original/splash fotográfica aprovada, refinamento final e comparação de todas as telas com dados reais aprovados. Estados sem dados usam placeholders neutros, nunca fotos/estatísticas inventadas.
- OAuth Google/Apple e push não implementados; atualizações para seguidores têm relação/preferência, mas não entrega. Notificações de respostas internas estão implementadas.
- Cache só em memória; persistência offline após fechar o app ainda não implementada. Reviews/histórico/admin têm limites de listagem sem paginação completa; mensagens e catálogo têm paginação.
- IA é triagem, sujeita a erros. Residências exigem revisão humana: declaração pública e heurísticas não comprovam uso comercial do endereço. Duplicatas aproximadas são candidatos; nomes de filiais podem exigir intervenção.
- Rate limit por IP/gateway, monitoração, expurgo de uploads órfãos e política de retenção operacional ainda precisam ser concluídos. Painel mostra fila recente, não substitui operação humana.
- Documentos legais são preliminares; faltam controlador, contato, retenção, hosting público e revisão jurídica. Exclusão web precisa ser hospedada.

## Configurar antes da validação integrada

Aplicar migrações novas 003–007 no Supabase autorizado e implantar quatro funções. Configurar chaves públicas do app, SMTP/redirects PKCE, moderador por SQL privilegiado, segredos backend opcionais de IA e estilo MapTiler/licenciado. Veja `CONFIGURACAO_EXTERNA.md`. Nenhum segredo no bundle; nenhum gasto/publicação foi iniciado.

## Próximos passos

Executar roteiro de dois usuários em Supabase de desenvolvimento; revisar legado, pipeline de mídia e exclusão. Validar mapas e câmera em development builds. Depois completar lacunas operacionais/visuais e revisão legal antes das lojas. Não é uma entrega pronta para produção ou para publicação.

## Continuidade com GitHub

Código anterior preservado em commit na branch `codex/na-real-dev`. Novo módulo: fila administrativa com filtros por estado, contagem real, ordenação estável por data/UUID e páginas de 25 itens. Denúncias e recursos mantêm seus limites próprios. Guia de sincronização no `GIT_GITHUB_DESKTOP.md`.

Verificações desta continuação: TypeScript, lint, 11 testes unitários, formatação, exportação web e smoke Chromium passaram. O primeiro smoke encontrou o servidor estático desligado; após iniciá-lo, o teste passou. A paginação administrativa ainda precisa de validação com dados no Supabase real; testes locais não comprovam essa integração remota.

## Fase 3 — módulo de correções

Implementados compartilhamento e sugestões privadas de correção com RLS, validação por campo, revisão humana, auditoria e versão esperada do lugar. Migração nova 008; aplicar após 007. TypeScript, lint e 11 testes unitários passaram. As oito migrações e asserts locais de correção/RLS/auditoria passaram em PostgreSQL/PostGIS descartável; Supabase real continua sem configuração e não foi testado.

## Fase 3 — respostas da sala

Migração 009 adiciona vínculo de resposta com integridade de sala, validação da disponibilidade da mensagem original e RPC de envio idempotente. UI identifica autores por perfil aprovado (fallback por identificador), mostra contexto sem copiar texto ocultado e preserva rascunho em falhas. Testes locais confirmaram replay sem duplicação, conflito de conteúdo e recusa de resposta em outra sala. Entrega Realtime entre dispositivos segue não validada sem Supabase real.

## Fase 3 — perguntas e histórico

Pergunta livre validada e histórico paginado de encerradas, com autores e data/hora. A tela atualiza por eventos e não permite responder a perguntas expiradas; servidor já rejeitava esses envios. Passaram TypeScript, lint e 13 testes unitários (incluindo duas novas validações de pergunta). A validação remota com duas contas ainda depende de Supabase/SMTP/redirects e não foi executada. Código mantém estados pendentes, sem simular análise ou publicação.

Validação final desta execução: nove migrações e testes SQL de correção obsoleta, permissões, replies e retry passaram; 13 unitários, TypeScript, lint, formatação e bundles iOS/Android/web passaram. Smoke Chromium passou em servidor temporário (visitante, filtros, cadastro sem backend, perfil, privacidade e offline). Não foram instalados novos binários em aparelhos nem aplicadas migrações remotas.

## Fase 4 — infraestrutura e validação

Proprietário confirmou ausência de projeto remoto; preparado alvo local com CLI Supabase 3.0.0, confirmação SMTP local, Auth/API/Storage/Realtime e suíte HTTP de duas contas que recusa host remoto. A stack real não iniciou: Docker vfs consumiu o disco (97%) durante inicialização de schema. Imagens novas foram limpas, preservando volumes/código e recuperando espaço. A suíte test:services registrou BLOCKED/código 2 antes dos cenários, não aprovação.

Adicionados checkers sem exposição de valores, proteção de chaves públicas em build/runtime, auditoria 001–009, procedimento de backup/dry-run/recuperação e perfis EAS de desenvolvimento/simulador. Passaram TypeScript/lint, 17 unitários, SQL/RLS local, carregamento Expo, rejeição de chave administrativa/produção sem bindings, mobile:check, prebuild e bundles das três plataformas. Supabase remoto, IA, mapas, e-mails externos, APK/IPA e aparelhos continuam não validados. Veja RELATORIO_FASE_4.md para tabela e ações necessárias.

Smoke final em Chromium também passou sem erros JavaScript, usando servidor temporário isolado. A suíte de serviços completos permaneceu bloqueada antes de criar contas; não substitui os resultados de SQL e interface por resultados de integração.

## Sprint 01 — continuidade atual

Relatório atual em [ENTREGA_SPRINT_01.md](ENTREGA_SPRINT_01.md). Base ea04fba recuperada do origin. Implementadas ordenação opcional por proximidade no servidor, paginação estável de reviews e consulta independente da avaliação própria. Migration 010 aditiva; schema anterior e identidade preservados.

Passaram TypeScript, lint, 17 unitários, migrations 001–010 e suites SQL/RLS no Postgres/PostGIS descartável, regressão Chromium com fixtures, Deno das quatro funções, formatação, configuração mobile e bundles iOS/Android/web. Sem teste em aparelhos nem integração Auth/Storage remota.

Supabase real agora identificado e saudável, com configuração pública recuperada em .env.local ignorado. Entretanto, SQL opera como supabase_read_only_user em transação somente leitura. Schema público/histórico vazios; inicialização recusada em CREATE SCHEMA, sem migrations remotas aplicadas. Estilo de mapa licenciado ausente. Sprint 01 não está concluído até resolver escrita, deploy e validar persistência com duas contas.

## Aplicação controlada solicitada pelo proprietário

Preparados [comandos Windows](APLICACAO_CONTROLADA_WINDOWS.md), manifest SHA-256, verificador, preflight/postflight read-only e script PowerShell que só prepara (sem push real). Novo inventário pg_catalog confirmou ausência do ledger/tabelas do app; preservada a função padrão rls_auto_enable. Link CLI e preflight passaram. Migration list/dry-run CLI ficaram bloqueados por IPv6 nesta nuvem, portanto aplicação continua pendente. Testes reais pós-aplicação preparados em TESTES_REMOTOS_SPRINT_01.md. Nenhum teste remoto de escrita foi executado; Sprint 01 permanece aberto.

## Continuidade sem Docker — estado atual

Runner Node de preparação/verificação, inventário agregado, alternativas de backup nativo/provedor e comandos em SEM_DOCKER.md. Dez migrations intactas. Cadastro protegido abre detalhe; fotos têm prévia/confirmação; erros amigáveis e tratamento de teclado. TypeScript/lint, 20 unitários, bundles das três plataformas e smoke Chromium com fixtures passaram. Nenhuma alteração de schema remoto ou deploy de função ocorreu; inventário real passou e conexão CLI nesta nuvem continua bloqueada por IPv6. Ver ENTREGA_CONTINUIDADE_SEM_DOCKER.md. Sprint 01 continua aberto.

## Correção da leitura da CLI no Windows

A execução do proprietário retornou tabela Unicode onde o runner esperava JSON. As consultas capturadas agora exigem explicitamente `--output json`; o parser trata BOM/CRLF e interrompe com mensagem segura quando a resposta é inválida, sem imprimir linhas privadas. Três regressões adicionais cobrem o formato padrão em tabela, o JSON esperado e respostas inválidas. Passaram 23 unitários. A consulta real com JSON e a captura do inventário passaram nesta nuvem; o passo posterior de migration list continua bloqueado por IPv6. Nenhuma migration foi aplicada. Não foi executado Windows nesta máquina; a correção precisa ser repetida no terminal do proprietário após Fetch/Pull.

## Correção complementar — JSON no terminal comum

Reproduzido com a CLI real em `--agent=no`: `--output json` retorna uma lista direta de linhas, enquanto o modo agent retorna `{ rows: [...] }`. A primeira correção de JSON não contemplava a lista direta. O parser agora aceita ambos, valida que cada linha seja um objeto e rejeita erros/formatos inválidos sem revelar conteúdo. Passaram 25 testes, incluindo preparação completa com CLI simulada nos dois modos e garantia de dry-run. Saídas reais de probe e inventário nos dois formatos foram lidas com sucesso; nenhum SQL de escrita foi executado e os dez hashes permanecem intactos. Testes executados em Linux, sem alegação de execução no Windows do proprietário.

## Banco remoto instalado e conferido — estado atual

Em 06/11/2026 às 19:30 Brasília, após sucesso informado pelo proprietário no Windows, leitura independente do banco confirmou **001–010 aplicadas**, histórico completo, 24 tabelas com RLS e todos os checks estruturais do postflight aprovados. Função padrão rls_auto_enable preservada. Chamadas REST reais de visitante para places/reviews/médias e buscas nacional/proximidade retornaram HTTP 200 com listas vazias. Nenhuma escrita foi feita nesta validação.

O bloqueio anterior de schema remoto vazio foi resolvido. Permanecem pendentes os fluxos reais A/B/moderador, SMTP/PKCE, cadastro/aprovação, avaliações/edição/média/persistência, fotos/Edge Functions, mapa licenciado e aparelhos. Não considerar o Sprint 01 concluído apenas pela estrutura. Evidência detalhada em AUDITORIA_SUPABASE_REMOTO.md e roteiro em TESTES_REMOTOS_SPRINT_01.md.

## Expo Go no iPhone — 07/11/2026

Adaptado o aplicativo existente para iniciar explicitamente no Expo Go, mesmo com expo-dev-client instalado. `npm run phone` inicia um túnel ngrok com dependência local e instruções para a Câmera do iPhone; há alternativas LAN e development client. Guia completo em [EXPO_GO_IPHONE](EXPO_GO_IPHONE.md).

O mapa detecta o runtime: Expo Go carrega react-native-maps, com Apple Maps no iPhone sem estilo/chave de provedor adicional. MapLibre fica isolado e é carregado apenas em development builds; a implementação web permanece a mesma. Seleção por pressão prolongada, marcadores individuais, centralização e bounds para consultas continuam disponíveis. Clusters permanecem somente no MapLibre.

Verificações desta entrega: TypeScript, lint sem avisos, formatação, 28 testes unitários, mobile:check e hashes das dez migrations aprovados. Bundles iOS e web exportados; manifesto de desenvolvimento iOS entregue com HTTP 200 e SDK 58. A regressão Chromium de avaliações, paginação, proximidade, cadastro, fotos e acesso de visitante passou com fixtures interceptadas, sem escrita remota. Não houve instalação no iPhone nem alegação de teste físico.

Bloqueio observado: `npm run phone` nesta nuvem encerrou com timeout de conexão ngrok. Probes HTTPS para api.expo.dev, connect.ngrok-agent.com e tunnel.us.ngrok.com receberam 403 do proxy. Não existe QR público desta nuvem nesta entrega. O proprietário pode gerar o QR no computador após Fetch/Pull e `npm ci`, mantendo o `.env.local` público que já usa no projeto. Nenhum token administrativo entrou no Git e nenhuma alteração foi feita no banco.

Para Auth por link em Expo Go, o callback exp:// do servidor atual precisa ser permitido nas configurações Supabase. Login por senha em conta confirmada independe desse redirect. Moderação/Edge Functions/SMTP, câmera e fluxos entre contas ainda exigem validação integrada; o catálogo público continua vazio.

## Configuração ausente no iPhone — 07/11/2026

O proprietário abriu o Expo Go, mas o bundle recebido não tinha a configuração pública do Supabase. O `.env.local` da nuvem não é transportado pelo GitHub Desktop. A inicialização anterior permitia abrir a interface nesse estado.

Adicionado `scripts/setup-mobile.cjs`: lê os arquivos de ambiente na precedência de desenvolvimento, aceita o alias ANON_KEY, verifica tipo da chave e tenta recuperar a configuração pública pela CLI local quando ausente. A saída da CLI fica privada; apenas publishable/anon validadas podem ser salvas no `.env.local` ignorado, preservando outras configurações. Falta de login permite orientação/entrada manual no terminal. Chaves administrativas são recusadas.

Os comandos Expo Go usam o mesmo launcher, que testa a RPC de busca somente leitura antes de iniciar Metro, passa os valores públicos diretamente ao processo e limpa o cache. Falhas interrompem a inicialização; nenhuma alteração de schema/dados é realizada. App e app.config aceitam o alias EXPO_PUBLIC_SUPABASE_ANON_KEY com as mesmas restrições.

Reprodução real: pasta temporária sem `.env`, recuperação pela CLI 3.0.0 autenticada e consulta HTTP ao catálogo remoto passaram. O catálogo continua vazio. As credenciais não foram impressas nem incluídas no Git. Passaram 35 testes unitários, TypeScript, lint, formatação e configuração mobile. Bundles iOS/web com apenas o alias ANON_KEY também foram exportados. Smoke Chromium desse bundle consultou o catálogo real (HTTP 200), mostrou o estado vazio e não apresentou o aviso de configuração ausente nem erros JavaScript. A execução Windows e o novo bundle no iPhone ainda dependem do Fetch/Pull e reinício pelo proprietário.

## Tela inicial e busca — 07/11/2026

Rodada solicitada pelo proprietário com foco em tela inicial/busca. A exploração agora tem busca compacta com envio pelo teclado, ação para limpar texto, categorias em chips e apresentação visual da comunidade sem números ou lugares inventados. O estado vazio diferencia catálogo inicial, pesquisa filtrada e proximidade sem resultados, com caminho para cadastrar um lugar sujeito à análise.

Filtros de cidade/UF são rascunhos até tocar em Aplicar filtros; UF inválida é recusada antes de consultar o backend. Há indicação dos filtros ativos, limpeza completa, atualização por gesto no celular e botão acessível para atualizar. Reenviar a mesma pesquisa atualiza resultados. Mapa recebe busca/categoria/cidade/UF e a posição autorizada; voltar mantém o estado da lista. O pedido opcional de GPS tem prazo de 15 segundos e mantém busca manual em caso de recusa/falha.

Arquivos principais: src/app/(tabs)/index.tsx, src/app/map.tsx, componentes compartilhados de interface/design, src/services/location.ts e src/validation/explore.ts. Sem dependências novas, migrations ou alterações no banco.

Verificações: 38 testes unitários, TypeScript, lint e formatação passaram; bundles iOS/web exportados. Novo teste `npm run test:explore-ui` em Chromium passou com fixtures interceptadas: catálogo vazio, filtros sem consultas por letra, UF inválida, aplicação, busca, categoria, passagem lista/mapa, limpeza, atualização, recuperação de falha e cadastro protegido; zero erros JavaScript. A regressão existente de avaliações, fotos, proximidade e acesso de visitante também passou com fixtures interceptadas. Validação física dessas mudanças no iPhone ainda depende de Fetch/Pull e reinício do Expo Go.
