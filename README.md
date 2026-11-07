# NA REAL

Aplicativo React Native/Expo existente, ampliado na Fase 2. Continuidade atual: [Sprint 01](docs/ENTREGA_SPRINT_01.md). Não está liberado para produção. Consulte [status e evidências](docs/STATUS.md) e [auditoria de entrada](docs/AUDITORIA_FASE_2.md).

**Expo Go no iPhone (07/11/2026):** após Fetch/Pull de `codex/na-real-dev`, execute `npm ci` e `npm run phone`. O mapa agora usa Apple Maps no Expo Go; não precisa de estilo MapTiler. Veja [guia do iPhone](docs/EXPO_GO_IPHONE.md).

**Apresentação e acesso:** telas baseadas no mockup aprovado, com paisagem ilustrativa do Rio incluída no app, login, criação de conta e recuperação separados. Para receber o novo recurso visual e a dependência do gradiente, faça Pull, `npm ci` e reinicie `npm run phone`.

**Tela inicial e busca:** interface compacta, filtros de cidade/UF aplicados de uma vez, atualização ao puxar e busca preservada ao abrir o mapa. Após receber os commits pelo GitHub Desktop, reinicie `npm run phone` para testar no iPhone.

**Estado atual do banco (06/11/2026):** migrations 001–010 confirmadas no Supabase remoto, postflight estrutural aprovado e consultas públicas respondendo HTTP 200. Catálogo público vazio. Testes reais com duas contas, moderação, fotos e aparelhos continuam pendentes; Sprint 01 permanece aberto. Relatos de schema ausente nas seções históricas descrevem tentativas anteriores.

## Desenvolvimento

Node 24 e npm 11:

```sh
npm ci
npm run phone # verifica/recupera a configuração pública antes de abrir o Expo Go
```

Para **começar pelo iPhone com Expo Go**, use `npm run phone` e leia o QR com a Câmera do iPhone. O comando força Expo Go e usa túnel ngrok, sem exigir conta Expo, Xcode ou EAS. Se o `.env.local` estiver ausente, o comando tenta recuperar a configuração pública pelo login da CLI Supabase; se necessário, execute `npx supabase login`. O QR só é gerado após uma consulta de leitura ao catálogo passar. Mantenha o terminal aberto. No GitHub Desktop, faça Fetch/Pull de `codex/na-real-dev` antes de instalar. Guia: [EXPO_GO_IPHONE](docs/EXPO_GO_IPHONE.md).

Sem backend, a interface informa indisponibilidade e impede sucesso fictício. Não há dados de comunidade simulados. No Expo Go, o mapa usa `react-native-maps` (Apple Maps no iPhone), sem estilo ou chave de mapas adicional. MapLibre permanece nos development builds e na web; nesses runtimes, configure um estilo licenciado. `npm run web` executa a interface web.

Para preparar e executar um development build local:

```sh
EXPO_OFFLINE=1 npx expo prebuild --no-install
npm run android  # requer JDK compatível, Android SDK e dispositivo/emulador
npm run ios      # requer macOS, Xcode, CocoaPods e simulador/dispositivo
```

Os projetos gerados `ios/` e `android/` são ignorados; configuração reproduzível está em `app.json`. SDK Expo 58 e MapLibre Native 11 estão no lockfile. Nesta máquina foram gerados projetos nativos e bundles, sem APK/IPA ou instalação em aparelhos. IDs `com.example.nareal` são provisórios.

## Supabase e moderação

1. Crie um projeto de desenvolvimento e aplique as **dez** migrações em `supabase/migrations` em ordem. Se as duas primeiras já foram aplicadas, execute somente 003–010. Faça backup antes de atualizar qualquer ambiente com dados reais.
2. Configure URL/chave **publicável** em `.env.local`. Nunca use service_role no app. Configure SMTP, confirmação de e-mail e redirects `nareal://auth-callback` e URL web de `/auth-callback`. O fluxo usa PKCE; links devem abrir no dispositivo com o verificador da solicitação.
3. Publique as funções `moderate-pending`, `prepare-photo`, `delete-photo` e `delete-account` com Supabase CLI/dashboard. Todas validam identidade explicitamente no handler. Veja [configuração externa](docs/CONFIGURACAO_EXTERNA.md).
4. Designe um moderador por SQL privilegiado: `insert into public.safe_admins(user_id) values ('UUID_DO_USUARIO_AUTH');`. Nunca permita que clientes gravem essa tabela. O painel protegido fica na rota `/admin`, inclusive na interface web.
5. Sem IA, todo conteúdo novo fica pendente. O moderador pode revisar textos manualmente. Imagens precisam ser preparadas pelo backend, vistas na cópia imutável sanitizada e revisadas. Credencial de IA opcional fica apenas nos segredos das Edge Functions.

A migração Safe também coloca conteúdo legado em pendência; nenhuma avaliação anterior é declarada analisada automaticamente. Não libere usuários externos sem revisar essa fila e validar RLS no projeto real.

## Mapas e fotos

Em development builds e na web, MapLibre usa `EXPO_PUBLIC_MAP_STYLE_URL` de provedor licenciado (MapTiler é a opção documentada). Não há tiles OSM públicos nem autocomplete Nominatim. Busca usa catálogo próprio por nome/cidade/UF, com viewport PostGIS e resultados incrementais. Coordenadas podem ser fornecidas manualmente ou selecionadas por pressão prolongada (clique direito na web).

