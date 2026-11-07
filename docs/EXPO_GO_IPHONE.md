# Abrir o NA REAL no iPhone com Expo Go

Esta versão mantém o aplicativo existente e as migrations 001–010. Não é necessário aplicar SQL para usar o Expo Go. Nenhuma migration foi alterada nesta entrega.

## No computador com GitHub Desktop

1. Abra o repositório `brunoaloy/NA-REAL`.
2. Em **Current branch**, selecione `codex/na-real-dev`. Preserve suas alterações locais antes de trocar de branch.
3. Clique **Fetch origin** e depois **Pull origin**, se disponível. Os commits recebidos aparecem em **History**.
4. Use **Repository → Open in Terminal** e execute:

```sh
npm ci
npm run phone
```

O comando agora verifica a configuração **antes de gerar o QR**. Se o `.env.local` não veio pelo Git, tenta recuperar apenas a chave pública pelo login local da CLI Supabase e salva o arquivo ignorado. Se não houver login, ele orienta a informar URL/chave pública no terminal. Para autenticar a CLI primeiro:

```sh
npx supabase login
npm run phone
```

Nunca envie o token de login pelo chat. Essa operação usa a API de gerenciamento para leitura; não executa migrações.

Antes de abrir o Expo, o terminal deve mostrar **Supabase conectado**. O comando limpa o cache para evitar reutilizar um bundle sem configuração. Se a conexão falhar, ele para com uma mensagem clara antes de gerar um QR inválido. Você também pode executar apenas `npm run setup:mobile` para preparar/verificar o ambiente.

Use Node 24 e npm 11. O comando `phone` funciona em Windows, macOS e Linux. Não usa Docker, PowerShell scripts, Xcode, assinatura Apple nem EAS. As dependências de túnel são instaladas pelo `npm ci`.

## Configuração Supabase

Seu `.env.local` existente é preservado. Esse arquivo não vem pelo Git e não deve ser commitado. A recuperação automática é feita quando a configuração está ausente; uma configuração inválida ou recusada não é substituída silenciosamente. Para configurar manualmente, copie `.env.example` para `.env.local` e preencha:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICAVEL_OU_ANON
```

O nome alternativo `EXPO_PUBLIC_SUPABASE_ANON_KEY` também é aceito no app, no build e no comando de inicialização.

O projeto NA REAL tem referência `zcnfssihiqmbrlwvlsme`. A chave **publishable** ou **anon** está no painel Supabase → Project Settings → API Keys. Nunca use `SUPABASE_ACCESS_TOKEN`, `service_role` ou `sb_secret_` no app. `EXPO_PUBLIC_MAP_STYLE_URL` pode ficar vazio no Expo Go.

Depois de mudar o `.env.local`, reinicie o servidor. `npm run services:check` verifica formato/presença sem imprimir valores.

## No iPhone

1. Instale ou atualize o **Expo Go** pela App Store. O projeto usa Expo SDK 58.
2. Com `npm run phone` ainda aberto no computador, leia o QR code usando a **Câmera do iPhone**.
3. Toque em **Abrir no Expo Go** e aguarde o primeiro carregamento.
4. Escolha **Começar como visitante**. Sem lugares aprovados no catálogo, a lista fica vazia; isso não significa falha de conexão.
5. Para contribuir, entre com e-mail e senha. Cadastro exige confirmação por e-mail conforme as configurações do projeto.

Se ambos os aparelhos estiverem na mesma rede Wi-Fi e o túnel estiver bloqueado, use:

```sh
npm run start:lan
```

No Windows, permita Node.js no firewall para redes privadas. No iPhone, permita acesso à rede local ao Expo Go quando solicitado. Evite Wi-Fi de convidados com isolamento entre aparelhos. Para limpar o cache: `npm run phone -- --clear`.

O túnel expõe temporariamente o servidor de desenvolvimento; use só configuração pública no cliente, não compartilhe o QR publicamente e encerre com Ctrl+C quando terminar. O link só funciona enquanto o servidor está ativo.

## O que mudou para o Expo Go

- `npm start`, `npm run start:lan`, `npm run start:tunnel` e `npm run phone` verificam a configuração e selecionam explicitamente `--go`, mesmo com `expo-dev-client` instalado.
- Expo Go carrega o mapa nativo já incluído no cliente; MapLibre é carregado somente em development builds. No iPhone, Apple Maps dispensa uma chave MapTiler/Google.
- Mapa, seleção por pressão prolongada, marcadores, busca por área e centralização por localização continuam disponíveis. No Expo Go os marcadores são individuais, sem clusters MapLibre.
- O mapa web continua MapLibre e precisa de estilo licenciado. `npm run start:dev-client` mantém o fluxo de compilação própria anterior.

## E-mail e recuperação de senha

O app usa PKCE e gera o callback com `expo-linking`. No Expo Go o endereço tem formato `exp://HOST/--/auth-callback`; o HOST muda conforme o servidor/túnel. No painel Supabase → Authentication → URL Configuration, permita o callback do servidor usado, incluindo `?recovery=1` para recuperação. Restrinja a regra ao host de desenvolvimento quando possível e remova ao encerrar os testes. Em uma build própria, o callback é `nareal://auth-callback`.

Se um link abrir no navegador errado ou expirar, solicite outro e-mail pelo mesmo Expo Go que iniciou a operação. Entrar por e-mail e senha em uma conta já confirmada não depende desse callback. OAuth Google/Apple e push continuam não habilitados.

## Rede desta nuvem

A política atual permite o Supabase, mas recusa HTTPS para `api.expo.dev`, `connect.ngrok-agent.com` e `tunnel.us.ngrok.com` (403 do proxy). O teste `expo start --go --tunnel ngrok` não conectou dentro do prazo. Não foi gerado um QR público utilizável nesta nuvem.

Para gerar um túnel a partir desta nuvem, é necessário ajustar a configuração de rede do ambiente para os serviços Expo/ngrok e permitir o transporte exigido pelo agente (TCP/TLS 443 ou proxy suportado), preservando as regras existentes. Não basta uma permissão de banco. A liberação de host deve seguir o endereço efetivamente usado pelo agente. Executar `npm run phone` no seu computador usa a rede desse computador e evita depender desse bloqueio da nuvem.

## Validação e limites

Consulte o bloco mais recente de `STATUS.md`. Exportar um bundle iOS e verificar a seleção de módulos não substitui abrir o app no seu iPhone. Fluxos reais com contas, confirmação SMTP, câmera, fotos/Edge Functions e moderação precisam de validação integrada. Nenhuma conta de teste foi criada, nenhum e-mail foi enviado e nenhuma escrita foi feita no banco nesta adaptação.
