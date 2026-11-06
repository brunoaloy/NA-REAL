# Arquitetura — continuidade da Fase 2

Expo 58, React Native, TypeScript estrito, Expo Router e TanStack Query preservados. `src/app` contém boas-vindas, três abas e rotas internas de mapa, lugar, perguntas, autenticação/callback, notificações, privacidade, exclusão web e moderação. `src/components` concentra primitivas, cabeçalho, categorias, cards, estrelas, estados Safe, fotos, ações de segurança, conectividade e relatos. Serviços validam inputs e persistem no Supabase; nenhuma operação anuncia sucesso sem confirmação de escrita.

MapLibre Native 11 (development build) e MapLibre GL JS (web) compartilham contrato de viewport/GeoJSON; a API da versão instalada foi conferida nas declarações oficiais do pacote. Provedor de estilo é configurável; opção documentada MapTiler. Agrupamento ocorre sobre resultados carregados, até dez páginas de 50 por viewport. Pesquisa usa PostGIS e índices; não baixa o Brasil inteiro. Busca de lugares próprios não faz geocodificação comercial ou scraping.

O PostgreSQL é a autoridade de autoria/moderação: triggers, RLS e privilégios por coluna. A fila Safe versiona cada conteúdo. RPCs administrativas exigem associação em tabela protegida. A ferramenta web administrativa fica em `/admin` no mesmo frontend, decisão de simplicidade nesta fase; segurança reside no servidor, não na rota. Extrair para deploy separado continua possível.

Edge Functions: `moderate-pending` (análise real opcional), `prepare-photo` (sanitização imutável), `delete-photo` (arquivo e metadados) e `delete-account` (autenticação recente, Storage e exclusão Auth). Código servidor separado do bundle mobile. IA/Storage remoto não foram chamados com credenciais nesta máquina.

Realtime usa Postgres Changes sujeitos a RLS, invalidação e refetch ao reconectar. Mensagens têm cursor por timestamp+UUID. NetInfo controla consultas e aviso de offline; cache é em memória, não persistente após encerramento. Reconexão e auth auto-refresh se integram ao AppState; confirmar em aparelhos e duas sessões reais.
