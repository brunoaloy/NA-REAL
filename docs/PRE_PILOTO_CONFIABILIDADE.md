# Confiabilidade antes do piloto

Rodada de 09/11/2026. Alterações de cliente, sem migration, exclusão, alteração de credenciais ou dados reais. O reset e a ativação da IA continuam operações separadas do [roteiro dos dois iPhones](TESTE_DOIS_IPHONES.md); não foram executados por esta rodada.

## Segurança e troca de conta

O carregamento inicial da sessão não pode substituir um evento de logout/login mais recente. O observador ignora respostas antigas e eventos após desmontar a tela. O rascunho de feedback também é reiniciado ao trocar de conta. Na troca de conta, consultas são canceladas, o cache é removido e o diagnóstico em memória é limpo. Os envios de lugar, avaliação, mensagem e fotos recebem o usuário esperado da tela e conferem a sessão antes da operação. Mensagens ficam vinculadas ao token da conta que iniciou o envio, para não mudar de autor se o login trocar durante a requisição. Não é persistida outra sessão para isso. Isso complementa a autorização do servidor; não a substitui.

Consulta real de configuração confirmou RLS ativo nas 11 tabelas examinadas: profiles, places, reviews, photos, favorites, moderation_items, moderation_actions, safe_admins, notifications, place_messages e safe_write_events. As sete permissões privilegiadas verificadas retornaram false para o cliente comum: autoaprovação de lugar/perfil, alteração do dono de foto, concessão de moderador, exclusão do orçamento de escrita, moderação anônima e aplicação de veredito de provedor pelo cliente.

O SQL de conferência repetível está em [04-check-permissions.sql](../scripts/pilot/04-check-permissions.sql). A checagem é de configuração, não um teste autenticado entre dois usuários nem uma auditoria completa de segurança. O fluxo formal da skill de scan não pôde ser iniciado: referência/preflight não disponíveis neste ambiente; não foi gerado relatório formal de Codex Security.

## Envios e recuperação

- A mesma seleção de foto reutiliza uma referência por conta e destino enquanto permanece em memória. A metadata é confirmada por owner/path antes do envio; respostas perdidas são recuperadas pela consulta correspondente.
- Se o upload falha ou retorna conflito em uma repetição, só há confirmação de sucesso quando o mesmo arquivo, no mesmo caminho, aparece no Storage com o tamanho esperado. O arquivo não é sobrescrito. A metadata não é removida depois de uma falha ambígua, evitando perder a associação de um arquivo que já chegou.
- Uma falha pode deixar uma foto pendente sem arquivo até a repetição ou exclusão pelo proprietário. Fechar/recarregar o app perde o recibo em memória: não foi criada uma fila persistente de uploads em segundo plano. Confira o Perfil antes de selecionar a mesma foto outra vez após reiniciar.
- Avaliações têm unicidade por usuário/lugar; se a resposta de salvamento se perde, o cliente só confirma após recuperar uma avaliação pendente com os mesmos valores. Conteúdo antigo já aprovado/rejeitado não confirma que uma edição nova foi recebida. Conteúdo diferente não é tratado como sucesso.
- Cadastros com resposta de rede inconclusiva mostram orientação e atalho para conferir o Perfil antes de reenviar. O bloqueio de duplicatas do servidor permanece; não há recibo persistente de cadastro novo nesta rodada.
- Mensagens mantêm o identificador de solicitação já existente no servidor. Relatos ao vivo agora também bloqueiam chamadas simultâneas do mesmo botão. Não há reenvio automático de contribuições após perda de rede.

## Desempenho e uso

Busca e mapa consomem o sinal de cancelamento da consulta, interrompendo requisições obsoletas. Eventos repetidos de rede/foreground deixam de invalidar tudo repetidamente. O estado de foco é propagado ao gerenciador de consultas, para respeitar as pausas em segundo plano; a reconexão não cancela uma recarga equivalente já em andamento.

A galeria obtém as URLs assinadas de até seis fotos em **um pedido**, em vez de seis pedidos individuais, mantendo TTL de 300 segundos e staleTime de 240 segundos. A associação é por caminho, sem confundir imagens se o servidor mudar a ordem; falha de uma imagem não esconde todas as válidas. Isso reduz o número de chamadas de assinatura, sem prometer redução específica de tempo no iPhone.

`npm run performance:check` faz três consultas públicas, sem escrever e sem imprimir conteúdo, chave, conta ou localização pessoal. Nesta execução: 1847, 557 e 292 ms; mediana 557 ms. Essas amostras incluem a rede deste ambiente e não medem abertura, renderização ou memória do telefone.

Botões compartilhados podem anunciar estado ocupado; o envio de foto mostra Enviando foto e bloqueia novo toque. Rótulos e escala de fontes existentes foram preservados. VoiceOver, teclado, fonte ampliada, contraste visual e áreas de toque precisam da conferência no iPhone; não são declarados validados por compilação.

## Diagnóstico e operação

O feedback oferece incluir diagnóstico técnico, desligado por padrão. Registra somente horário, tipo fixo de operação e categoria genérica da falha, com limite de 20 entradas em memória. Não armazena mensagens de erro brutas, corpo de requisição, dados da conta, e-mail, senha, token, coordenadas ou fotos. Não há envio automático nem novo coletor externo. Logout e troca de usuário limpam o buffer; recarregar encerra essa memória.

A pessoa vê a cópia exata do diagnóstico antes de compartilhar; novos eventos não entram silenciosamente no relato já visualizado. Ela escolhe aplicativo e destinatário. O compartilhamento não confirma entrega.

Para recuperar uma versão de código com problema, reverta o commit pelo Git e faça nova publicação/recarregamento; esta rodada não exige rollback de schema. Isso não restaura conteúdo apagado no servidor. Backups e recuperação de dados do Supabase não foram configurados ou testados nesta rodada.

## Verificação

Testes incluem corrida de sessão, troca de conta, eventos de conexão repetidos, uploads com respostas perdidas, manutenção do recibo após falha, associação de fotos em lote e diagnóstico sem dados recebidos do erro. O teste de integração executa o serviço real de fotos com transporte controlado, sem câmera, tokens ou gravação remota. Os demais testes usam fixtures locais.

TypeScript, lint e bundles web/iOS são conferidos. Testes visuais, duas contas reais e recuperação real de arquivos continuam pendentes; o ambiente anteriormente apresentou bloqueio de prévia/navegador e falta de espaço no teste SQL local. Não houve nova exclusão ou tentativa de reset para validar essas alterações.
