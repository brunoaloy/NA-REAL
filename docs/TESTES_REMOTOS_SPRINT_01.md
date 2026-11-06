# Testes reais após aplicação controlada

**Preparado, ainda não executado no remoto.** Executar somente após history/postflight/dry-run final aprovados conforme APLICACAO_CONTROLADA_WINDOWS.md. O alvo atual é classificado pela CLI como production: não publicar estabelecimentos, experiências, notas ou fotos fictícias para testar. Para uma suíte com fixtures fictícias e limpeza automática, usar um ambiente isolado autorizado; a suíte `test:services` existente permanece restrita a localhost.

## Pré-condições e evidências

- Registrar project-ref, horário, HEAD Git, dez versões remotas, resultados do postflight e versões de app/OS. Guardar só identificadores necessários, sem tokens, e-mails, senhas ou dados pessoais em evidências públicas.
- Preservar Auth/SMTP/redirects existentes. Validar entrega de e-mail/PKCE no próprio dispositivo; não desabilitar confirmação para facilitar teste.
- Usar duas contas reais de teste controladas pelo proprietário (A e B) e um operador de moderação já autorizado. Designação de moderador exige procedimento administrativo próprio; o app não pode conceder esse papel a si mesmo.
- Identificar um estabelecimento público real ainda ausente do catálogo. Conferir nome/endereço/coordenadas e autorização das fotografias. Não usar residência ou dados pessoais de terceiros.
- Guardar ID do lugar L e, depois, ID da avaliação R. Não registrar cookies, tokens ou dumps de usuários em chat/Git.
- Preparar responsáveis para revisão: places, reviews e fotos ficam pendentes até aprovação. Pendência é comportamento correto, não falha de persistência.

## Matriz de aceitação

| Etapa           | Ação real                                                             | Resultado exigido                                                                                                           |
| --------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Visitante       | Abrir Explorar e pesquisar nome/cidade/UF/categoria                   | RPC retorna dados reais ou vazio honesto; nenhum pending aparece                                                            |
| Auth A          | Criar/confirmar conta ou entrar com conta existente; reabrir app      | Sessão restaurada; logout remove acesso privado                                                                             |
| Cadastro        | A procura duplicatas e cadastra L com dados públicos verdadeiros      | ID persistido, estado pendente e detalhe próprio; sem aprovação fictícia                                                    |
| Privacidade     | B e visitante procuram L antes da revisão                             | Não encontram conteúdo pendente de A                                                                                        |
| Moderação       | Operador revisa o conteúdo real e decide aprovação de L               | Decisão auditada sobre a revisão atual; nenhum papel administrativo dado a A/B                                              |
| Descoberta      | Visitante/B buscam L por nome, cidade, UF e categoria                 | Mesmo ID, endereço/coordenadas corretos, sem nota inventada; sem reviews = Sem avaliações                                   |
| Mapa            | Selecionar L no mapa licenciado, mover viewport e alternar lista/mapa | Marcador real, cartão e detalhe corretos; consulta não exige localização pessoal                                            |
| Proximidade     | Primeiro recusar localização; depois autorizar quando desejado        | Busca nacional funciona sem permissão; ao autorizar, ordem usa coordenadas do dispositivo e permite voltar à ordem por nome |
| Review A        | A publica sua experiência verdadeira com nota rA e comentário         | R persistida uma única vez por A/L, pendente; B/visitante ainda não veem                                                    |
| Review aprovada | Operador revisa e aprova R                                            | Média rA e contagem 1 quando não houver outras reviews válidas                                                              |
| Persistência    | A fecha/reabre app; outro dispositivo/sessão consulta R               | Mesmo ID, nota e texto; não depende do cache em memória                                                                     |
| Edição          | A edita R com comentário/nota verdadeiros rA2                         | Mesmo ID; retorna a pendente; média deixa de incluir essa revisão até nova aprovação                                        |
| Nova revisão    | Operador aprova a versão editada                                      | Média/contagem recalculadas pelo banco, sem média enviada pelo cliente                                                      |
| Review B        | Se B tiver experiência real, publicar rB e revisar                    | Uma review por A/L e uma por B/L; média (rA2+rB)/2 se forem as únicas válidas                                               |
| Mídia           | A escolhe foto autorizada, confere seleção e envia                    | JPEG comprimido, limite 5 MB, original privado, associação correta; só cópia preparada/revisada é exibida                   |
| Pós-logout      | A sai, B entra no mesmo aparelho                                      | Rascunho/dados privados de A não são apresentados como conteúdo próprio de B                                                |

