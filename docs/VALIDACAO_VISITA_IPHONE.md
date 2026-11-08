# Visita a um lugar no iPhone

Rodada de 07/11/2026. Receba `codex/na-real-dev` pelo Fetch/Pull do GitHub Desktop, encerre o Metro com Ctrl+C e execute `npm run phone`. Leia o novo QR no iPhone. Esta rodada não adiciona dependências.

## Com a conta existente

1. Abra Perfil → Lugares que compartilhei. Os cadastros pendentes podem ser revisitados pelo autor; isso não os publica no catálogo.
2. Em um lugar aprovado, confira nome, endereço e Como chegar. No iPhone, a rota abre no Apple Maps; a origem fica a cargo do aplicativo de mapas.
3. Salve o favorito, reabra o lugar e confirme a persistência. Remova e confira novamente.
4. Quando houver fotos aprovadas, deslize a galeria, amplie uma foto, avance e feche.
5. Abra Avaliações, selecione estrelas e escreva uma experiência. Alterne para Sala e volte: o texto deve permanecer. Publique e confira o aviso de análise, sem interpretar envio como aprovação.
6. Confira câmera/galeria, teclado e rolagem no aparelho. Os testes Chromium não validam esses recursos nativos.

## Pré-requisitos da validação entre pessoas

A consulta remota de leitura desta rodada encontrou zero lugares aprovados, dois lugares pendentes e nenhum moderador em `safe_admins`. Nenhuma conta, permissão, aprovação ou dado do banco foi alterado. É necessário designar um responsável pela moderação e revisar os lugares antes de validar a jornada pública completa. A escolha do responsável precisa identificar a conta correta.

O proprietário informou ter apenas uma conta. Uma segunda conta com e-mail confirmado é necessária para conferir que conteúdo pendente fica restrito ao autor e que conteúdo aprovado aparece para outra pessoa. Não compartilhe senhas pelo chat.

Depois de resolver esses pré-requisitos:

1. Conta A envia avaliação/mensagem/foto de teste; conta B não deve ver o conteúdo pendente.
2. O moderador revisa o conteúdo pelo fluxo existente.
3. Conta B atualiza a tela e confere o conteúdo aprovado, autor e fotos. Conteúdo rejeitado continua ausente.
4. Conta A edita ou exclui a própria contribuição; conta B confere o resultado e as restrições de moderação.

## Evidência e limites

`npm run test:place-ui` usa respostas interceptadas para testar navegação, galeria, falha e persistência de favorito, estrelas obrigatórias, rascunhos separados e retorno do login. Não comprova RLS, Storage, e-mail nem gravações reais. As consultas remotas desta rodada foram somente de leitura.

A listagem de Edge Functions pela API de gerenciamento retornou HTTP 403. Isso impede confirmar os deployments por esse endpoint; não demonstra que estejam ausentes. Essa inspeção exige acesso do token à listagem de funções do projeto. A API de consulta de leitura do banco respondeu, sem necessidade de domínio adicional para essa consulta. Rotas usam `maps.apple.com` no iPhone e `www.google.com` na web/Android.
