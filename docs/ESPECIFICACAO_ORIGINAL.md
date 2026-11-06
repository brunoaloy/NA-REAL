# PROMPT MASTER — NA REAL | iOS + Android | MVP funcional

Você é meu arquiteto de software, product designer sênior, desenvolvedor full-stack mobile, especialista em segurança de aplicações com conteúdo gerado por usuários e líder técnico de QA. Sua missão é CONSTRUIR, e não apenas descrever, a primeira versão funcional de um aplicativo chamado **NA REAL**, com código real, banco de dados, testes e preparação para publicação no iOS e Android.

## 0. MODO DE TRABALHO OBRIGATÓRIO

1. Inspecione o repositório e os arquivos existentes antes de alterar qualquer coisa. Preserve trabalho útil já implementado. Se o repositório estiver vazio, inicialize a solução.
2. **Existe uma imagem de referência anexada a esta conversa/tarefa, com 12 mockups e o design system do NA REAL.** Inspecione-a visualmente e use-a como fonte primária para estilo, composição e consistência. Se não conseguir acessar a imagem, informe isso e continue usando a descrição de design detalhada abaixo. Não finja que a visualizou.
3. Primeiro crie `docs/PLANO_IMPLEMENTACAO.md` com arquitetura, modelo de dados, telas, dependências, riscos, etapas, critérios de aceite e decisões justificadas. Em seguida, **execute o plano e implemente o código**. Não pare apenas no planejamento nem entregue só telas estáticas.
4. Trabalhe por fases coerentes, mantendo a aplicação executável ao fim de cada uma. Documente o progresso em `docs/STATUS.md`: concluído, parcialmente concluído, bloqueado e próximo passo, com evidências de testes.
5. Não solicite confirmação para escolhas técnicas rotineiras. Use defaults seguros. Peça intervenção humana somente para credenciais, contas externas, decisões legais/de custo, ou bloqueios reais. Nunca invente chaves, contas, aprovações, resultados de testes ou publicações em lojas.
6. Não apresente dados falsos como se viessem da comunidade. Dados de exemplo são permitidos apenas em ambiente de desenvolvimento, claramente rotulados e isolados de produção.
7. Não coloque chaves privadas, service_role ou segredos no bundle mobile. Use variáveis de ambiente, backend/Edge Functions e políticas de acesso mínimas.
8. Em toda fase, rode verificações viáveis (typecheck, lint, testes, migrações quando houver infraestrutura, build quando houver credenciais) e corrija falhas. Se não puder executar uma verificação, explique precisamente por quê e como reproduzi-la.
9. Priorize simplicidade visual, usabilidade e robustez. Não adicione recursos fora do escopo sem necessidade.
10. Use documentação oficial atual e versões estáveis compatíveis; não fixe APIs obsoletas. Respeite as limitações de integração e licenças dos provedores externos.

## 1. VISÃO DO PRODUTO

**Nome de trabalho:** NA REAL (validar disponibilidade legal e nas lojas depois; não afirmar exclusividade).
**Slogan:** "Descubra. Avalie. Compartilhe." ou "Cada lugar tem uma comunidade."
**Público inicial:** pessoas no Brasil que procuram lugares, querem avaliar experiências, perguntar algo sobre um local ou consultar informações recentes.
**Distribuição:** app nativo compilado para iOS e Android, disponível nacionalmente após aprovação das lojas. Não é apenas um site embrulhado em WebView.

### Proposta principal
Qualquer pessoa pode pesquisar lugares no Brasil e consultar suas páginas. Usuários autenticados podem cadastrar novos lugares, publicar notas, comentários e fotos, seguir lugares, fazer perguntas e participar da sala pública vinculada a cada local. Pessoas que frequentam o local podem responder perguntas como "Está lotado?", "Tem fila?" ou "Está atendendo?". Informações temporárias têm horário, fonte e validade; nunca são tratadas como confirmação universal.

