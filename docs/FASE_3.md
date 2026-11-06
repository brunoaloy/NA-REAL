# Fase 3 — auditoria e checklist

Branch de entrada `codex/na-real-dev`, HEAD cbc8393, código anterior commitado e checkout limpo. Estrutura, README, plano, status e contratos das migrações inspecionados. Não há mocks de comunidade no app; testes usam fixtures isoladas. Supabase remoto/IA/mapas continuam sem bindings configurados; nenhum valor secreto foi lido.

## Checklist incremental

- [x] Auditar Git, módulos e configuração disponível.
- [x] Sugestões de correções privadas, validação, revisão humana, aplicação auditada e controle de versão.
- [x] Compartilhar link de um estabelecimento sem inventar domínio.
- [x] Respostas vinculadas a mensagens da mesma sala e identificação pública moderada de autores.
- [x] Testes de RLS e regressões; commits e push por módulo.
- [ ] Testar autenticação, Storage, IA e dois usuários no Supabase real (depende de configuração).

Funcionalidades existentes: Auth/PKCE, catálogo/PostGIS, reviews, Storage e Safe, perguntas/respostas, notificações internas, perfil/exclusão têm código integrado; os testes locais não comprovam serviços remotos. Fila administrativa já possui paginação. Persistência offline, OAuth/push, refinamento completo dos mockups e operação de produção permanecem parciais conforme STATUS; não serão duplicados nesta execução.

Perguntas: implementados envio livre, perguntas rápidas adicionais, histórico paginado, identificação de autores e diferenciação explícita de expiração. Controles de envio são omitidos para perguntas encerradas; banco mantém a regra de não responder expiradas.

## Arquivos desta execução

Migrações 008/009, `place-suggestions.tsx`, `message-context.tsx`, detalhes de lugar/admin/perguntas, serviço de catálogo e validação compartilhada; testes SQL da Fase 3, validação unitária de perguntas e smoke com URL parametrizável. README/STATUS/TESTES atualizados. Nenhuma variável nova é necessária: seguem URL/chave publicável Supabase e estilo licenciado opcionais, sem segredos no cliente. Foram produzidos três commits por módulo; hashes e estado do push constam no relatório da execução.
