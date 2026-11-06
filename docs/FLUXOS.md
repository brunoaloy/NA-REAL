# Fluxos implementados

Visitante → boas-vindas → Explorar → busca nome/cidade, filtro UF/categoria, páginas de 50 → detalhe. Mapa usa viewport, zoom, clusters e seleção de pin; posição opcional depende de permissão após gesto. Negar localização preserva busca manual.

Cadastro → buscar candidatos aproximados → preencher endereço/posição/descrição e confirmar estabelecimento público → validação Zod/SQL e duplicata no servidor → pending → fila Safe → aprovação humana → catálogo. Foto pode ser enviada após o cadastro, ainda não pública.

Auth → e-mail/senha → voltar ao contexto anterior. Cadastro/recuperação usam redirect PKCE para `/auth-callback`, que conclui sessão e permite definir nova senha. Google e Apple não foram simulados nem implementados nesta fase.

Detalhe → avaliações com estrelas/comentário/fotos e edição/exclusão próprias; edição volta à análise. Sala mantém cursor, escrita pendente e eventos de aprovação atualizam consultas. Perguntas/respostas têm status visível ao autor; notificam destinatário apenas após aprovação e respeitam preferências/bloqueios.

Ao vivo → relato de movimento → pending → aprovado dentro da validade → confirmações/contestações por outros usuários. Depois de expirar, sai da situação atual. Não existe condição inventada na ausência de relatos.

Perfil → edição pública moderada, fotos, favoritos, histórico de reviews/contribuições, contestação de decisão. Configurações → preferências, desbloqueio, documentos e exclusão confirmada. Página web `/delete-account` encaminha ao fluxo autenticado; precisa de hosting público.

Admin → RBAC → fila/denúncias/recursos → análise real opcional ou revisão humana → decisão/motivo auditados. Conta suspensa conserva recurso privado, sem recuperar direito de publicar. Para fotos, preparar e inspecionar a cópia sanitizada antes de aprovar.

Offline → banner e cache existente em memória identificado como possivelmente desatualizado; nenhuma escrita é marcada como persistida sem resposta do servidor.