### Cinco princípios de produto
- **Útil sem rede de amigos:** visitantes navegam em lugares e avaliações públicas sem cadastro.
- **Cada lugar vira uma comunidade:** um local aprovado tem uma página e um feed comunitário.
- **Reputação != momento atual:** nota média e reviews são permanentes; fila/movimento são relatos temporários.
- **Brasil inteiro desde o início:** pesquisa por cidade, estado e mapa nacional; criação de novos lugares disponível nacionalmente. A cobertura dos dados pré-carregados deve ser informada com honestidade.
- **Um toque para contribuir:** respostas rápidas, feedback imediato, poucos campos, navegação acessível.

## 2. REFERÊNCIA VISUAL APROVADA — NÃO REINVENTAR O LAYOUT

A imagem aprovada mostra 12 telas com visual mobile claro, arejado e elegante, marca "na real." com símbolo de pin, verdes escuros e verdes vivos, cartões arredondados, bordas suaves, fotografias reais de locais, tipografia Inter e barra inferior discreta.

### Design tokens iniciais (ajustar ligeiramente apenas se necessário para contraste WCAG)
- Cor principal: `#0F766E` (teal/verde-escuro)
- Verde de destaque: `#10B981` ou `#22C55E` onde fizer sentido
- Fundo: `#FFFFFF` e `#F8FAFC`
- Superfície suave: `#F1F5F9`
- Texto principal: `#1F2937`
- Texto secundário: `#64748B`
- Azul auxiliar limitado: `#3882F6`
- Aviso/atenção: `#F59E0B`
- Erro: `#EF4444`
- Fonte: **Inter**, incluindo Regular, Medium, Semibold, Bold; usar pesos moderados.
- Cantos de cartões: 14–20 px; botões: 12–16 px; chips em forma de pílula.
- Sistema de espaçamento baseado em 4/8 px. Áreas tocáveis acessíveis, foco visível, Safe Areas e Dynamic Type.
- Iconografia: linha simples e consistente (Lucide ou equivalente compatível com Expo).
- Suporte a tema claro como padrão; preparar tokens para dark mode futuro sem sacrificar prazo do MVP.
- Microinterações discretas; priorizar performance em Android intermediário e acessibilidade.

### Design obrigatório da navegação
Barra inferior com somente **Explorar**, **Adicionar**, **Perfil**. Busca e alternância Lista/Mapa ficam dentro de Explorar. As abas Avaliações, Ao vivo e Sala/Comunidade ficam dentro da página de cada lugar. Notificações acessíveis por ícone no topo. Nunca transformar todas as telas em itens de menu inferior.

### Telas previstas da imagem
1. Splash / boas-vindas.
2. Entrar / cadastrar-se por e-mail, Google, Apple quando configurados; acesso visitante.
3. Explorar em lista com busca, filtros e cards de lugar.
4. Explorar em mapa com pins e card do lugar selecionado.
5. Detalhes do lugar com foto, nota, endereço e "Como está agora?".
6. Sala do local com mensagens públicas, perguntas e relatos.
7. Adicionar um lugar com formulário simples.
8. Avaliar com estrelas, texto e foto opcional.
9. Perfil, contribuições e favoritos.
10. Notificações.
11. Busca avançada e filtros.
12. Modal de pergunta rápida.
Também construir estados vazios, erro, carregando, offline, sem permissão, lugar pendente de revisão, conteúdo removido, usuário bloqueado e páginas de configurações/privacidade.

Entregar componentes reutilizáveis: `AppHeader`, `SearchBar`, `CategoryChip`, `PlaceCard`, `RatingStars`, `StatusChip`, `PlaceHero`, `LiveReportCard`, `QuestionCard`, `MessageBubble`, `PhotoPicker`, `EmptyState`, `ErrorState`, `LoadingSkeleton`, `BottomTabs`, `PrimaryButton`, `ConfirmDialog`.

## 3. STACK E ARQUITETURA