Fotos: seleção/câmera opcional, re-encode JPEG e redimensionamento, limite 5 MB, bucket privado de originais e bucket privado de cópias revisadas. Somente mídia aprovada recebe URL assinada para exibição pública. Revogação de acesso a URL já assinada pode levar até 5 minutos; exclusão remove arquivos pelo Storage API.

## Testes

```sh
npm run typecheck
npm run lint
npm test
npm run test:db        # Docker local descartável; não usa seu banco
npm run test:functions # Deno (npx), valida quatro Edge Functions
npm run format:check
EXPO_OFFLINE=1 npx expo export --platform all
```

Para smoke web, sirva `dist` em 127.0.0.1:8765 com `python3 -m http.server 8765 --bind 127.0.0.1 --directory dist` e execute `npm run test:smoke`. Requer Chromium em `/usr/bin/chromium` ou `CHROMIUM_PATH`. Veja [testes](docs/TESTES.md).

## Limitações reais

Supabase remoto, envio de e-mail, IA, Storage, mapa licenciado e dois dispositivos ainda não foram testados com credenciais reais. OAuth e push continuam não habilitados. Preferência de atualizações de lugares é persistida, mas a entrega dessas atualizações ainda não foi implementada. Cache offline permanece em memória, sem persistência após encerrar o app. Documentos legais são preliminares; revisão humana e operação da fila precisam de responsável. [Publicação](docs/PUBLICACAO_IOS_ANDROID.md) exige contas, revisão legal e testes em aparelhos.

## Fase 3 incremental

Detalhes do lugar oferecem compartilhamento via link do app e sugestões privadas de correção. No painel admin, as propostas podem ser revisadas e aplicadas com auditoria; propostas de versões antigas são recusadas. O link compartilhado usa o esquema/host do runtime atual, sem presumir um domínio público publicado. Consulte docs/FASE_3.md.

Salas aceitam respostas a mensagens aprovadas da mesma comunidade. Envios repetidos com o mesmo identificador e conteúdo retornam a mesma mensagem; erros preservam o rascunho para nova tentativa. A identificação pública usa apenas perfil aprovado, sem expor e-mail.

Perguntas agora têm campo livre validado, histórico paginado de encerradas e atualização por eventos. Perguntas antigas não aceitam novos envios nem são exibidas como informação atual. São dez migrações; se já aplicou 001–007, aplique somente 008 e 009. As variáveis públicas seguem as mesmas do `.env.example`.

## Infraestrutura e validação — Fase 4

Leia [SETUP_SERVICOS](docs/SETUP_SERVICOS.md) antes de conectar banco. `npm run services:check` relata presença/formato sem imprimir valores; `npm run services:start` prepara Supabase local e `npm run test:services` exercita APIs reais com fixtures isoladas (recusa projetos remotos). A stack completa não iniciou nesta máquina por falta de disco Docker; a suíte de duas contas ficou bloqueada, não aprovada. O proprietário ainda não criou projeto remoto.

`npm run mobile:check` valida configuração Expo/EAS; confira [validação mobile](docs/VALIDACAO_MOBILE.md) e [auditoria de migrações](docs/AUDITORIA_MIGRACOES.md). Novas proteções recusam chaves administrativas no cliente. Para HTTP de desenvolvimento local, defina `NA_REAL_ALLOW_LOCAL_HTTP=1`; não use essa opção em produção.

## Sprint 01 — continuidade

Busca nacional preservada; o botão de proximidade solicita autorização somente quando acionado e ordena lugares com coordenadas no servidor. Avaliações têm cursor estável e edição própria independente da página carregada. Aplicar a migration 010 após 009 em ambientes existentes; ela é aditiva.

Nesta sessão, o projeto remoto foi identificado e a configuração pública foi recuperada em `.env.local` ignorado. O schema remoto está vazio e o SQL disponível opera em modo somente leitura: a tentativa de aplicação foi recusada, sem migrations aplicadas. Mapas ainda exigem estilo licenciado. Veja o relatório atual antes de interpretar resultados históricos.

O teste de banco usa a imagem PostGIS Alpine para reduzir o disco necessário; `POSTGIS_TEST_IMAGE` permite selecionar outra imagem compatível. O teste de regressão `npm run test:reviews-ui` exige exportação web **com Supabase configurado**, servida em `SMOKE_URL` (padrão http://127.0.0.1:8765), e lê somente URL pública de `.env.local`. Intercepta todas as chamadas Supabase com fixtures de teste; não publica avaliações nem valida integração remota.

## Aplicação controlada no Windows

Use [APLICACAO_CONTROLADA_WINDOWS](docs/APLICACAO_CONTROLADA_WINDOWS.md) para inventário, hashes, backup, dry-run e aplicação manual via CLI 3.0.0, preservando o ledger. O script PowerShell de preparação não executa push real. [Testes remotos](docs/TESTES_REMOTOS_SPRINT_01.md) estão preparados, ainda não executados.

## Continuidade sem Docker

`npm run remote:prepare` prepara inventário/histórico/dry-run remoto com a CLI instalada, sem PowerShell scripts ou containers. Não executa aplicação. Após aplicar manualmente, `npm run remote:verify` verifica a estrutura. Veja [SEM_DOCKER](docs/SEM_DOCKER.md) para alternativas de backup e [entrega atual](docs/ENTREGA_CONTINUIDADE_SEM_DOCKER.md) para melhorias e limitações.
