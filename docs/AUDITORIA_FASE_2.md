# Auditoria de continuidade — Fase 2

Código existente preservado; nenhuma reinicialização do Expo. Não foram encontradas diretrizes NA REAL Safe separadas; aplica-se o pedido desta fase e a especificação original.

| Área                        | Estado na entrada                  | Evidência / lacuna                                                 |
| --------------------------- | ---------------------------------- | ------------------------------------------------------------------ |
| Expo, navegação, TypeScript | funcional localmente               | bundles e smoke anteriores; sem binários assinados                 |
| Auth                        | parcial                            | e-mail/senha integrado; recuperação sem conclusão; OAuth ausente   |
| Catálogo                    | parcial                            | nome/categoria e paginação; sem geografia, cidade/UF ou duplicatas |
| Avaliações                  | parcial                            | persistência e autoria; média não ligada aos cards                 |
| Sala/perguntas/respostas    | parcial e insegura para lançamento | persistência/Realtime; conteúdo publicado sem análise              |
| Moderação                   | ausente                            | avaliações/lugares pending, mas sem fila, auditoria, IA ou recurso |
| Mapa/fotos                  | ausente                            | telas de indisponibilidade; nenhum serviço simulado                |
| Favoritos/denúncias         | parcial                            | persistência só para lugar; sem lista/UGC geral                    |
| Perfil/privacidade          | parcial                            | apenas login/logout; sem edição/exclusão/bloqueio                  |
| Notificações                | parcial                            | trigger e central interna; sem preferências/push                   |
| Visual                      | parcial                            | tokens/Inter/abas, mas 12 telas não reproduzidas integralmente     |
| Backend remoto              | não validado                       | sem URL/chave Supabase ou credenciais externas presentes           |

## Ordem de implementação

1. Migração aditiva Safe: pendência por padrão em todo UGC, fila versionada, revisão humana, auditoria, recursos, suspensão, bloqueios e denúncias.
2. RPCs de catálogo geográfico/duplicatas e MapLibre com provedor configurável; fotos privadas com análise antes da exposição.
3. Comunidade, perfil, preferências, exclusão e superfícies de operação.
4. Composição visual e testes de regressão, RLS, moderação e navegação. Não declarar integrações remotas testadas sem configuração.

## Contrato Safe

Falhas ou ausência de IA mantêm conteúdo pendente. IA pode sinalizar; lugares/perfis/imagens e dados pessoais exigem revisão humana. Nunca usar respostas inventadas. Não depender de detector infalível. Serviço privilegiado e chaves ficam somente em Edge Functions; admin exige associação em tabela protegida, não metadata editável pelo usuário.
