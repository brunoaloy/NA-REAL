# NA REAL Safe

## Publicação e análise

Mensagens, perguntas, respostas, avaliações/comentários, fotos, relatos, estabelecimentos e perfis têm `moderation_state` e `content_revision`. O default é `pending`. Triggers criam snapshots na fila protegida; edições geram nova versão. Decisão sobre versão antiga não aprova a nova. Nenhuma credencial de IA está no cliente.

Worker configurável usa resposta real da OpenAI Moderation, valida estrutura e sinais. Falha, timeout, ausência de chave ou resposta incompleta não aprovam conteúdo. Sinais de abuso, possíveis dados pessoais/pagamentos e risco permanecem pendentes para análise humana. Essa triagem não identifica crimes nem garante detecção completa. Perfis, estabelecimentos e fotos exigem decisão humana mesmo após IA sem flags.

Estados públicos: approved/aprovado, pending/pendente, rejected/rejeitado, removed/removido. Autores veem seus próprios estados; terceiros só leem conteúdo aprovado e compatível com bloqueios/suspensão. Médias ignoram avaliações não aprovadas. Reaprovações da mesma resposta não duplicam notificações.

## Imagens

Originais nunca ficam públicos. O backend remove segmentos de metadados JPEG, grava cópia imutável em bucket `reviewed-photos` e registra receipt. A cópia analisada/exibida é a que pode ser aprovada; clientes não podem substituí-la após análise. Fotos sem receipt não podem ser aprovadas. `prepare-photo` permite preparar mídia para revisão humana sem IA. Resultados com sinalizador de possível abuso sexual envolvendo menores não são automaticamente exibidos na fila; exigem procedimento restrito de escalonamento. Antes de operar em produção, definir equipe, procedimento legal e canal de emergência apropriados.

## Administração e contestação

`safe_admins` é configurada somente por operador privilegiado. A rota `/admin` consulta a fila, denúncias e recursos; RPCs checam RBAC no servidor e registram decisão/motivo/autor/horário. Alterar metadata do Auth não concede privilégios. Autores podem contestar rejeição/remoção no Perfil; contas suspensas podem pedir revisão sem recuperar permissão de postar.

Denúncias por tipo de UGC são privadas ao denunciante e moderadores. Bloqueios são privados e ocultam interações entre os envolvidos em consultas futuras. Cache e URLs assinadas já emitidas podem persistir brevemente; URLs duram até cinco minutos. Suspensão impede novas escritas públicas e oculta conteúdo para terceiros.

## Abuso e operação pendente

Limites por usuário, ação e janela são aplicados em transações com advisory locks; ledger independente impede reiniciar o orçamento apagando conteúdo. Ainda é necessário gateway/rate limit por IP, monitoramento operacional, paginação completa da ferramenta administrativa e política de retenção/expurgo de versões e uploads órfãos. A fila atual mostra até 100 itens recentes, 50 denúncias/recursos e não substitui equipe de moderação.

Cobertura automatizada é proporcional, sujeita a falsos negativos/positivos e revisão humana. Não publicar para público externo antes de configurar equipe e verificar o pipeline completo com arquivos e usuários reais.
