# Sprint 01 — diagnóstico de entrada

Data: 6 de novembro de 2026. Base: ea04fba, branch remota codex/na-real-dev.

O checkout inicialmente não tinha arquivos nem commits. O remoto autorizado continha o aplicativo; seu código foi recuperado sem recriar o projeto.

## Implementação preservada

Expo Router em src/app: Explorar/Adicionar/Perfil, autenticação PKCE, callback, mapa, detalhes, sala, perguntas, configurações e moderação. Identidade Inter/verde/teal, componentes reutilizáveis e safe areas existentes. AsyncStorage persiste sessão; RuntimeConnections acompanha Auth, conectividade e renovação em foreground. Supabase recusa chave administrativa no cliente.

Nove migrations versionadas fornecem PostGIS, busca nacional/viewport, índices, bloqueio transacional de duplicatas, reviews únicas por autor/lugar, média de aprovadas, fotos privadas, moderação e RLS. Fotos são comprimidas no cliente e preparadas por Edge Function; nenhuma mídia pendente é pública. Publicação exige revisão humana. Salas/perguntas já existem e não são simuladas.

## Constatações atuais

A API Management reconheceu o projeto zcnfssihiqmbrlwvlsme, nome NA REAL, ACTIVE_HEALTHY. Consulta read-only não encontrou tabelas em public nem histórico em supabase_migrations. O token de gestão está disponível no ambiente seguro; os relatórios antigos de ausência do token são históricos.

Não há .env de aplicativo neste checkout. A chave pública será obtida da configuração existente, sem solicitar novamente credenciais. Nenhum mockup novo foi anexado: preservar componentes e referências já versionadas. Estilo licenciado de mapa não está configurado.

## Lacunas priorizadas

Reviews param em 50 itens e a própria avaliação é procurada só nessa página. Implementar cursor estável e consulta independente do autor, preservando edição mesmo de avaliações antigas. A chave dessa consulta deve incluir o usuário. Busca por proximidade precisa ordenar no servidor; a localização do mapa, por si só, não implementa essa ordenação.

Validar migrations e permissões em banco descartável antes de inicializar o schema remoto vazio. Verificar upload, auth e persistência com fixtures isoladas, sem inventar conteúdo público.
