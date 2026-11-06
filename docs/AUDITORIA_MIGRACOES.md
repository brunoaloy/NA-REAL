# Auditoria de migrações 001–009

Nenhum projeto remoto está vinculado e nenhuma versão remota foi inventariada. Nenhum SQL remoto foi executado. Arquivos históricos não foram reescritos nesta fase.

| Versão | Conteúdo                                            | Risco operacional ao atualizar dados existentes                                                                                                                            |
| ------ | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 001    | Fundação, FKs, constraints, RLS, índices e triggers | Novo schema; falha se já existe sem histórico; não repetir                                                                                                                 |
| 002    | Perguntas/respostas/favoritos/notificações          | Constraints/grants e Realtime; revisar versões reais                                                                                                                       |
| 003    | Safe e fila versionada                              | **Alto impacto de disponibilidade**: atualiza UGC legado para pendência, cria filas e muda leituras; pode ocultar catálogo até revisão humana. Janela e equipe necessárias |
| 004    | Catálogo PostGIS, buckets privados, sanitização     | Troca políticas; mídias antigas podem perder acesso. Não presume backup de bytes                                                                                           |
| 005    | Fotos de perfil e novas constraints                 | Remove/recria checks/políticas; validar integridade e RLS antes de aplicar                                                                                                 |
| 006    | Normalização/unaccent e duplicatas                  | Gera coluna/índices; custo e locks dependem do volume                                                                                                                      |
| 007    | Recursos de suspensão                               | Nova tabela e políticas privadas                                                                                                                                           |
| 008    | Correções revisadas                                 | Não aplica propostas automaticamente; somente RPC administrativa auditada                                                                                                  |
| 009    | Replies e idempotência                              | Unique/FK podem exigir locks; validar integridade/volume. On-delete mantém replies sem texto copiado                                                                       |

Dry-run não é garantia de ausência de perda ou indisponibilidade. Primeiro aplicar sequencialmente em banco novo e cópia com dados representativos. A suíte SQL local existente emula Auth/Storage e não equivale ao Supabase completo. O teste HTTP de serviços usa a stack real quando disponível e é separado.

Migrações CLI são transacionais quando suportado; confirme o comportamento da versão e do comando. Não editar histórico aplicado, não usar `migration repair` para esconder divergências, não executar reset/drop remoto sem autorização. Plano de backup/recuperação em SETUP_SERVICOS.md.
