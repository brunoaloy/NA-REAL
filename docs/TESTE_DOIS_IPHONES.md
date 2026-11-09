# Recomeçar o piloto com dois iPhones

## Situação desta rodada

Consulta real de 09/11/2026: uma conta confirmada (o proprietário), papel de moderador preservado, 3 lugares, 3 fotos e 3 arquivos no Storage, sem avaliações ou conversas. A conexão deste ambiente continua `supabase_read_only_user` / `transaction_read_only=on`; a limpeza **não foi executada**. As quatro funções já respondem GET 405 e OPTIONS 200 com CORS correto, confirmando o deploy feito pelo proprietário. Isso não comprova a presença da chave de IA ou uma análise real autenticada.

O proprietário informou que ainda não configurou a chave da OpenAI. O código novo de decisão e o acompanhamento da fila na web também precisam de deploy. Não foi criada conta, enviada senha, alterada credencial ou contratado serviço.

## Limpar antes de criar a segunda conta

1. Feche os dois apps e a moderação enquanto limpa. Ainda existe só sua conta. Não cadastre a segunda antes desta etapa: o script bloqueia se houver outra conta ou conteúdo alterado.
2. Abra [Storage do NA REAL](https://supabase.com/dashboard/project/zcnfssihiqmbrlwvlsme/storage/buckets). Remova os arquivos de teste nos buckets **community-photos** e **reviewed-photos** pelo Dashboard/Storage API. O inventário atual tem 3 arquivos no total, pertencentes à sua conta. Preserve os buckets e suas políticas. Não apague registros de `storage.objects` por SQL. Excluir os arquivos pelo Storage não remove as linhas de `public.photos`; o script faz essa parte depois. Excluir fotos pelo aplicativo altera o inventário e exigirá preparar outro plano.
3. Em [SQL Editor → New query](https://supabase.com/dashboard/project/zcnfssihiqmbrlwvlsme/sql/new), execute todo [03-reset-pilot.sql](../scripts/pilot/03-reset-pilot.sql). É uma limpeza operacional autorizada, **não uma migration nem um recurso de reset público**. Os hashes descrevem este inventário específico. Se disser que o inventário mudou, não remova a proteção para forçar a limpeza.
4. O resultado esperado é `contas_preservadas=1`, `lugares=0`, `fotos=0`, `fila=0` e `moderador_preservado=true`. A transação confere as demais tabelas de conteúdo zeradas antes de confirmar.
5. Sua conta, senha, confirmação de e-mail e acesso de moderação ficam preservados. O perfil passa a **Explorador**, sem descrição, identificador ou foto; preferências, favoritos, contribuições, notificações, bloqueios, histórico de moderação e limite de envios do piloto são limpos. Nada em `auth.users` é apagado. Arquivos físicos precisam da etapa anterior.
6. Recarregue o projeto no Expo Go nos dois aparelhos e atualize a web. A cidade lembrada é local ao aparelho: use a ação de limpar busca/filtros se quiser escolher tudo novamente. Rascunhos ainda não enviados devem ser descartados antes de recarregar. Não é necessário apagar o aplicativo Expo Go.

O SQL foi validado pelo parser PostgreSQL/PLpgSQL, mas não foi executado neste projeto nem validado contra um banco local nesta rodada. Ele verifica o inventário antes das exclusões e aborta se arquivos ainda existirem. A remoção anterior dos arquivos pelo Storage não é desfeita pelo rollback do SQL.

## Configurar IA na web

1. Obtenha uma chave própria da API em `https://platform.openai.com/api-keys`, na conta/projeto que você deseja usar. Uma assinatura do ChatGPT não configura essa chave no Supabase. Confira as condições e eventuais custos do provedor antes de ativá-la. Não envie a chave no chat nem a inclua no app/Git.
2. Em **Supabase → Edge Functions → Secrets**, crie **MODERATION_API_KEY** com essa chave. O segredo fica no backend. As variáveis internas Supabase são fornecidas pelo serviço; não coloque service_role no frontend.
3. Após Fetch/Pull de `codex/na-real-dev` no GitHub Desktop, publique o código atualizado pelo seu terminal na pasta do NA REAL:

```sh
npx supabase login
npm run moderation:deploy-services
npm run moderation:services-check
```

O deploy exige `edge_functions_write`, ainda ausente na credencial deste ambiente. Esse é o código novo do moderador, não apenas a existência das funções antigas.

4. No [painel web](https://na-real-moderacao-bruno.brunoaloy-gruposetup.chatgpt.site), entre com sua conta, abra **Ferramentas** e toque **Analisar fila com IA**. Uma resposta de serviço antigo pede atualização, sem inventar contagens. Ausência de chave informa que a IA não foi configurada. Falhas deixam os itens pendentes.
5. Para acompanhar os envios dos dois aparelhos, ative **Analisar novos envios automaticamente**. A fila é consultada a cada minuto enquanto essa aba estiver aberta; fechar a aba, trocar de seção ou sair da conta interrompe o acompanhamento. Uma análise já iniciada pode terminar no servidor. Não foi configurado cron ou processamento contínuo com o painel fechado.

## Decisões da IA

A API real de moderação recebe somente os campos de conteúdo e cópias sanitizadas de fotos quando necessário, sem e-mail de Auth, senha, token ou identificadores internos do relatório. Cada lote processa até 10 itens e registra versão da política, sinalizadores, scores e motivo. A regra não garante detectar toda violação.

- Textos de conversa/avaliação sem sinalizadores e sem indicadores de privacidade/fraude podem ser aprovados.
- Sinalizador coerente e score de pelo menos 0,98 em categorias explícitas de ameaça, assédio, discriminação, conteúdo sexual envolvendo menores ou instruções de autoagressão permite reprovação automática. O motivo oferece revisão pelo Perfil. Um sinalizador fraco ou contextual não basta para reprovar.
- Casos duvidosos, links, dados pessoais e indicadores financeiros ficam pendentes para você. Lugares, perfis e fotos sem violações continuam exigindo aprovação humana; a IA não comprova existência/endereço ou direitos de uma imagem.
- Falta de chave, timeout, falha do provedor, resposta malformada ou mudança da versão do conteúdo não aprovam o item. A revisão humana pode alterar uma decisão e há contestação no Perfil. Contas não são suspensas automaticamente.

## Roteiro dos dois aparelhos

1. **iPhone A:** entre com sua conta preservada. **iPhone B:** crie uma segunda conta com outro e-mail e confirme o e-mail. Duas contas são necessárias para testar permissões entre pessoas; a mesma conta em dois aparelhos testa apenas duas sessões.
2. A escolhe a cidade e cadastra um lugar real com endereço e pino conferidos. B ainda não deve vê-lo no catálogo enquanto estiver pendente. A acompanha o estado pelo Perfil.
3. No navegador, revise e aprove o lugar. B atualiza a busca e confere lista e pin. A aprovação do lugar não aprova sua foto; prepare e revise a imagem separadamente.
4. B envia uma avaliação ou mensagem sobre o lugar. Com a IA configurada e a aba Ferramentas acompanhando, confira o resultado do lote e o estado no Perfil. A atualiza o lugar e verifica o conteúdo aprovado.
5. Confira falhas e pedidos de revisão: respostas ambíguas devem permanecer pendentes, e a decisão humana/motivo devem aparecer ao autor. Os testes unitários usam respostas de provedor controladas para validar reprovação de modo determinístico; uma chamada real do modelo pode variar.
6. Testem os aparelhos ao mesmo tempo: busca, favoritos, perfil, envio e atualização. Verifiquem que B não edita os envios de A e que somente A acessa moderação. Confirmem também envio com conexão interrompida/reenvio, sem criar cadastros duplicados.

Registre versão, aparelho, horário e resultado no feedback existente. Nenhum teste autenticado nos seus aparelhos ou análise real com a chave foi realizado por este ambiente.
