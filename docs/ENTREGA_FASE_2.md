# Entrega de continuidade

## Arquivos principais

| Área            | Arquivos criados/ampliados                                                                                                                                 |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend         | `supabase/migrations/202611060003_safe.sql` a `202611060007_appeals.sql` (novos); 001/002 preservados                                                      |
| Edge            | `supabase/functions/{moderate-pending,prepare-photo,delete-photo,delete-account}`; helpers privados de HTTP, mídia, JPEG e verdict; `supabase/config.toml` |
| Mapa            | `src/app/map.tsx`, `src/components/map-canvas{,.web}.tsx`, tipos e `src/validation/geo.ts`                                                                 |
| Catálogo        | `src/services/catalog.ts`, validação Zod e abas Explorar/Adicionar                                                                                         |
| Safe/comunidade | `/admin`, componentes `content-actions`, `live-reports`, `place-actions`, lugar e perguntas                                                                |
| Mídia           | `src/services/photos.ts`, `photos` e `moderation-photo`                                                                                                    |
| Conta           | Perfil, configurações, `auth-callback`, `delete-account`, `legal`, hook de sessão e conectividade                                                          |
| Visual          | Boas-vindas, `design.tsx`, primitivas `ui.tsx` e telas existentes                                                                                          |
| Configuração    | `package.json`/lockfile, `app.json`, tipos/ESLint, `.env.example` e exemplo backend sem segredos                                                           |
| Testes          | `tests/run.cjs`, domínio/GeoJSON/JPEG/moderação, `tests/sql`, smoke e `scripts/test-db.sh`                                                                 |
| Documentação    | Auditoria, arquitetura, modelo, fluxos, testes, Safe, dependências externas, status e checklist de publicação                                              |

Projetos nativos `android/` e `ios/`, bundles `dist/` e dependências são gerados e ignorados. Não foram enviados commits, push ou publicação.

## Migração e execução

Para projeto que já usa 001/002: aplicar 003–007 em ordem. Revisar a quarentena do legado com equipe responsável. Fazer deploy das quatro funções e configurar cliente, moderador, SMTP/redirects e provedor opcional. Instruções completas no README e `CONFIGURACAO_EXTERNA.md`.

A nova versão preserva funcionalidades existentes e substitui publicação imediata por aprovação. Essa mudança intencional de comportamento é obrigatória para Safe: envios confirmados são recebidos para análise, não anunciados como públicos.

## Aceite restante

O código destes módulos não substitui validação integrada com serviços e dois usuários. Pendências de implementação, operação, visual e lojas constam no STATUS. Próxima rodada deve priorizar Supabase real, moderação/imagem/exclusão, development builds e revisão das 12 telas com dados aprovados. Nenhuma integração externa foi simulada em produção.
