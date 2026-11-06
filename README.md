# NA REAL

Aplicativo React Native/Expo existente, ampliado na Fase 2. Não está liberado para produção. Consulte [status e evidências](docs/STATUS.md) e [auditoria de entrada](docs/AUDITORIA_FASE_2.md).

## Desenvolvimento

Node 24 e npm 11:

```sh
npm ci
cp .env.example .env.local
# Configure seu projeto Supabase e, opcionalmente, o provedor de mapas.
npm start
```

Sem backend, a interface informa indisponibilidade e impede sucesso fictício. Não há dados de comunidade simulados. MapLibre requer development build no iOS/Android: não use Expo Go como validação. `npm run web` executa a interface web.

Para preparar e executar um development build local:

```sh
EXPO_OFFLINE=1 npx expo prebuild --no-install
npm run android  # requer JDK compatível, Android SDK e dispositivo/emulador
npm run ios      # requer macOS, Xcode, CocoaPods e simulador/dispositivo
```

Os projetos gerados `ios/` e `android/` são ignorados; configuração reproduzível está em `app.json`. SDK Expo 58 e MapLibre Native 11 estão no lockfile. Nesta máquina foram gerados projetos nativos e bundles, sem APK/IPA ou instalação em aparelhos. IDs `com.example.nareal` são provisórios.

## Supabase e moderação

1. Crie um projeto de desenvolvimento e aplique as **nove** migrações em `supabase/migrations` em ordem. Se as duas primeiras já foram aplicadas, execute somente 003–009. Faça backup antes de atualizar qualquer ambiente com dados reais.
2. Configure URL/chave **publicável** em `.env.local`. Nunca use service_role no app. Configure SMTP, confirmação de e-mail e redirects `nareal://auth-callback` e URL web de `/auth-callback`. O fluxo usa PKCE; links devem abrir no dispositivo com o verificador da solicitação.
3. Publique as funções `moderate-pending`, `prepare-photo`, `delete-photo` e `delete-account` com Supabase CLI/dashboard. Todas validam identidade explicitamente no handler. Veja [configuração externa](docs/CONFIGURACAO_EXTERNA.md).
4. Designe um moderador por SQL privilegiado: `insert into public.safe_admins(user_id) values ('UUID_DO_USUARIO_AUTH');`. Nunca permita que clientes gravem essa tabela. O painel protegido fica na rota `/admin`, inclusive na interface web.
5. Sem IA, todo conteúdo novo fica pendente. O moderador pode revisar textos manualmente. Imagens precisam ser preparadas pelo backend, vistas na cópia imutável sanitizada e revisadas. Credencial de IA opcional fica apenas nos segredos das Edge Functions.

A migração Safe também coloca conteúdo legado em pendência; nenhuma avaliação anterior é declarada analisada automaticamente. Não libere usuários externos sem revisar essa fila e validar RLS no projeto real.

## Mapas e fotos

MapLibre usa `EXPO_PUBLIC_MAP_STYLE_URL` de provedor licenciado (MapTiler é a opção documentada). Não há tiles OSM públicos nem autocomplete Nominatim. Busca usa catálogo próprio por nome/cidade/UF, com viewport PostGIS e resultados incrementais. Coordenadas podem ser fornecidas manualmente ou selecionadas por pressão prolongada (clique direito na web).

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

Perguntas agora têm campo livre validado, histórico paginado de encerradas e atualização por eventos. Perguntas antigas não aceitam novos envios nem são exibidas como informação atual. São nove migrações; se já aplicou 001–007, aplique somente 008 e 009. As variáveis públicas seguem as mesmas do `.env.example`.
