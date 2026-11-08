# Distribuição para testes e publicação

O caminho atual é um piloto com poucos **iPhones**, começando pelo Expo Go. O proprietário ainda não tem Apple Developer Program; instalação independente pelo TestFlight depende dessa assinatura. Veja [PILOTO_IPHONE.md](PILOTO_IPHONE.md) para preparação, comandos futuros e pendências reais.

`eas.json` tem perfis development, preview, production e testflight. Nenhum binário, convite ou submissão foi gerado nesta rodada. O perfil testflight é de loja, usa o ambiente EAS preview, exige Supabase público e identidade/EAS válidos e seleciona o mapa nativo do iPhone. `npm run distribution:check` informa bloqueios sem iniciar um build. IDs provisórios e EAS não vinculado continuam pendentes.

Para publicar nas lojas, ainda será necessário definir identidade/marca, conta e assinatura Apple/Google quando aplicável, domínio e contatos, documentos legais revisados, formulários de privacidade, assets/screenshots finais, moderação operacional, testes reais de e-mail/RLS/Storage e aparelhos. A exclusão interna/externa de conta, denúncias e bloqueio existem no código; a operação e a configuração remota precisam ser validadas.

No Expo Go do iPhone o mapa é Apple Maps. Development builds e web usam MapLibre por padrão, exigindo estilo/tiles licenciados; o perfil testflight troca para o provedor nativo. Push e OAuth continuam desabilitados. O Android não faz parte do primeiro grupo informado pelo proprietário e precisa de uma rodada própria de configuração/testes antes de distribuição.

Não há publicação de produção nesta entrega. Builds EAS e submissões só devem ocorrer quando o proprietário estiver pronto para a etapa de distribuição e suas contas estiverem configuradas.
