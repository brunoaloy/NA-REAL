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

## Apresentação, login e criação de conta — 07/11/2026

Implementado o modelo aprovado pelo proprietário: abertura com paisagem ilustrativa do Rio, marca branca e ações Começar/Explorar como visitante/Entrar; login branco com campos iconográficos e recuperação; cadastro separado com confirmação de senha, termos/privacidade e aviso de confirmação por e-mail. A imagem foi gerada para o app e está em assets/images/welcome-rio.png; é um recurso visual de apresentação, não uma foto enviada pela comunidade. Expo LinearGradient é compatível com Expo Go e foi adicionado ao lockfile.

Rotas: /auth (login preservando links existentes), /signup e /recover. Componentes comuns em src/components/auth-design.tsx e auth-form.tsx. Validação em src/validation/auth.ts: e-mail normalizado, mínimo de oito caracteres no cadastro e confirmação idêntica; login mantém compatibilidade com senhas existentes mais curtas. Campos têm autofill, mostrar/ocultar e tratamento de teclado/rolagem. O fluxo bloqueia envios concorrentes e limpa as senhas após sucesso. Links PKCE e callback existentes foram preservados. Entrar a partir da apresentação leva à exploração; entrar por uma tela protegida volta ao contexto anterior.

Validações: 41 testes unitários, TypeScript, lint, formatação, configuração mobile e integridade das dez migrations passaram. Bundles iOS/web gerados; conferência visual em viewport de celular. Novo test:onboarding-ui passou em Chromium com respostas interceptadas: apresentação, validação sem pedido indevido, erro de login, visibilidade de senha, cadastro/termos, estado de e-mail, recuperação, login com navegação correta e visitante em tela de 320×568, sem transbordamento horizontal ou erros JS. Regressões da exploração e de avaliações/fotos/acesso protegido passaram. Não houve criação de contas, envio de e-mails reais ou escrita no banco. SMTP/redirect no telefone e o teclado nativo ainda exigem conferência no aparelho após Pull, npm ci e reinício do Expo Go.

## Dependência local ausente após Pull — 07/11/2026

A captura do proprietário mostrou o mesmo erro repetido: Metro não encontrou expo-linear-gradient em node_modules. O pacote está no package.json e lockfile da entrega 32aa458; a instalação local precisa ser sincronizada com npm ci, sem erro de instalação, antes de reiniciar npm run phone.

O launcher agora verifica dependências e versões do lockfile antes da configuração Supabase/Metro. Ausências ou versões antigas interrompem com orientação direta para npm ci, evitando gerar um QR que depois falha ao compilar. Novo helper scripts/check-mobile-dependencies.cjs; duas regressões cobrem pacote ausente e versão incorreta/compatível. Verificação na instalação desta nuvem e TypeScript passaram. A instalação Windows do proprietário não foi acessada nem corrigida remotamente; é necessário executar os comandos no checkout local. Sem alterações de telas ou banco.

## Experiência interna, perfil e descoberta por cidade — 07/11/2026

Aplicado o estilo acolhedor das telas de acesso à navegação interna: campos Inter, cartões suaves, botões em gradiente, abas com estado ativo e cabeçalhos adaptados. A exploração oferece acesso direto aos comércios no mapa, além das descobertas da comunidade.

Perfil: resumo com avatar/nome/descrição, edição em uma janela com dados já preenchidos, foto da galeria ou câmera e descrição. @ é opcional; histórico, favoritos, fotos e decisões ficam recolhidos. Seleção da foto é uma prévia local até Salvar alterações. Cadastro/edição de texto usam as permissões existentes; salvamento confirma a linha retornada antes de indicar sucesso. Se a foto falha depois dos textos, a mensagem informa o resultado parcial e mantém a seleção para tentar novamente. A foto pendente aparece somente ao próprio autor por URL privada; a galeria pública continua exigindo aprovação. Há confirmação antes de excluir uma foto. Trocar de conta remonta o editor e descarta o rascunho anterior.

