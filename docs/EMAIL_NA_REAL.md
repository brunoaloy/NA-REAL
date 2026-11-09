# E-mails com a identidade NA REAL

Preparação de 08/11/2026. O proprietário ainda não possui domínio nem serviço de envio. Foram preparados os modelos e a configuração de marca; **eles não foram ativados no projeto hospedado**. A API de configurações Auth recusou leitura e aplicação com HTTP 403. Nenhum e-mail foi enviado nesta rodada.

Opções para a próxima decisão: [domínio e serviço de envio](OPCOES_DOMINIO_EMAIL.md). As sugestões ainda não têm disponibilidade ou preço confirmados.

## O que está pronto

| Mensagem              | Assunto                        | Modelo                                 |
| --------------------- | ------------------------------ | -------------------------------------- |
| Confirmação de conta  | Confirme seu e-mail no NA REAL | `supabase/templates/confirmation.html` |
| Recuperação de acesso | Recupere seu acesso ao NA REAL | `supabase/templates/recovery.html`     |

Os modelos usam marca, verde e linguagem do NA REAL, sem imagens/fontes externas ou pixels de rastreamento. Os botões preservam `{{ .ConfirmationURL }}`, gerado pelo Supabase para validar a solicitação e seu redirect. Não substitua esse campo pelo endereço fixo de uma tela do app.

A configuração local do Supabase aponta para esses arquivos. Alterar `supabase/config.toml` não publica automaticamente templates no projeto hospedado.

## Nome na caixa de entrada

Para o remetente aparecer como **NA REAL** no lançamento, configure um serviço SMTP e um endereço em um domínio sob seu controle. Exemplo de formato, sem endereço real escolhido: `NA REAL <confirmacao@SEU_DOMINIO>`.

1. Registre um domínio escolhido por você e configure um provedor de envio transacional com SMTP. Não foi contratado nenhum serviço ou escolhido domínio nesta entrega.
2. Verifique o domínio/endereço no provedor. Aplique os registros DNS SPF/DKIM fornecidos por ele e configure DMARC para seu domínio. Os valores dependem do provedor; não use registros inventados.
3. Nas configurações de e-mail/SMTP do Supabase, informe host, porta, usuário, senha do provedor e endereço remetente verificado. Defina **Sender name / Nome do remetente: NA REAL**. Credenciais devem ficar no painel seguro, nunca no app, Git ou chat.
4. Nos templates de confirmação e recuperação, copie os assuntos e HTML acima. Mantenha a confirmação de e-mail habilitada.
5. Confira Site URL e os redirects exatos da versão em teste. Expo Go e o aplicativo instalado usam links diferentes; a versão instalada usa `nareal://auth-callback`. O fluxo PKCE precisa do mesmo aparelho/contexto que iniciou a solicitação.

O nome exibido, o endereço remetente e o assunto são configurações distintas. O domínio do link de confirmação pode continuar sendo o do Supabase: mudar esse domínio é outra configuração e não é necessário para usar o nome NA REAL no remetente. O serviço de e-mail padrão do Supabase tem restrições para desenvolvimento; não o considere a configuração final para convidados externos.

## Preparar/aplicar pela API

```sh
npm run auth-email:prepare
```

Gera `.local-services/auth-email-branding.json` (ignorado pelo Git) com exatamente cinco campos: nome do remetente, dois assuntos e dois conteúdos HTML. Não contém credenciais e não altera o servidor.

Quando houver acesso autorizado de escrita às configurações Auth do projeto:

```sh
npm run auth-email:apply
```

O comando usa `SUPABASE_ACCESS_TOKEN` do ambiente seguro e o projeto NA REAL `zcnfssihiqmbrlwvlsme`. Atualiza somente os cinco campos preparados; não configura host/senha SMTP, redirects nem desabilita confirmação. A API precisa permitir **auth:write** / escrita das configurações Auth. O token disponível nesta rodada recebeu 403. Se usar o painel, não é necessário fornecer token ao aplicativo.

A resposta é verificada sem imprimir a configuração inteira, que pode conter informações sensíveis. Nenhum comando envia um e-mail de teste automaticamente. Preparar os templates não comprova que o nome já mudou na caixa de entrada.

## Conferir antes de convidar pessoas

Depois de configurar domínio, SMTP e templates, crie uma segunda conta de teste pelo app no próprio iPhone:

- Confira que remetente, endereço e assunto mostram a identidade escolhida e que o e-mail chega também a um destinatário externo à equipe do projeto.
- Confirme a conta pelo link e entre no app. Teste recuperação de senha e retorno ao contexto correto.
- Solicite um novo link quando o anterior expirar e confira spam/entrega.
- Registre os resultados no roteiro do piloto. Esses testes reais ainda não foram feitos.

A identidade de e-mail é ativada no backend; não exige publicar uma nova versão do app nas lojas. O lançamento pelo TestFlight continua dependendo também de Apple Developer/EAS e dos demais itens em [PILOTO_IPHONE.md](PILOTO_IPHONE.md).
