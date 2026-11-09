# Opções de domínio e envio de e-mail

Preparado em 09/11/2026 para decisão do proprietário. Nenhum domínio foi registrado, conta foi criada ou serviço foi contratado. As sugestões abaixo **não têm disponibilidade ou preço confirmados**. As consultas aos sites de Registro.br, Resend e Brevo foram bloqueadas pela política de rede deste ambiente; não foram substituídas por preços presumidos.

## Nomes para comparar

| Sugestão             | Vantagem                                                                | Consideração                                        |
| -------------------- | ----------------------------------------------------------------------- | --------------------------------------------------- |
| **usenareal.com.br** | Chamada fácil de lembrar, ligada ao nome do app e ao público brasileiro | Minha primeira opção para verificar e cotar         |
| **narealapp.com.br** | Explica de imediato que é o aplicativo NA REAL                          | Um pouco mais comprido para ditar                   |
| **nareal.app**       | Curto e alinhado a um aplicativo                                        | Comparar registro e renovação com as opções .com.br |

Disponibilidade deve ser confirmada no registrador antes da escolha. O domínio não precisa ser igual ao identificador técnico do aplicativo nas lojas.

Para .com.br, o ponto inicial sugerido é [Registro.br](https://registro.br/dominio/). Compare preço de **registro e renovação**, prazo contratado, titularidade na sua conta e controle do DNS. Não há cotação atual nesta entrega.

## Provedor de envio

| Opção      | Uso proposto                                                                         | O que conferir na contratação                                                                  |
| ---------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| **Resend** | Primeira opção para conectar o SMTP dos e-mails transacionais do NA REAL ao Supabase | Domínio verificado, SMTP, limites de envio, preço atual, retenção dos logs e custos adicionais |
| **Brevo**  | Alternativa para comparar um painel de envio transacional                            | SMTP, limites e eventuais restrições do plano, preço atual e retenção dos logs                 |

Sites para consultar: [Resend](https://resend.com/pricing) e [Brevo](https://www.brevo.com/pricing/). Planos, preços, cotas e exigências podem mudar; não estou afirmando que um plano gratuito atenderá ao piloto.

Minha combinação inicial para cotar é **usenareal.com.br + Resend**, com o domínio sob controle do proprietário. Só depois de verificar disponibilidade e valores vale definir um limite de gasto e autorizar uma contratação específica.

## Identidade que vamos configurar

- Nome exibido: **NA REAL**.
- Endereço de envio: um endereço verificado no domínio que for escolhido. Nenhum endereço foi configurado nesta etapa.
- Assuntos: “Confirme seu e-mail no NA REAL” e “Recupere seu acesso ao NA REAL”.
- Templates: os HTML já preparados em `supabase/templates`.
- DNS: usar exatamente os registros fornecidos pelo provedor para autenticar o envio; nunca valores inventados.
- Credenciais SMTP: armazenadas no painel seguro do Supabase, fora do app, Git e chat.

O domínio fornece a identidade e o DNS; o provedor faz o envio. A ativação e os testes reais estão detalhados em [EMAIL_NA_REAL.md](EMAIL_NA_REAL.md).

## Execução que aguarda acesso

Na consulta real de 09/11/2026, a conta do proprietário está confirmada; ainda não é moderadora. A API de banco responde como `supabase_read_only_user`, com transação somente leitura, inclusive em uma consulta sem mutação com `read_only=false`; as configurações Auth retornam 403. Existem dois cadastros de demonstração autorizados para exclusão, uma foto diretamente ligada a eles e zero avaliações/mensagens ligadas a eles. Não houve mudanças remotas nesta conferência.

O proprietário escolheu conectar acesso de escrita pelo ambiente seguro. Essa intenção ainda precisa ser seguida da conexão efetiva e de uma nova verificação de permissões. Não envie chaves ou senhas pelo chat.

Quando o acesso estiver disponível, a sequência é:

1. Confirmar projeto e conta, liberar a moderação autorizada e verificar o resultado.
2. Remover a foto vinculada pelo Storage API/fluxo do app e, depois, os dois cadastros de demonstração, preservando os guardas dos SQLs em `scripts/pilot`.
3. Depois da escolha/contratação do domínio e SMTP, verificar DNS e remetente e ativar os modelos NA REAL.
4. Cadastrar estabelecimentos reais a partir de informações verificadas e fotos autorizadas. Os cadastros de demonstração não serão reaproveitados como conteúdo real.
5. Validar confirmação e recuperação de conta no iPhone, duas contas, aprovação e persistência antes de convidar o grupo.

A verificação de distribuição continua apontando identidade provisória e projeto Expo/EAS não vinculado. Apple Developer e instalação TestFlight não foram confirmados nem iniciados. Os testes em Expo Go podem ser feitos em sessão supervisionada; instalação independente depende da preparação em [PILOTO_IPHONE.md](PILOTO_IPHONE.md).