Cadastro: removidos os campos de latitude/longitude. A pessoa informa endereço ou toca no mapa para marcar a entrada; o pino azul pode ser ajustado e confirmado. Coordenadas ficam somente na implementação. A conferência de lugares parecidos é automática no envio, com confirmação explícita para um cadastro distinto; a proteção de duplicatas do servidor permanece. Marcar posição continua opcional. O sucesso tem uma tela própria e permite adicionar outro lugar.

Mapa no Expo Go/iPhone: geocodificação nativa de cidade/endereço, centralização pela busca ou GPS e pontos de interesse do provedor habilitados. O mapa recebe a cidade escolhida na lista. Os comércios e nomes de ruas do Apple Maps são diferentes dos pins verdes da comunidade NA REAL. Não houve importação de um diretório externo nem promessa de todos os comércios: cobertura, disponibilidade e nomes dependem do provedor e do nível de zoom. Há atalho para buscar comércios no aplicativo Mapas. O geocodificador retorna posição aproximada, exige rede e pode não resolver um endereço; o usuário pode ajustar a entrada. No Android ele pode solicitar permissão; na web há orientação para o celular/marcação manual, sem simular uma busca bem-sucedida. MapLibre/web continuam dependendo do estilo licenciado.

Não foram adicionados pacotes, chaves ou serviços pagos. Nenhuma migration, configuração Auth remota ou dado real foi alterado. Passaram 48 testes unitários, TypeScript, lint sem avisos, formatação, configuração mobile e integridade das dez migrations. Bundles iOS/web exportados. Smokes Chromium de perfil/cadastro, exploração, apresentação/login e avaliações/fotos passaram com APIs interceptadas e zero erros JavaScript. O novo teste inclui perfil criado só com nome, edição preenchida, @ preservado, seleção antes do upload e falha parcial preservando a foto anterior. Geocodificação real, pontos de interesse, câmera/corte e persistência real com Storage precisam ser conferidos no iPhone; não foram declarados aprovados por esses testes simulados. Roteiro em TESTES.md.

## Visita ao lugar e preparação de teste real — 07/11/2026

Detalhes reorganizados com galeria de até seis fotos aprovadas, ampliação, endereço/rota, favorito com confirmação da persistência e abas compactas. Avaliação exige seleção explícita de estrelas; os rascunhos de avaliação e sala ficam separados e preservados ao trocar de aba. Ações secundárias ficam recolhidas. O perfil permite reencontrar os próprios lugares pendentes; avaliações, sala e atualizações públicas continuam aguardando aprovação do lugar.

Sem novas dependências ou migrations. TypeScript, lint, 50 testes unitários e configuração mobile passaram; bundles iOS/web exportados. Testes Chromium de detalhes, avaliações/fotos e perfil/cadastro passaram com respostas interceptadas, sem erros JavaScript. Eles não comprovam gravações reais ou funcionamento dos recursos nativos no iPhone.

A API de consulta de leitura do Supabase respondeu: zero lugares aprovados, dois pendentes e zero moderadores. Nenhuma alteração foi feita no banco. Listagem de Edge Functions retornou HTTP 403, sem confirmação dos deployments. O proprietário tem uma conta; falta uma segunda conta confirmada para a validação entre pessoas. É necessário definir o responsável pela moderação e revisar os cadastros para testar a jornada pública. Roteiro e limites: [VALIDACAO_VISITA_IPHONE.md](VALIDACAO_VISITA_IPHONE.md).

## Design de descoberta, mapa e perfil — 08/11/2026

Aplicados os seis pontos aprovados: abertura de Explorar com cidade e busca, cartões com fotos maiores e alternativa ilustrada, identidade consistente com fundo suave, prévia sobre a parte inferior do mapa ao selecionar pin, estados vazios acolhedores e perfil com edição em destaque e coleções agrupadas. Informações e fotos continuam vindo dos serviços existentes; não houve conteúdo fictício no app, pacote novo, migration ou alteração no banco.

