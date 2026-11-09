# Painel web de moderação

Painel privado: https://na-real-moderacao-bruno.brunoaloy-gruposetup.chatgpt.site

O proprietário escolheu usar sua conta atual do NA REAL. Não foi criada outra conta, enviada senha ou concedida permissão automaticamente. A entrada dedicada fica em `moderation/app` e reutiliza o painel existente e o mesmo Supabase.

## Situação conferida em 09/11/2026

Sua conta já foi liberada: a consulta real retornou `owner_moderator=true`. Não precisa repetir o SQL. A ausência dos serviços auxiliares é independente dessa permissão: GET e OPTIONS dos quatro endereços retornaram 404. A tentativa de publicar pelo ambiente foi recusada com HTTP 403 e `Missing required permission(s): edge_functions_write`.

O painel usa o mesmo login, cores e componentes do aplicativo, com navegação por Cadastros, Pedidos e denúncias e Ferramentas. Cada contribuição tem seu próprio motivo de decisão; detalhes técnicos ficam recolhidos. A disponibilidade das funções é consultada por GET sem sessão/payload; ferramentas ausentes ficam desativadas. A verificação de disponibilidade não comprova a configuração da IA nem uma operação autenticada bem-sucedida.

## Publicar os serviços que faltam

No GitHub Desktop, faça Fetch/Pull de `codex/na-real-dev`. Abra um terminal na pasta do NA REAL e execute:

```sh
npx supabase login
npm run moderation:deploy-services
npm run moderation:services-check
```

Use seu login administrativo do Supabase no seu computador. O script usa a CLI 3 instalada pelo projeto, aponta explicitamente para NA REAL (`zcnfssihiqmbrlwvlsme`), publica somente `moderate-pending`, `prepare-photo`, `delete-photo` e `delete-account`, com bundle pela API, sem Docker, sem prune e sem alterar o banco ou executar decisões. Requer `edge_functions_write`. Não envie tokens ou senhas pelo chat.

As funções validam a sessão no próprio handler (e o papel de moderador onde exigido); o deploy mantém `verify_jwt=false` como no TOML existente para permitir preflight e o fluxo de validação da aplicação. O CORS compartilhado agora aceita `x-client-info`, além de authorization/apikey/content-type, e declara POST/OPTIONS. Corrigir CORS no código local não publica as funções ausentes automaticamente.

A checagem posterior espera GET 405 (método recusado pelo handler sem executar ação) e OPTIONS bem-sucedido com os cabeçalhos do SDK permitidos. Depois, abra Ferramentas e toque Conferir disponibilidade dos serviços. Sem `MODERATION_API_KEY` nos secrets do servidor, a IA ainda responderá que não foi configurada; lugares continuam com aprovação humana. Nenhuma chave de IA deve ir para o aplicativo.

## Liberar sua conta no Supabase