Sem experiências reais para avaliar, não inventar notas: manter essa etapa pendente ou executar fixtures em ambiente isolado. Guardar as expectativas da média usando valores realmente enviados e aprovados, incluindo reviews legítimas preexistentes no denominador.

## Testes negativos no servidor

A ausência de botão na UI não prova RLS. Em um cliente Supabase isolado autenticado como B, testar uma tentativa controlada de editar R de A (mesmo valor original, sem alteração de conteúdo), e em seguida confirmar em sessão A que R não mudou. Esperar erro de permissão ou zero linhas retornadas. Não usar service_role nesse cliente; registrar apenas código/contagem, nunca a sessão.

Também confirmar:

1. Visitante não consegue cadastrar L. A tentativa deve ser recusada, sem linha persistida; usar a mesma submissão pública válida para não confundir validação de campos com RLS.
2. A não consegue atribuir autoria a B nem aprovar conteúdo alterando moderation_state/status. Verificar negação no servidor, sem autoaprovação.
3. A segunda submissão de review de A/L é recusada pela unique ou atualiza a mesma review pelo fluxo oficial; não aumenta a contagem de avaliações independentes.
4. Cadastro duplicado de L é recusado e não gera segunda linha. Testar concorrência somente em ambiente isolado com capacidade/fixtures autorizadas; não enviar rajadas ao alvo production.
5. B não consegue alterar/baixar original privado de foto de A. Não executar remoção irreversível no projeto real para provar autorização; testar exclusão em ambiente isolado ou por roteiro específico autorizado.
6. A/B não conseguem gravar safe_admins, safe_accounts ou executar decisão administrativa. Operador autorizado consegue revisar uma contribuição legítima e a decisão fica auditada.
7. Conteúdo pendente/removido não aparece como público, inclusive nas médias, na busca e nas fotos vinculadas.

Se um teste de permissão retornar sucesso inesperado, interromper os testes de escrita e tratar o incidente, sem deixar conteúdo exposto e sem modificar políticas às cegas.

## Fotos e Edge Functions

A aplicação de migrations não implanta funções. Conferir/deployar `prepare-photo`, `delete-photo`, `delete-account`, `moderate-pending` pelo procedimento existente, preservando secrets remotos; esta etapa é separada do plano de migrations. Não chamar delete-account/delete-photo em dados reais nesta verificação.

Sem IA configurada, conteúdo permanece pendente e deve ser revisado por operador; não tratar ausência de provider como aprovação. Para foto, operador autorizado prepara a cópia sanitizada antes de revisar. Verificar arquivo real e metadados, URLs assinadas e negação de acesso ao original por B. Conferir continuidade após expirar uma URL assinada.

## Registro e encerramento

Usar os estados **passou**, **falhou**, **bloqueado** ou **não executado**, individualmente. Não substituir um bloqueio por aprovação local. Não remover automaticamente dados/contas do projeto real ao final; dados legítimos seguem o fluxo normal e fixtures só podem existir em ambiente isolado.

| Cenário                                    | Estado inicial               | Evidência a preencher                                  |
| ------------------------------------------ | ---------------------------- | ------------------------------------------------------ |
| Histórico 001–010 e postflight             | Não executado após aplicação | Versões, RLS, buckets, RPCs, zero pendências           |
| Cadastro / moderação / busca               | Não executado                | L, sessões usadas, resultado por papel                 |
| Avaliações / média / edição / persistência | Não executado                | R, notas reais, contagens e estado por revisão         |
| RLS visitante / A / B / operador           | Não executado                | Operação, código/linhas e leitura independente         |
| Fotos / Storage / Edge Functions           | Não executado                | IDs, privacidade, sanitização e aprovação              |
| Mapa licenciado e localização opcional     | Não executado                | Provedor, plataforma e comportamento com/sem permissão |
| Android/iOS real                           | Não executado                | Build, aparelho, OS e resultado                        |

**Sprint 01 só pode ser concluído depois de validar o banco remoto e seus fluxos persistidos, além dos demais critérios do pedido original.**
