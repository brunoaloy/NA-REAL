# Primeiro piloto no iPhone

Preparação de 08/11/2026. O proprietário informou que os primeiros convidados usarão apenas iPhone e que ainda não tem Apple Developer Program. Nenhum convite, build EAS ou publicação foi executado.

## O que já está no aplicativo

- Sugestões locais de cidades, com UF, e última cidade lembrada no aparelho. Limpar busca e filtros também remove essa preferência. São dados de municípios, não um catálogo de comércios.
- A cidade escolhida abre sua região no mapa. Um lugar da lista com posição marcada tem “Ver no mapa”, que abre seu pin selecionado. O centro da cidade nunca é enviado como posição de um estabelecimento.
- Cadastro em quatro passos: lugar, endereço, foto opcional e conferência. Avançar/voltar preserva o rascunho. Selecionar foto não envia nada antes da confirmação do cadastro. Se somente a foto falhar, ela pode ser reenviada sem cadastrar outro lugar.
- Sucesso com “Acompanhar aprovação”, abrindo os próprios lugares no perfil. Conteúdo continua pendente até revisão.
- “Moderação da comunidade” no perfil aparece somente quando `safe_is_admin` confirma a permissão. O servidor continua validando cada decisão.
- Privacidade e configurações → Guia dos primeiros testes: cinco tarefas e orientações para relatar problemas. O checklist não envia respostas.

## Resolver o Supabase antes do grupo

A conexão de gerenciamento desta sessão confirmou `supabase_read_only_user`, `transaction_read_only=on`, conta do proprietário confirmada, zero permissões de moderador e uma foto ligada aos dois cadastros de demonstração. As tentativas de incluir o moderador foram recusadas com SQLSTATE 25006. Nenhuma permissão ou dado remoto foi alterado. Os dois “Samy” foram identificados pelo proprietário como demonstração e autorizados para exclusão; não foram aprovados como lugares reais.

Para concluir no projeto **NA REAL**, `zcnfssihiqmbrlwvlsme`, com uma conexão de escrita autorizada no SQL Editor do dashboard Supabase:

1. Execute `scripts/pilot/01-enable-owner-moderation.sql`. Ele identifica apenas o UUID da conta confirmada indicada pelo proprietário, recusa conta suspensa e retorna `moderator_enabled=true`. Não exige uma nova migration nem concede acesso pelo cliente.
2. Reinicie o app e confira Perfil → Moderação da comunidade.
3. Remova a foto de demonstração em Perfil → Minhas fotos. Use o fluxo de remoção que apaga os arquivos pelo Storage API. Se a Edge Function não estiver publicada, remova os arquivos originais e revisados correspondentes pelo painel Storage ou Storage API autenticado; não apague `storage.objects` por SQL.
4. Execute `scripts/pilot/02-remove-authorized-demo-places.sql`. Ele só alcança os dois IDs autorizados, confirma autor/nome/cidade, interrompe se ainda houver arquivos no Storage ou novas contribuições e informa quantos cadastros de demonstração restam. O resultado esperado é zero. Não foi executado nesta sessão.
5. Cadastre alguns estabelecimentos públicos reais, confira endereço e entrada no mapa e revise pelo painel. O catálogo continua vazio até existirem aprovações reais. Não use os centros dos municípios como entradas de comércios.

A API disponível precisa de acesso efetivo de escrita ao banco para fazer essas operações daqui; um token que continue produzindo sessão read-only não basta. Não envie tokens, senhas ou service_role no chat. A inspeção anterior de Edge Functions retornou 403, portanto não há confirmação de deployment pelo endpoint de gerenciamento.

## E-mails e acompanhamento

Antes dos convites, configure SMTP/domínio e os [e-mails NA REAL](EMAIL_NA_REAL.md). O proprietário ainda não possui esse serviço; os templates estão preparados, mas a aplicação remota foi recusada com 403. No app, o acompanhamento mostra a versão mais recente da contribuição, status e motivo da revisão. Avaliações podem ser abertas para edição; lugares não publicados não ganharam edição direta do banco, e podem receber pedido de revisão. Configurações/guia oferecem Enviar feedback: a pessoa revisa seus textos e dados básicos do aparelho e escolhe por qual aplicativo compartilhar; não há envio automático para um servidor de feedback.

## Opção imediata: Expo Go

É um teste compartilhado do projeto, não uma instalação independente do NA REAL.