- React Native + **Expo** + **TypeScript** com configuração estrita.
- **Expo Router** para navegação, deep links e organização das rotas (respeitar recomendações da versão instalada).
- **Supabase**: Auth, PostgreSQL, Storage e Realtime; Edge Functions para operações privilegiadas, rate limits, notificações e administração.
- **PostGIS** para consultas geoespaciais e índices GiST; pesquisa textual com índices adequados (`pg_trgm`/full-text conforme aplicável).
- **TanStack Query** para consulta/cache/estados assíncronos; uma solução leve para estado local (Context/Zustand somente se houver necessidade real).
- Validação compartilhada com Zod ou equivalente em fronteiras do sistema; validar também no servidor e no banco.
- Mapas: MapLibre ou solução equivalente compatível com Expo e licença; camadas/tiles fornecidos por **provedor configurável apropriado para produção**. Não depender de tiles OSM gratuitos para tráfego nacional em produção.
- Geocodificação/places: provedor licenciado e configurável, ou base de dados aberta importada de fonte compatível com a licença, sem scraping e sem violar limites. Não implementar autocomplete em `nominatim.openstreetmap.org` nem usar a API pública do Nominatim como backend nacional. Para locais de autoria da comunidade, manter banco próprio e busca própria.
- Expo Notifications para push; tokens e inscrições gerenciados com segurança no backend.
- Painel administrativo web mínimo e protegido (`apps/admin` ou projeto claramente separado), para revisão de cadastros, denúncias e remoção de conteúdo, sem exigir uma plataforma de administração complexa.
- Estrutura de diretórios modular por feature com camadas `screens`, `components`, `services`, `hooks`, `types`, `validation`, além de `supabase/migrations`, `supabase/functions`, `docs`, `tests`.

A instalação de dependências deve verificar compatibilidade das versões do Expo SDK e módulos nativos. Serviços que necessitem de development build devem estar documentados; não presumir que tudo roda no Expo Go.

## 4. DADOS / MIGRAÇÕES / MODELO MÍNIMO

Criar migrações SQL versionadas, seeds somente de desenvolvimento e documentação ERD. Modelo sugerido (pode normalizar com justificativa):

- `profiles`: `id` do Auth, nome exibido, handle único, avatar, bio opcional, created_at, status; nunca expor e-mail público.
- `places`: UUID, nome, nome normalizado, descrição, categoria, endereço público, cidade, estado UF, país BR, latitude/longitude, geografia PostGIS, fonte (`community`/`osm`/provedor), `external_source_id` opcional, `created_by`, `verification_status` (`pending`/`approved`/`rejected`/`merged`), timestamps.
- `place_photos`: lugar, uploader, caminho de arquivo, estado de moderação, ordenação, timestamps.
- `reviews`: lugar, usuário, nota inteira de 1 a 5, comentário, estado de moderação, timestamps, constraint de no máximo **uma avaliação ativa por usuário por lugar** (permitir editar).
- `review_photos`: mídia vinculada à avaliação, tipo e moderação.
- `favorites` e `place_follows`: relações usuário/lugar com unicidade.
- `place_messages`: mensagens da sala pública, autor, texto, status/moderação, timestamps; paginação por cursor; limites por mensagem.
- `place_questions`: lugar, autor, tipo (`movement`, `queue`, `open`, `parking`, `accessibility`, `other`), texto, categoria de urgência, status, created_at, expires_at opcional.
- `question_answers`: pergunta, autor, texto opcional, resposta rápida categórica quando aplicável, created_at, estado de moderação, origem da confirmação; não assumir veracidade.
- `live_reports`: lugar, autor, tipo, valor estruturado, observação opcional, created_at, expires_at, sinalizadores de confirmação/contestação, status de moderação.
- `report_confirmations`: evidências/feedback de outros usuários, impedir repetição do mesmo usuário para mesmo relato.
- `notifications`: destinatário, tipo, título, corpo, destino, lida_em, created_at; `notification_preferences` e `push_tokens` em acesso restrito.
- `content_reports`: denunciante, objeto denunciado, motivo, comentário, status, timestamps; evitar denuncias duplicadas abusivas.
- `user_blocks`: bloqueador, bloqueado, timestamps.
- `moderation_actions`: trilha de auditoria de ações administrativas.
- `place_change_suggestions`: correções de endereço/nome/categoria/posição enviadas para moderação.

