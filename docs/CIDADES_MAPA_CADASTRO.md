# Escolher cidade, explorar e cadastrar o que falta

Rodada de 09/11/2026. O proprietário escolheu mapa integrado, sem contratar uma nova fonte de comércios. Não foram adicionados pacotes, chaves, migrations ou registros reais ao banco.

## Como usar

1. Em Explorar, toque no seletor de cidade, digite o nome e escolha a sugestão com UF. “Explorar cidade” abre o mapa dentro do NA REAL e limpa filtros da busca anterior.
2. Aproxime ou mova o mapa. No iPhone com Expo Go, os comércios e pontos disponíveis vêm do Apple Maps. Os pins verdes representam lugares do catálogo NA REAL.
3. “Ver lista de lugares NA REAL” mostra os cadastros aprovados da comunidade, inclusive os que ainda não têm posição marcada. No modo cidade, essa consulta considera a cidade/UF inteira, sem excluir registros por estarem fora da parte visível do mapa. Os resultados chegam em páginas; use “Carregar mais nesta cidade” para continuar. Não há um total fictício de comércios.
4. Se faltar um lugar, toque em “Cadastrar lugar nesta cidade”. O cadastro recebe cidade/UF e, quando vier de uma busca por nome, uma sugestão de nome editável. Endereço, categoria e os demais dados são conferidos pela pessoa antes do envio.
5. Um rascunho anterior oferece a escolha entre continuar ou começar o novo cadastro. Continuar mantém textos e pino; começar outro descarta os dados ainda não enviados. A posição de um comércio só vem da localização do endereço ou da marcação explícita da entrada, nunca do centro do município.

O mapa também oferece seleção de outra cidade. A preferência é compartilhada entre mapa e exploração durante a sessão e lembrada no aparelho, sem alterar automaticamente o rascunho de um lugar. O botão do aplicativo Mapas externo continua como opção adicional; não é necessário sair do NA REAL para visualizar o mapa integrado.

## De onde vêm os lugares

| Fonte                | O que aparece                                             | O que não é feito                                                                                      |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Apple Maps no iPhone | Comércios e pontos conforme cobertura e nível de zoom     | Não é extraída uma lista completa, nem copiados automaticamente nomes/fotos/avaliações para o Supabase |
| Catálogo NA REAL     | Cadastros aprovados e contribuições da comunidade         | Conteúdo pendente não é publicado como se estivesse aprovado                                           |
| Cadastro manual      | Informação enviada pela pessoa, com foto e pino opcionais | O envio não é uma aprovação automática                                                                 |

**A cobertura do mapa não garante todos os estabelecimentos existentes.** As categorias e a busca da comunidade filtram apenas os cadastros NA REAL; não filtram todos os pontos do Apple Maps. Para um diretório externo pesquisável, seria necessária uma integração de dados própria, com chave, licença, orçamento e backend; isso não foi contratado nesta rodada.

Na web, o mapa continua dependendo do estilo MapLibre licenciado configurado. Se ele estiver indisponível, a lista da comunidade de uma cidade selecionada continua podendo ser consultada. A navegação para registrar um lugar não envia as coordenadas do centro da cidade como posição do comércio.

## Verificação

`npm run test:city-ui` usa APIs e estilo de mapa interceptados. Verifica escolha sem consultas por letra, abertura do mapa, consulta da cidade inteira, duas páginas de cadastros, acesso ao cadastro manual com contexto, manutenção de rascunho/pino, escolha explícita para substituir o rascunho e ausência de coordenadas antigas no envio novo. Os locais de teste não são registros reais.

Os pontos comerciais reais do Apple Maps, geocodificação, teclado, gestos e seleção no iPhone precisam da conferência física depois de Fetch/Pull de `codex/na-real-dev`, Ctrl+C no Metro e `npm run phone`. Nenhuma dependência nova exige instalação nesta rodada.
