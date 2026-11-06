# Desenvolvimento do NA REAL

Use o checkout existente; não reinicialize Git nem crie worktrees sem pedido explícito. Na nuvem, desenvolva em `codex/na-real-dev` quando disponível; verifique branches locais/remotas antes de criar ou trocar. Preserve alterações e arquivos existentes.

Cada módulo funcional deve ter testes pertinentes e um commit claro. Verifique `git status` e revise os arquivos antes de adicionar. Não inclua credenciais, .env reais, tokens, material de assinatura, dependências ou outputs gerados. Exemplos de ambiente devem permanecer sem valores secretos.

Envie a branch de desenvolvimento pelo origin autorizado. Não faça merge automático em main, force push ou descarte de alterações. Em divergências remotas, busque e examine antes de integrar; não sobrescreva trabalho.

No relatório, informe mudanças/arquivos, testes, branch, hashes de commits, resultado real do push e como acompanhar no GitHub Desktop. Leia README e docs/STATUS.md para limitações de Supabase, dispositivos e produção. Não declare testes remotos ou publicação que não ocorreram.