Adicionar índices de busca, cidade/UF, `places.geom` espacial, índices para mensagens por lugar/tempo, perguntas em aberto e relatórios ativos. Deixar integridade explícita com FK, constraints e checagens, índices e tratamento de soft-delete quando necessário.

A nota média deve ser calculada apenas com avaliações aprovadas, de forma consistente no servidor (view, RPC ou agregados transacionais), evitando manipulação por campo de média enviado pelo cliente. Mantenha autoria, proveniência e horário de cada informação.

### Dados geográficos e licenças
- Um lugar vindo de fonte externa não deve ser confundido com lugar criado por usuário. Salvar proveniência/licença/atualização quando aplicável.
- Respeitar ODbL e atribuições exigidas do OpenStreetMap; documentar implicações para dados derivados, separação de dados e distribuição.
- Nunca copiar avaliações, fotos ou conteúdo proprietário do Google Maps.
- A funcionalidade deve permitir buscas em qualquer cidade do Brasil, mas **não prometer cobertura completa pré-carregada** sem uma fonte/licença/ingestão que a suporte.
- Para MVP, se não houver fornecedor configurado, oferecer busca do próprio catálogo de lugares e cadastro colaborativo em qualquer cidade; mostrar claramente cobertura disponível.
- Em provedores que cobram por consulta, inclua cache, debounce e limites; não habilitar gastos sem configuração explícita.

## 5. FLUXOS FUNCIONAIS — IMPLEMENTAR DE PONTA A PONTA

### A. Visitante, onboarding e autenticação
- Splash leve, onboarding opcional e acesso sem login para buscar, ver mapa, notas, fotos públicas, relatórios e conversas públicas.
- Para postar, cadastrar, avaliar, seguir, comentar ou responder, solicitar autenticação sem perder o contexto anterior.
- Login por e-mail funcional e recuperação de acesso; preparar Google Sign-In e Sign in with Apple corretamente, usando configuração real e indicando credenciais necessárias. Não simular OAuth.
- Perfil editável: foto, nome, handle. Excluir conta dentro do app e oferecer fluxo web externo de exclusão para requisito Google Play.
- Solicitar localização apenas quando útil e após gesto contextual; sempre permitir busca manual de cidade. Não fazer rastreamento em segundo plano.

### B. Explorar / lista / mapa
- Buscar por nome de lugar, cidade, UF e categoria; autocomplete apenas via serviço próprio/provedor autorizado.
- Lista com imagem, nome, categoria, nota e número real de avaliações, situação recente apenas se houver dados válidos; sem dados, exibir "Sem atualização recente".
- Mapa com marcadores, clustering/limite de viewport, card no toque e alternância para lista. Não buscar todos os lugares do Brasil em uma chamada.
- Paginação, estados vazios, loading, error retry e cache de consultas. Filtros de categoria, avaliação e "com relatos recentes".
- Botão de adicionar lugar claro em buscas sem resultados.

### C. Adicionar lugar
- Nome, categoria, cidade/UF, endereço ou localização por pin, descrição/foto opcional.
- Antes de criar: detectar duplicatas por proximidade espacial, nome normalizado e fonte externa. Mostrar candidatos e abrir página existente.
- Validação no servidor, rate limit e estado `pending` caso necessário. Não publicar cadastros suspeitos sem moderação.
- Locais residenciais privados ou potencialmente invasivos não podem ser listados como estabelecimentos públicos.
- Após aprovação: página pública única e sala pública logicamente associada àquele lugar (não precisa criar sala física separada no banco).

### D. Detalhes do lugar
- Capa/fotos, nome, categoria, endereço, nota média e quantidade de avaliações válidas, botão favoritar/seguir, compartilhar, sugerir edição e denunciar.
- Seções: `Geral`, `Avaliações`, `Ao vivo`, `Sala` com navegação simples e consistente com imagem, adaptando a hierarquia sem poluir a UI.
- Em `Ao vivo`: card "Como está agora?", botão `Perguntar agora`, lista cronológica de relatos recentes com horário e sinalização de confiabilidade.
- Separar explicitamente dados fornecidos pelo estabelecimento, dados cadastrais, relato de uma pessoa e informação confirmada pela comunidade.

