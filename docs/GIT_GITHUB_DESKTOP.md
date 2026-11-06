# Git e GitHub Desktop

Checkout na nuvem: `/workspace/NA-REAL`, origin `https://github.com/brunoaloy/NA-REAL.git`. Não é worktree separado. A pasta no seu computador é outro checkout: o GitHub Desktop recebe commits pela branch remota, não sincroniza arquivos locais não commitados da nuvem.

Branch de desenvolvimento: `codex/na-real-dev`. Preserve alterações locais antes de trocar de branch. Cada módulo deve passar nos testes pertinentes e receber commit próprio. Não fazer merge em main nem force push automaticamente.

## Acompanhar no computador

1. Se ainda não tiver o repositório, use **File → Clone repository → URL**, informe a URL acima e escolha a pasta local. Caso já exista, abra-o com **File → Add local repository**.
2. Clique em **Fetch origin**.
3. Em **Current branch**, selecione `codex/na-real-dev` (pode aparecer em Remote branches).
4. Use **Pull origin** quando disponível e consulte **History** para ver commits e arquivos. Alterações já commitadas aparecem em History; Changes mostra apenas edições locais ainda não commitadas.
5. Se houver alterações no computador, faça commit/stash antes de trocar ou puxar. Não descarte alterações para resolver divergências. Não é necessário transferir arquivos manualmente.

Se a branch principal remota não existir, trabalhar na branch de desenvolvimento continua válido; criar/main ou fazer merge fica para uma decisão explícita posterior.

## Comandos equivalentes

```sh
git fetch origin
git switch --track origin/codex/na-real-dev # somente se a branch local ainda não existir
# caso já exista: git switch codex/na-real-dev
git pull --ff-only origin codex/na-real-dev
git log --oneline -5
```

Na nuvem: `git status`, testes, `git add` apenas nos arquivos do módulo, `git commit` e `git push origin codex/na-real-dev`. Se o push for recusado por divergência, buscar e examinar o remoto; não usar force push.

`.env` reais, tokens, arquivos de assinatura e dependências geradas são ignorados. Exemplos `.env.example` contêm somente nomes e campos vazios. Nunca colocar credenciais nesses exemplos.
