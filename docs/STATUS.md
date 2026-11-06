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