### E. Avaliações
- 1–5 estrelas, comentário com limite de tamanho e fotos opcionais (compressão e remoção de EXIF de localização sensível).
- Autor pode criar/editar/remover sua avaliação. Proibir duplicatas ativas e atualizações de nota por terceiros.
- Lista filtrável/ordenável, com estado vazio. Denunciar avaliação, moderação e bloco de usuário.
- Não conceder reputação maior automaticamente a quem dá notas positivas.

### F. Sala pública de cada lugar
- Chat persistente e em tempo real, com mensagens paginadas e carregamento incremental.
- Filtros/abas leves: `Conversas`, `Perguntas`, `Ao vivo`; no MVP são visões do mesmo local, não canais isolados difíceis de povoar.
- Escrever, enviar, receber, responder a mensagem, reações simples se não atrapalharem o escopo, denunciar, bloquear, excluir as próprias mensagens.
- Mostrar presença em sala **somente se a pessoa optar** por exibir presença online; nunca sugerir presença física a partir da presença no chat.
- Autor da mensagem não pode editar IDs nem passar por outro usuário. Aplicar rate limit, validação e moderação.
- Configurar Supabase Realtime por canais autorizados, preferindo Broadcast/abordagem indicada pela versão atual. Reconciliar eventos com o banco, tratar reconexões e mensagens duplicadas.

### G. Perguntar agora / pergunta rápida
- Modal com tipos: `Movimento no local`, `Fila`, `Funcionamento`, `Estacionamento`, `Outra dúvida`.
- Textos sugeridos contextualizados e envio com 1–3 toques. Pergunta criada aparece na Sala e em Ao vivo/Perguntas conforme tipo.
- Permitir resposta por botão rápido (`Tranquilo`, `Moderado`, `Cheio`) e comentário opcional quando adequado; outros tipos usam categorias apropriadas.
- Perguntas urgentes expiram após 60 min por padrão; relatos sobre movimento após 30 min por padrão (configuráveis), enquanto perguntas gerais podem permanecer pesquisáveis.
- Quando não houver respostas, informar "Aguardando respostas" e depois "Sem informações recentes". Nunca inventar fila, pessoas online ou movimento.
- Notificar autor quando houver resposta; notificar seguidores do lugar com opt-in e rate limits. Não disparar push para todos da cidade.
- Permitir confirmar/contestar relato. Exibir horário do relato e quantidade de confirmações somente quando verificáveis; com poucas confirmações usar rótulo `Relato de usuário`, não `Confirmado`.

### H. Perfil, favoritos, contribuições e notificações
- Perfil público com contribuições válidas e lista de avaliações, com limites de privacidade.
- Favoritar e seguir lugar com diferença clara: favorito é lista pessoal, seguir é receber atualizações opcionais.
- Central de notificações com lidas/não lidas, preferências e deep link para pergunta/resposta/lugar.
- Push via opt-in, preferência por tipo, deduplicação, limites de frequência, cancelamento de token inválido.
- Conquistas cosméticas podem ser acrescentadas depois, sem recompensar spam ou manipulação de notas.

### I. Moderação e privacidade
- Denunciar lugar, mensagem, pergunta, resposta, foto e avaliação; bloquear usuários.
- Filtro inicial de conteúdo proibido com camada no servidor e fila para revisão humana, evitando bloqueio automático irrecorrível de críticas legítimas.
- Painel admin autenticado, com RBAC verificado no servidor; ações de aprovar/rejeitar/mesclar lugares e ocultar conteúdos/avaliar denúncias, sempre auditadas.
- Rate limits por usuário, IP e ação no backend. Proteção contra spam, envio em massa e criação de lugares falsos.
- Não coletar localização exata continuamente; permitir que usuário a forneça só para consulta próxima e, se desejar, validação privada de relato. Nunca publicar localização pessoal ou histórico de trajetos.
- Não exigir foto, localização ou contatos para usar funções sem necessidade.
- Termos de uso e política de privacidade claros, contato para denúncias, exclusão de conta e dados relacionados, procedimento de contestação, LGPD e requisitos atuais das lojas.

