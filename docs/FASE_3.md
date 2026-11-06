# Fase 3 — auditoria e checklist

Branch de entrada `codex/na-real-dev`, HEAD cbc8393, código anterior commitado e checkout limpo. Estrutura, README, plano, status e contratos das migrações inspecionados. Não há mocks de comunidade no app; testes usam fixtures isoladas. Supabase remoto/IA/mapas continuam sem bindings configurados; nenhum valor secreto foi lido.

## Checklist incremental

- [x] Auditar Git, módulos e configuração disponível.
- [ ] Sugestões de correções privadas, validação, revisão humana, aplicação auditada e controle de versão.
- [ ] Compartilhar link de um estabelecimento sem inventar domínio.
- [ ] Respostas vinculadas a mensagens da mesma sala e identificação pública moderada de autores.
- [ ] Testes de RLS e regressões; commits e push por módulo.
- [ ] Testar autenticação, Storage, IA e dois usuários no Supabase real (depende de configuração).

Funcionalidades existentes: Auth/PKCE, catálogo/PostGIS, reviews, Storage e Safe, perguntas/respostas, notificações internas, perfil/exclusão têm código integrado; os testes locais não comprovam serviços remotos. Fila administrativa já possui paginação. Persistência offline, OAuth/push, refinamento completo dos mockups e operação de produção permanecem parciais conforme STATUS; não serão duplicados nesta execução.
