# Relatório real — Fase 4

O proprietário confirmou que ainda não criou projeto Supabase e autorizou preparar configuração local. Branch `codex/na-real-dev`; nenhum banco remoto foi vinculado ou alterado. Histórico 001–009 preservado.

| Funcionalidade                            | Situação real                                            | Teste executado                                                                       | Pendência                                                      | Ação do proprietário                                                                    |
| ----------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Supabase remoto                           | Não criado                                               | Bindings e arquivo de vínculo ausentes                                                | Nenhuma migração remota inventariada/aplicada                  | Opcionalmente criar projeto de desenvolvimento; não enviar segredos no chat             |
| Supabase local completo                   | Bloqueado por disco Docker vfs                           | Downloads essenciais e inicialização até schema; exit 125 por no space left on device | Stack não iniciou; suíte HTTP saiu com código 2/blocked        | Executar em Docker Desktop com capacidade ou ambiente maior                             |
| Migrações/RLS                             | Verificadas em Postgres/PostGIS descartável              | 001–009 e asserts SQL passaram                                                        | Auth/Storage são emulados nessa suíte; não é Supabase completo | Ensaiar stack real e seguir backup/dry-run antes de remoto                              |
| Cadastro/login/recuperação                | Implementados, não validados por serviço real nesta fase | Guard de configuração e testes estáticos                                              | Duas contas e SMTP real local não executados                   | Iniciar stack e executar test:services; remoto exige SMTP/redirects                     |
| Catálogo/reviews/sala/perguntas/favoritos | Código e banco verificados localmente                    | SQL positivo/negativo, idempotência e revisão obsoleta                                | Persistência HTTP/Realtime entre duas sessões não executada    | Rodar suíte de serviços após disponibilizar stack                                       |
| Notificações internas                     | Trigger e políticas verificadas em SQL                   | Isolamento/deduplicação nos testes locais                                             | Entrega por Realtime não verificada; push não implementado     | Testar opt-in entre A/B; não presumir push                                              |
| Fotografias                               | Pipeline/privacidade implementados                       | Unitários JPEG e políticas Storage em SQL                                             | Upload/Edge/signed URL reais não executados                    | Stack real com funções; verificar fotos em aparelho                                     |
| Safe/IA                                   | Regras/RLS testadas; IA não configurada                  | 17 unitários e SQL; indisponibilidade não aprova por design                           | Sem consumo ou resposta real de IA                             | Fornecer MODERATION_API_KEY somente no backend se decidir configurar; equipe de revisão |
| Mapas                                     | Código preparado, provedor não configurado               | Config/plugins e consultas SQL existentes                                             | Sem tiles/licença/câmera/localização em aparelhos              | Configurar estilo licenciado/quotas e testar development build                          |
| Android/iOS                               | Configuração, prebuild e bundles verificados             | mobile:check, prebuild e export all passaram                                          | Sem SDK Android completo, Xcode, EAS ou aparelhos              | Escolher IDs definitivos, preparar SDK/contas/assinatura e instalar builds              |

## Evidências locais desta execução

- TypeScript, lint e 17 testes unitários passaram (quatro novos casos de configuração pública).
- Configuração Expo real carrega; build rejeita chave administrativa e produção sem bindings.
- Checker mobile verifica plugins, scheme e perfis; identifica IDs provisórios/EAS ausente.
- Smoke Chromium final passou sem erros JS.
- Prebuild e bundles iOS/Android/web gerados. Nenhum APK/IPA ou teste físico.
- Nove migrações e testes SQL locais passaram. Nenhuma versão SQL alterada.
- Suíte HTTP real preparada e sintaxe validada, mas execução bloqueada antes do primeiro cenário. Não há resultados de A/B aprovados nessa suíte.
- A tentativa opcional de download ECR foi evitada excluindo serviço não necessário; proposta de allowlist foi revertida. Bloqueio final comprovado é disco. As oito imagens novas foram removidas para recuperar espaço; não houve prune global ou remoção de volumes/código.

## Configurações externas separadas

1. **Docker/local:** espaço suficiente e engine com recursos; Node 24/npm 11. Seguir SETUP_SERVICOS. Não expor portas de desenvolvimento na Internet.
2. **Supabase hospedado futuro:** project-ref/URL, chave publicável, senha/token por canal seguro; SMTP/Site URL/redirects; inventário e backup antes de dry-run/aplicação. Sem necessidade de criar já se o alvo continuar local.
3. **Moderação:** chave de IA no backend, segredo de worker opcional, decisão sobre custos/dados e responsável humano. Sem chave, conteúdo não analisado continua pendente.
4. **Mapas:** provedor licenciado e estilo/chave pública restrita, quotas/atribuição. Não configurado.
5. **Mobile/EAS:** identidade definitiva, conta/projeto e assinatura; Android SDK e macOS/Xcode para builds locais respectivos. Push exige implementação posterior; chaves não o habilitam por si só.

Não pronto para App Store/Google Play. Instruções e limitações de backup/restauração em SETUP_SERVICOS e AUDITORIA_MIGRACOES; roteiro físico em VALIDACAO_MOBILE.
