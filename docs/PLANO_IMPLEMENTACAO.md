# Plano de implementação — NA REAL

## Auditoria

Repositório vazio, sem commits e sem código a preservar. Especificação oficial lida integralmente. Referência visual: 12 mockups, Inter, teal #0F766E, verde #10B981, cartões claros arredondados e navegação inferior Explorar/Adicionar/Perfil.

## Arquitetura e decisões

Expo + TypeScript estrito + Expo Router; Supabase Auth/Postgres/PostGIS/Realtime; TanStack Query para cache. Features separadas de serviços e componentes. Admin web separado em apps/admin. Catálogo próprio nacional, sem prometer cobertura ou importar conteúdo proprietário. Mapas dependem de provedor licenciado e development build; nunca usar Nominatim público como autocomplete.

## Dados e segurança

Profiles, places, reviews, favorites, follows, messages, questions, answers, live reports, notifications, reports, blocks e auditoria. RLS em toda tabela pública, grants por operação; autoria imutável e moderação controlada pelo servidor. Média calculada no banco. Relatos expiram; nenhuma informação de movimento será inventada. Chave service_role somente em funções servidoras.

## Etapas e aceite

0. Auditoria e plano (este arquivo).
1. Fundação Expo, tokens, componentes, navegação e estados explícitos; typecheck e testes.
2. Migrações, RLS, catálogo real e autenticação; validar visitante e escrita autenticada.
3. Reviews, favoritos, sala, perguntas e respostas; verificar dois usuários e expiração.
4. Denúncias, admin, notificações e exclusão; testes negativos de autorização.
5. Builds EAS e revisão de acessibilidade/lojas; nunca publicar ou gerar gastos automaticamente.

## Dependências externas e riscos

Projeto Supabase (URL e chave publicável), configuração SMTP/redirects, OAuth Google e Apple, provedor de mapas e credenciais EAS/lojas. Sem esses serviços, indicar integração não configurada e testar isoladamente. Publicação exige revisão legal/LGPD, identidade definitiva, assets, dispositivos e contas do proprietário. Testes de RLS e integração dependem de Postgres/Supabase executável.