## 6. SEGURANÇA OBRIGATÓRIA

- Migrar todas as tabelas expostas com RLS habilitado, **grants mínimos explícitos**, políticas por operação e testes positivos/negativos para papéis anon, authenticated e admin.
- Usuário comum nunca pode modificar conteúdo de outra pessoa, alterar `author_id`, autoaprovar moderação, ajustar contadores/nota, ler tokens push ou acionar tarefas administrativas.
- Service-role estritamente no backend e jamais no app. Proteger Edge Functions e armazenamento.
- Usar URL assinada e políticas adequadas quando mídia não for pública; mídia pública somente após validação e moderação apropriadas.
- Proteção contra upload abusivo: tipos MIME, tamanho, compressão, formatos e verificação de extensão, quota por usuário.
- Resguardar chaves em arquivos `*.env.example` sem segredos, e gitignore correto. Não escrever dados privados em logs.
- Evitar injection em consultas/RPC/SQL, abusos de notificações e excesso de dados retornados.
- Garantir exclusão de conta e respectivos dados conforme políticas e leis; retenções legais excepcionais precisam ser transparentes.

## 7. REGRA CRÍTICA: NÃO FINGIR FUNCIONALIDADES

O software final não pode ter botões que apenas mostram um Toast de "Sucesso" sem persistir a ação. Em particular, devem funcionar com backend real e regras de acesso:
- Criar conta / login / logout.
- Pesquisar lugares do banco, abrir detalhe e mostrar dados verdadeiros.
- Cadastrar lugar e consultar status de aprovação.
- Avaliar e editar a própria avaliação.
- Adicionar aos favoritos / seguir.
- Publicar mensagem em sala e ver a mesma mensagem em outro dispositivo autenticado.
- Criar pergunta, enviar resposta e receber mudança em tempo real.
- Enviar denúncia.
- Consultar notificações internas e configurar preferências.

Se um recurso externo depender de conta/chave/contrato, entregar a interface de configuração, implementação possível, documentação de setup e estado explícito "Não configurado" — nunca simular integração em produção. Não afirmar que há push ou login social funcionando sem teste real.

## 8. ETAPAS DE EXECUÇÃO

**Fase 0 — Auditoria e planejamento**
- Inspecionar repositório e referência visual.
- Decidir estrutura do monorepo ou app único + admin.
- Criar `docs/PLANO_IMPLEMENTACAO.md`, arquitetura, roteiro e riscos.

**Fase 1 — Fundação visual/navegação**
- Inicializar Expo TypeScript e instalar dependências compatíveis.
- Implementar design tokens e componentes compartilhados.
- Construir as 12 telas com navegação real e estados de carregamento/vazio/erro, mantendo fidelidade à imagem.
- Rodar lint/typecheck e testes básicos.

**Fase 2 — Backend e catálogo**
- Migrações Supabase, PostGIS, Auth, RLS, Storage, seeds de teste.
- Lista/mapa de lugares e busca real do catálogo, login e cadastro colaborativo.
- Detecção de duplicidade, moderação mínima e carregamento geográfico seguro.

**Fase 3 — Reputação/comunidade**
- Avaliações, fotos, favoritos, seguir lugar, perfil.
- Sala em tempo real, perguntas, respostas e relatos temporários.
- Realtime seguro, reconexão, estados sem atividade e limites contra spam.

**Fase 4 — Confiança, notificações e administração**
- Denúncias, bloqueios, moderação, painel de administração protegido.
- Notificações internas e push quando configurado.
- Exclusão de conta e superfície externa, documentos de privacidade e testes de permissões.

**Fase 5 — Preparação para publicação**
- Otimização de desempenho, acessibilidade, crash reporting, deep links, analytics de eventos sem dados sensíveis.
- Testar Android e iOS em builds de desenvolvimento/produção conforme credenciais disponíveis.
- Configurar `app.config`/`app.json`, `eas.json` e IDs de pacotes **provisórios e claramente identificados**, sem pressupor nome/domínio disponível.
- Preparar checklist App Store e Google Play: screenshots, ícones, splash, descrições pt-BR, classificação etária, política de privacidade, Data Safety, permissões, conta de avaliação e exclusão de conta.
- Não submeter à loja nem efetuar gastos sem autorização explícita do dono.