O teste real de seleção no canvas WebGL revelou que o worker do MapLibre 6 não era distribuído ao lado do bundle Metro. A configuração Metro agora prepara worker/licença da versão instalada como arquivos estáticos locais ignorados pelo Git. O cliente web aponta para esse worker; Expo Go continua usando o mapa nativo. Detalhes e roteiro: [DESIGN_DESCOBERTA.md](DESIGN_DESCOBERTA.md).

Verificação desta rodada: 50 testes unitários, TypeScript, lint, formatação e configuração mobile passaram. Bundles iOS/web gerados. Smokes de exploração, perfil/cadastro, detalhes, avaliações/fotos e apresentação/login passaram com respostas interceptadas. O novo smoke de design passou com uma imagem de fixture e estilo local, incluindo seleção efetiva do pin no canvas WebGL, fechamento da prévia e navegação ao lugar, além de ausência/falha de foto e layout em 320 px. Nenhum desses testes substitui a conferência do mapa, câmera, teclado e fontes ampliadas no iPhone físico. Nenhuma gravação remota foi executada nesta rodada.

## Preparação do piloto em iPhones — 08/11/2026

Busca com sugestões offline de 5.571 municípios da fonte licenciada MIT, seleção de UF, última cidade lembrada no aparelho e restauração antes da primeira consulta ao catálogo. Limpar busca/filtros também remove essa preferência. O centro aproximado do município abre a região no mapa; nunca é usado como posição de um comércio no cadastro. Cartões da exploração com coordenadas oferecem acesso ao pin selecionado.

Cadastro em quatro passos, com validação ao avançar, rascunhos preservados ao voltar, localização por endereço/pino opcional e foto selecionada antes do envio. A foto só é enviada depois de criar o lugar. Falha parcial permite reenviar apenas a foto. A confirmação não navega automaticamente ao detalhe: oferece acompanhamento da aprovação no perfil. Troca de conta remonta o formulário. Moderação tem atalho no perfil condicionado ao RPC safe_is_admin. Guia de testes fica nas configurações e não transmite respostas do checklist.

O proprietário informou que terá apenas iPhones no primeiro grupo e ainda não tem Apple Developer Program. Preparados perfil EAS testflight com Apple Maps, verificação de identidade/EAS, roteiro Expo Go/TestFlight e planilha vazia de feedback. A verificação de distribuição identificou corretamente bundle provisório e projeto EAS não vinculado; não houve build, cobrança, assinatura, submissão ou convite.

Conta do proprietário confirmada pela consulta remota. As tentativas autorizadas de incluir a permissão de moderação foram recusadas com SQLSTATE 25006. A conexão retorna supabase_read_only_user e transaction_read_only=on. Nenhuma permissão ou dado remoto foi alterado. Os dois Samy de Osório foram identificados como demonstração pelo proprietário e autorizados para exclusão; não foram aprovados. Há uma foto vinculada. SQLs operacionais separados em scripts/pilot preparam a inclusão do moderador e a limpeza dos dois IDs, com bloqueio enquanto os arquivos da foto existirem no Storage ou houver novas contribuições. Esses SQLs não foram executados; exigem SQL Editor/conexão de escrita autorizada. Detalhes: PILOTO_IPHONE.md.

Passaram 54 testes unitários, TypeScript, lint sem avisos, formatação e configuração mobile. Bundles iOS/web exportados. Novo smoke do piloto passou com APIs interceptadas: sugestões sem rede, cidade restaurada, lista/pin, passos/retorno, duplicatas, foto adiada, falha parcial/reenvio sem novo lugar, acompanhamento, atalho de moderação e guia em tela estreita. Regressões de exploração, perfil/cadastro, detalhes, avaliações/fotos e apresentação/login passaram com fixtures e zero erros JS. Persistência real, moderação real, links de e-mail, duas contas, Storage, câmera e ajustes de acessibilidade no iPhone continuam pendentes antes do grupo.