1. Receba `codex/na-real-dev` pelo GitHub Desktop e rode `npm run phone` no computador.
2. Mantenha o Metro e o túnel abertos durante a sessão. Os convidados instalam o Expo Go da App Store e abrem o QR/link da sessão no iPhone.
3. Teste primeiro no seu aparelho. Confira se a versão de Expo Go aceita o SDK do projeto. O túnel é temporário e depende do computador conectado.
4. Faça cada pessoa criar sua própria conta e confirmar o e-mail. Não empreste sua conta de moderador. Valide os links de confirmação/recuperação no aparelho; os testes automatizados não comprovam SMTP ou redirects reais.
5. Comece com três a cinco pessoas em uma sessão combinada, depois de revisar os primeiros lugares reais.

## Instalação independente: TestFlight

É o caminho recomendado para as pessoas abrirem o NA REAL sem seu computador ligado. Requer Apple Developer Program ativo, conta Expo/EAS, identidade definitiva do app e configuração no App Store Connect. Ainda não existe um link TestFlight desta entrega.

Preparação local disponível:

```sh
npm run distribution:check
```

O comando verifica identidade/EAS e indica pendências; não produz binário e não faz cobrança. Atualmente o bundle ID é provisório (`com.example.nareal`) e não há projeto EAS vinculado. O perfil `testflight` usa distribuição de loja, exige configuração pública Supabase e identidade/EAS válidas, e escolhe Apple Maps pelo provedor nativo. OAuth e push continuam desabilitados.

Depois de ter a assinatura Apple e escolher a identidade, configurar em seu próprio ambiente/EAS:

- `NA_REAL_IOS_BUNDLE_ID`: identificador definitivo, sob seu controle.
- `EXPO_PUBLIC_EAS_PROJECT_ID`: projeto criado/vinculado à sua conta Expo.
- URL e chave **publicável** do Supabase no ambiente EAS `preview`, que este perfil usa. É o projeto Supabase configurado, não um banco isolado criado automaticamente.
- Credenciais de assinatura na conta Apple/EAS, nunca no Git. SMTP, domínio/URLs, política de privacidade, exclusão de conta e formulários de privacidade também precisam de revisão antes de distribuição externa.

Quando tudo isso estiver validado, os comandos previstos são:

```sh
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build --platform ios --profile testflight
npx eas-cli@latest submit --platform ios --profile testflight --latest
```

São etapas futuras, interativas, com autenticação/assinatura e possível consumo de cota/custo. Não foram executadas. Convidados externos entram pelo TestFlight após a configuração no App Store Connect e a revisão beta exigida pela Apple. Cada pessoa instala o TestFlight da App Store e usa o convite do proprietário. Referências: [TestFlight](https://developer.apple.com/testflight/) e [distribuição iOS com EAS](https://docs.expo.dev/build/introduction/).

## Roteiro da primeira sessão

| Tarefa                                   | Resultado esperado no aparelho                                        | Situação                          |
| ---------------------------------------- | --------------------------------------------------------------------- | --------------------------------- |
| Criar conta, confirmar e recuperar senha | Link abre o app certo e a sessão funciona                             | Pendente real                     |
| Escolher Osório/RS e reabrir o app       | Cidade lembrada, lista e mapa coerentes                               | Passou com fixtures; falta iPhone |
| Abrir um lugar e salvar favorito         | Salvo após reabrir com a mesma conta                                  | Falta persistência real           |
| Editar perfil e selecionar foto          | Permissões, câmera/galeria, teclado e estado de análise claros        | Falta aparelho/Storage real       |
| Cadastrar e acompanhar                   | Sem coordenadas para digitar; pendente só aparece conforme permissões | Passou com fixtures; falta real   |
| Conta A envia, conta B consulta          | Pendente não aparece para B; aprovado aparece após revisão            | Falta segunda conta confirmada    |
| Ficar sem internet e voltar              | Aviso claro, rascunho preservado, sem sucesso falso                   | Conferir no aparelho              |
| Aumentar texto no iOS                    | Campos e ações continuam acessíveis, sem cortes                       | Pendente real                     |

Use o Guia dos primeiros testes dentro do app e `docs/feedback-piloto.csv` para registrar resultados com um apelido de teste, sem senhas. Não mande convites até concluir os pré-requisitos remotos acima e uma sessão no seu iPhone.