## 9. TESTES E CRITÉRIOS DE ACEITE

Criar testes automatizados proporcionais (unitários, integração/RLS e E2E de fluxos críticos com ferramenta compatível; se E2E não for possível, roteiro manual detalhado). Cobrir obrigatoriamente:

1. Visitante pesquisa e abre local sem login.
2. Novo usuário cria conta e cadastra local válido.
3. Cadastro duplicado é detectado ou encaminhado a revisão.
4. Usuário A publica avaliação e usuário B enxerga resultado aprovado.
5. Usuário A faz pergunta, usuário B responde em outro dispositivo e A vê atualização ao vivo.
6. Relato expirado deixa de aparecer como situação atual.
7. Sem respostas recentes, aparece estado neutro, nunca uma condição inventada.
8. Usuário B não edita/deleta avaliação, mensagem, perfil ou tokens de A.
9. Usuário comum não acessa admin, moderação nem secrets.
10. Denúncia criada aparece no painel de moderação.
11. Bloqueio oculta interações adequadamente sem vazar dados privados.
12. Localização negada não impede busca por cidade.
13. Sem conexão: exibir conteúdo cacheado identificado e opções de tentar novamente; não enviar mensagens como se persistidas.
14. Limites de upload, input, duplicidade e rate limit são respeitados.
15. Exclusão de conta tem fluxo funcional, seguro e documentado.
16. Mobile funciona em tamanhos de tela diferentes, fontes maiores e leitores de tela.

Os testes devem ter scripts em `package.json` e instruções reproduzíveis. O app deve iniciar com um único comando documentado depois da configuração. Não declarar "pronto para produção" antes dos testes, credenciais legais e verificações de loja.

## 10. ENTREGA EXIGIDA AO FINAL DE CADA ETAPA

- Código-fonte real, organizado e comentado apenas onde faz sentido.
- `README.md` em português com pré-requisitos, setup, instalação, variáveis de ambiente, comandos e troubleshooting.
- `docs/ARQUITETURA.md`, `docs/MODELO_DADOS.md`, `docs/FLUXOS.md`, `docs/STATUS.md`, `docs/TESTES.md`, `docs/PUBLICACAO_IOS_ANDROID.md`.
- SQL/migrations versionados + RLS + testes de segurança.
- `.env.example` sem segredos e documentação para conectar a conta Supabase.
- Componentes e telas alinhados à referência aprovada, com capturas de tela comparativas quando o ambiente permitir.
- Relatório com: o que foi implementado, arquivos principais, comandos executados, testes que passaram/falharam, limitações reais, dependências externas pendentes e próximo passo.

## 11. ORDEM DE PRIORIDADES INEGOCIÁVEL

1. Aplicativo confiável, seguro e funcional > animações e efeitos.
2. Fidelidade ao design escolhido > reinventar a marca.
3. Facilidade de encontrar lugar/perguntar/responder > recursos acessórios.
4. Dado real e identificado > números e avaliações falsos.
5. Escalabilidade por paginação/índices > baixar todo o Brasil em memória.
6. Testes e clareza de status > promessas de publicação.

## 12. COMECE AGORA

Inspecione o repositório e a imagem anexada. Escreva um resumo da arquitetura e das decisões de implementação em `docs/PLANO_IMPLEMENTACAO.md`, liste dependências externas e riscos, e **avance diretamente para executar a Fase 1 e as fases seguintes enquanto houver recursos e acesso**. Não se limite a sugerir código ou apresentar wireframes: gere os arquivos e implemente fluxos reais. Sempre que uma etapa estiver bloqueada por credenciais/serviços, deixe infraestrutura, interface, testes isolados, documentação e integração prontos para configuração e continue com partes independentes. Ao terminar a execução disponível, mostre evidências do que realmente funciona e informe exatamente o que falta para testar e publicar na App Store e Play Store.