## E-mails NA REAL, acompanhamento e feedback — 08/11/2026

Preparados modelos HTML de confirmação e recuperação, assuntos em português e remetente NA REAL. Mantido o link ConfirmationURL do Supabase/PKCE; os modelos não usam imagens/fontes externas nem rastreamento. TOML local referencia os templates, sem alterar automaticamente o servidor. Script auth-email:prepare gera payload com cinco campos em diretório ignorado; auth-email:apply aplica somente identidade/assuntos/conteúdo e verifica a resposta sem expor configurações sensíveis.

O proprietário informou não ter domínio ou serviço de envio. Leitura e tentativa autorizada de atualização da configuração Auth foram recusadas com HTTP 403. Os modelos ainda não estão ativos no projeto hospedado; SMTP, domínio verificado e permissão auth:write/configurações Auth são necessários para concluir. Não foi enviado e-mail real nem contratado serviço. Guia: EMAIL_NA_REAL.md. Consulta SQL real confirmou sessão read-only, zero moderadores, dois lugares e duas fotos no total; não houve alteração remota de permissões ou dados. Moderação e limpeza autorizada dos cadastros de demonstração continuam pendentes do acesso de escrita descrito no roteiro do piloto.

Perfil mostra a versão mais recente de cada contribuição, status e motivo correspondente à decisão atual, sem exibir motivo antigo como se fosse vigente. Pedidos de revisão têm rascunho por contribuição, preservado em falhas. Avaliações podem abrir a aba correta para edição; o perfil também indica seus caminhos existentes de correção. Não foi concedida edição direta de lugares pendentes no banco. Feedback mostra os textos e dados básicos do aparelho antes de abrir o compartilhamento escolhido pela pessoa, sem coletar automaticamente e-mail, identificadores, sessão, localização ou capturas. Cancelar mantém o rascunho; não há confirmação fictícia de entrega nem envio para servidor de feedback.

Passaram 57 testes unitários, TypeScript e lint. Novo smoke Chromium verificou contribuição atual/motivo, falha e reenvio de pedido, abertura da avaliação para editar, validação/cancelamento/compartilhamento simulado e layout em 320 px, com zero erros JS e sem mensagens reais. Regressões de perfil/cadastro, detalhes, avaliações/fotos e apresentação/login passaram com fixtures. Bundles iOS/web exportados. Os templates foram renderizados localmente em 390 e 320 px sem transbordamento horizontal; isso não comprova aparência em todos os clientes de e-mail nem entrega SMTP. Testes de e-mail, duas contas, Storage e iPhone físico seguem pendentes.

## Revalidação de acesso e opções de domínio — 09/11/2026

A conferência real confirmou conta do proprietário com e-mail confirmado, sem permissão de moderador; catálogo público vazio; dois cadastros de demonstração ainda presentes, com uma foto diretamente vinculada e sem avaliações/mensagens vinculadas. Banco retorna supabase_read_only_user/transaction_read_only=on, inclusive no teste sem mutação com read_only=false; configuração Auth retorna 403. O desktop consultado não tinha painel Supabase aberto. Nenhuma alteração remota foi feita.

O proprietário escolheu conectar escrita pelo ambiente seguro e pediu opções de domínio antes de qualquer contratação. Preparada comparação em OPCOES_DOMINIO_EMAIL.md com três sugestões de nome e dois provedores SMTP, sem afirmar disponibilidade, preços ou cotas. Consultas aos sites dos fornecedores foram bloqueadas pela rede; não houve contratação, registro, criação de conta, convite ou envio de e-mail. A checagem local de distribuição identificou bundle provisório e EAS não vinculado. A execução remota continua aguardando conexão efetiva de escrita; a declaração de intenção não foi tratada como acesso já disponível.