1. Entre no [projeto NA REAL](https://supabase.com/dashboard/project/zcnfssihiqmbrlwvlsme) com sua conta de proprietário do Supabase.
2. No menu lateral, abra **SQL Editor → New query** (Nova consulta). Você pode abrir [a nova consulta diretamente](https://supabase.com/dashboard/project/zcnfssihiqmbrlwvlsme/sql/new).
3. Copie todo o conteúdo de [01-enable-owner-moderation.sql](../scripts/pilot/01-enable-owner-moderation.sql), cole na consulta e clique **Run**. Esse script confere a conta confirmada indicada pelo proprietário e concede somente o papel de moderação do aplicativo. O resultado esperado é `moderator_enabled = true`. Não use o script de limpeza de demonstrações para esta etapa.
4. No painel web, entre com o mesmo e-mail e senha do aplicativo. Se já estiver conectado, toque **Verificar permissão novamente**. No aplicativo, volte ao perfil ou saia e entre para conferir o atalho **Moderação**.

Essa liberação é um registro na tabela `public.safe_admins`, protegida para clientes comuns. Não é uma mudança na política pública de escrita das tabelas. Quem administra o projeto no painel Supabase não se torna moderador do aplicativo automaticamente.

## O que significa o ambiente somente leitura

Na primeira conferência de 09/11/2026, uma consulta autenticada com o token disponível neste ambiente retornou `supabase_read_only_user`, `transaction_read_only=on` e `owner_moderator=false`, mesmo pedindo `read_only=false`. Não há evidência de que todo o projeto esteja travado para escrita; a limitação observada é desta conexão administrativa. Dar permissão à sua conta em `safe_admins` não transforma o token deste ambiente em conexão de escrita.

Para executar a liberação agora, use o SQL Editor com uma conta Supabase que tenha acesso de escrita ao projeto (Owner/Admin ou papel apropriado). Se o SQL Editor também estiver restrito, peça ao proprietário da organização para conferir seu acesso em **Organization settings → Team**, incluindo o acesso ao projeto quando houver papéis por projeto.

Para que este ambiente execute operações administrativas no futuro, configure uma credencial autorizada de escrita na conexão segura usada aqui e confira suas restrições de acesso/modo somente leitura. Se a conexão passar por um conector/proxy que imponha leitura, essa restrição precisa ser mudada nessa integração, não por um comando SQL no banco. A observação atual não permite identificar com certeza qual camada impôs o papel de leitura. Tokens pessoais do Supabase são geridos em **Account → Access Tokens** (`https://supabase.com/dashboard/account/tokens`), mas gerar outro token por si só não garante mudar essa restrição. Não cole token, senha ou service_role no chat nem no frontend.

O painel web usa a chave **publicável** e sua sessão; aprovações são autorizadas pelo banco. Ele não precisa do token administrativo deste ambiente. Não é preciso comprar um domínio nem configurar SMTP para entrar com sua conta já confirmada.

## Rodar e gerar a versão web

Depois de Fetch/Pull da branch `codex/na-real-dev` no GitHub Desktop:

```sh
npm ci
npm run moderation:web
```

Abra o endereço mostrado pelo Expo (porta 8082). Esse comando usa somente as rotas do painel; não inicia a exploração, mapa ou cadastro de lugares. Para continuar no iPhone, use `npm run phone` normalmente, em outro terminal.

```sh
npm run moderation:build
```

A saída estática fica em `dist/moderation` e contém `index.html` e assets. Hospede **o conteúdo dessa pasta**, não a exportação completa do aplicativo. A configuração deve fornecer `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (ou a chave anon pública existente) no build. Nenhum segredo de servidor é necessário. O script usa a mesma configuração pública local do aplicativo.

A identidade da hospedagem e o último commit estático publicado estão em `moderation/site.json`. Atualizações devem reutilizar esse mesmo Site, preservando seu acesso privado. A fonte estática de publicação tem manifesto em `/workspace/sites/na-real-moderacao/.openai/hosting.json`; gere novamente o bundle com o comando acima antes de atualizá-la.

A versão hospedada em Sites é privada ao proprietário e ainda exige o login NA REAL. Compartilhar o endereço não concede acesso a outras pessoas. Liberar outros moderadores futuramente exige também seus usuários em `safe_admins` e ajuste consciente do acesso da hospedagem. Não foi ativado cadastro público de moderadores.

## Uso

Na entrada, informe e-mail e senha atuais. Conta sem permissão vê orientação e pode verificar a permissão novamente ou sair. Falha ao consultar o papel não abre a fila. O painel autorizado começa nos lugares pendentes e oferece o fluxo documentado em [MODERACAO_LUGARES.md](MODERACAO_LUGARES.md). **Sair da moderação** encerra a sessão neste navegador, sem desconectar o aplicativo no telefone. Para recuperar a senha, use a recuperação já existente no aplicativo; o painel não envia convites ou e-mails automaticamente.

## Limites de validação

O ambiente pode validar compilação web/iOS, tipos, lint e testes locais sem usar sua senha. Isso não comprova uma aprovação real com a sessão do proprietário. O papel já foi confirmado na conferência mais recente. Não foi criada conta, alterada senha, enviado e-mail ou aprovado conteúdo real.

A publicação em Sites foi confirmada pela API de hospedagem. A prévia gerenciada falhou (`relay could not open browser port 4173`) e a abertura do endereço hospedado pela ferramenta de navegador falhou (`Browser Use could not read requirements`). Não foi substituída por outro caminho de automação. Aparência, login e aprovação no navegador do proprietário seguem para validação após liberar a conta. Os testes unitários cobrem a entrada somente para sessão com papel confirmado, incluindo rejeição de dados de papel em cache durante erro, carregamento ou saída.

Na rodada de revisão do layout, passaram 69 testes unitários e Deno check das quatro funções, além de TypeScript/lint e bundles web/iOS. A chamada pública safe_is_admin retornou false; a tentativa de moderate_content sem sessão, usando referência nula sem registro real, foi negada com HTTP 401. Os smokes de interface foram atualizados, mas não executados nesta rodada: a prévia e o navegador gerenciados continuaram indisponíveis. O teste SQL local tentou iniciar PostGIS e falhou por espaço insuficiente, sem chegar às asserções. Não foi marcado como aprovado.

A nova política de aprovação/reprovação por IA, o acompanhamento opcional e o recomeço do piloto estão em [TESTE_DOIS_IPHONES.md](TESTE_DOIS_IPHONES.md). Exigem atualizar a função e configurar a chave; a publicação da tela web não os ativa sozinha.
