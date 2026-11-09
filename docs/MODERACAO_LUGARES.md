# Revisar novos lugares

## Fluxo disponível

1. A pessoa envia o lugar; ele fica **Em análise**, sem entrar na busca pública.
2. Um moderador autorizado abre **Perfil → Moderação**. A fila começa em **Lugares**, com nome, categoria, cidade, endereço e descrição. “Toda a comunidade” inclui os demais tipos de conteúdo.
3. Confira existência, endereço, duplicatas e informações enviadas. Escreva um motivo e escolha **Aprovar após revisão**, **Rejeitar** ou **Manter pendente**. Fotos têm revisão própria; aprovar o lugar não aprova a foto.
4. A confirmação aparece somente se o servidor retornar uma decisão aplicada. Se a versão mudou, a fila é recarregada e exige nova revisão. “Atualizar fila” e puxar para atualizar permitem conferir o estado atual.
5. Um lugar aprovado entra no catálogo; só terá pin verde se tiver posição válida. O autor acompanha estado/motivo no perfil.

A autorização é conferida pelo RPC `safe_is_admin` e pelas regras do banco. O painel não concede poderes a quem está logado, e não consulta a fila para visitantes ou contas sem permissão.

## Moderação automática

A função `moderate-pending` existente pode analisar textos com `MODERATION_API_KEY` configurada no servidor. O botão executa um lote manual; não configura agendamento. Ausência do provedor mantém os itens pendentes. Não coloque chave de IA no aplicativo.

**Novos lugares, perfis e fotos exigem aprovação humana**, tanto no veredito da função quanto no banco. A classificação de conteúdo não comprova que um comércio existe ou que seu endereço está correto. Textos elegíveis podem ser aprovados automaticamente pelas regras existentes; suspeitas ficam para revisão. Não foi ativada aprovação automática de estabelecimentos nesta rodada.

## Acesso do proprietário

Consulta real em 09/11/2026: token presente, API de consulta autenticada, sessão `supabase_read_only_user` / `transaction_read_only=on`, zero moderadores para a conta indicada e zero lugares aprovados. A API de listagem de funções retornou HTTP 403; deployment e configuração de IA não foram confirmados. Nenhum dado ou permissão remota foi alterado.

O script operacional [01-enable-owner-moderation.sql](../scripts/pilot/01-enable-owner-moderation.sql) já contém a conta confirmada indicada pelo proprietário. Para habilitar a moderação, ele precisa ser executado no SQL Editor do projeto correto ou por uma conexão autorizada de escrita. A autorização do proprietário já foi dada; falta acesso técnico de escrita. Não é necessário contratar domínio para revisar lugares. Configurar/deployar a função de IA exige também permissão para Edge Functions e seus secrets, além do acesso ao provedor. Não exponha tokens ou senhas no chat.

Depois de habilitar, saia e entre na conta e confira o atalho no perfil. Valide primeiro um cadastro real com uma segunda conta. A limpeza dos dois cadastros de demonstração continua separada no roteiro do piloto e não deve publicá-los.

## Verificação

`npm run test:moderation-ui` usa somente respostas interceptadas: visitante, conta sem papel, fila legível, motivo obrigatório, decisão desatualizada, IA não configurada, aprovação confirmada/recarga e largura de 320 px. Os testes unitários existentes também verificam que lugares continuam exigindo revisão humana. Esses testes não substituem a revisão real no projeto e no iPhone.
