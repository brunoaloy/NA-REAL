# Testes — Fase 2

## Comandos reproduzíveis

- `npm run typecheck`: TypeScript estrito do app.
- `npm run lint`: ESLint/Expo/React Hooks.
- `npm test`: runner executa cada arquivo de teste Node e propaga qualquer falha. São 11 casos: validação de cadastro/avaliação/mensagem/expiração (4), GeoJSON (1), metadados JPEG (2) e interpretação fail-closed de moderação (4). Fixtures de resposta de IA são testes isolados; não equivalem a chamadas reais.
- `npm run test:functions`: Deno verifica os quatro handlers e dependências servidoras. Não faz deploy nem valida APIs remotas.
- `npm run test:db`: Docker local, imagem PostGIS 17-3.5, sem portas publicadas, banco descartável e cleanup automático. Executa bootstrap de Auth/Storage emulados, sete migrações, regressões RLS e Safe. Não usa seu projeto Supabase.
- `npm run format:check`: formatação.
- `EXPO_OFFLINE=1 npx expo export --platform all`: bundles JS iOS/Android/web.
- `EXPO_OFFLINE=1 npx expo prebuild --no-install`: gera projetos nativos e aplica plugins sem compilar binários.

## Banco

Asserts: leitura anônima só aprovada, autoria/autoaprovação, edição/exclusão por terceiro, notificações privadas, publicação pendente, RBAC, bloqueios, suspensão, revisão obsoleta, duplicatas, residência sem declaração pública, arquivos pendentes, originais privados mesmo após aprovação, cópia revisada acessível, claims JWT modernos do worker e recurso privado de suspensão.

Fixtures limpam identidade ao alternar para anon. Limitações: Auth e Storage do servidor são emulados por tabelas, não é teste HTTP do Supabase. Container usa wal_level padrão e não valida logical replication ou Realtime. Sanitização JPEG é testada por segmentos e rejeição de framing, não substitui decode/inspeção de imagens reais.

## Navegador

Exportar web e servir `dist` com `python3 -m http.server 8765 --bind 127.0.0.1 --directory dist`. Executar `npm run test:smoke`. Chromium em `/usr/bin/chromium`, override `CHROMIUM_PATH`.

Cenários: visitante, filtros, mapa explicitamente não configurado, busca de duplicatas sem falso sucesso, formulário protegido, perfil, privacidade e offline; coleta erros JavaScript. Seletores por role consideram só tela visível, pois abas anteriores permanecem montadas.

Capturas em `docs/screenshots/fase2-*`. São estados reais sem backend; não demonstram fidelidade completa dos doze mockups nem entrega de dados remotos.

## Verificações que ainda exigem configuração/dispositivos

Supabase: dois usuários reais, confirmação/recuperação de e-mail, RLS via HTTP, aprovação e eventos Realtime, upload de JPEG real, MIME/quotas, IA real e falhas do provedor, URLs assinadas, exclusão completa e retry após falha parcial. Mapas: chave licenciada, tiles, clusters/gestos e localização negada em aparelhos. iOS/Android: build assinado, instalação, câmera, leitor de tela, texto grande, desempenho, reconexão/background e fluxo completo de conta. Nenhum resultado desses testes é presumido por um build JS verde.

## Incrementos da Fase 3

`tests/sql/phase3.sql` exercita sugestões privadas, recusa de não admin, aplicação auditada, revisão obsoleta, respostas na mesma sala e retry idempotente. A suíte agora aplica nove migrações e possui 13 testes unitários; dois novos cobrem perguntas livres. Claims continuam emulados; não são sessões de Auth/Realtime reais.
