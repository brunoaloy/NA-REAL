# Descoberta com a identidade NA REAL

Esta rodada aplica os seis pontos aprovados: abertura de Explorar, cartões, identidade visual, mapa, estados vazios e perfil. Não adiciona pacotes, migrations, conteúdo de comunidade ou alterações no banco.

## O que mudou

- **Explorar:** saudação “O que vamos descobrir hoje?”, cidade/UF em um seletor visível e busca em destaque. A cidade abre os mesmos filtros validados; rascunhos só chegam à busca ao aplicar. Proximidade continua opcional. Mapa e filtros têm rótulos; foi removido o atalho de mapa duplicado no título da lista.
- **Cartões:** foto aprovada ocupa a largura, seguida de nome, categoria, cidade/UF e avaliações. Não há bairro no contrato atual do catálogo, portanto a interface não inventa essa informação. Sem foto, o pin e formas suaves representam a marca; falhas de imagem têm uma indicação própria. O cartão inteiro abre o lugar.
- **Identidade:** fundo suave, cartões brancos, verde escuro, tipografia Inter e ações secundárias discretas. O gradiente continua nos botões principais. Relatos ao vivo usam botões secundários para reduzir competição visual.
- **Mapa:** tocar em um pin da comunidade abre uma prévia na parte inferior, com foto, nome, avaliações, fechar e “Conhecer lugar”. O pin selecionado fica mais escuro. A atribuição do provedor permanece na base. Uma legenda diferencia a comunidade dos pontos do mapa nativo; estes continuam dependendo da cobertura do Apple Maps e não são importados como cadastros NA REAL.
- **Mensagens:** estados vazios usam ícone, texto acolhedor e, onde pertinente, um caminho para explorar ou compartilhar. Ausência de conteúdo não exibe lugares ou avaliações fictícios.
- **Perfil:** foto, nome, descrição e “Editar perfil” permanecem em primeiro plano, em uma capa com formas da marca. Favoritos, cadastros, avaliações, fotos e histórico ficam agrupados em “Suas descobertas”, com seções recolhidas. As opções de conta seguem abaixo.

## Mapa na web

O teste de seleção encontrou uma falha existente: MapLibre 6 procurava seu module worker ao lado do chunk Metro, onde esse arquivo não existe. `metro.config.js` agora copia o worker da versão instalada e sua licença para `public/maplibre/<versão>/`; o cliente web usa essa URL da própria aplicação. Esses arquivos são gerados, ignorados pelo Git e incluídos no export. Não há CDN nem domínio adicional para o worker. O provedor de estilo/tiles da web continua necessário; essa configuração não afeta o Apple Maps do Expo Go.

## Verificação

O teste `npm run test:design-ui` usa APIs interceptadas, uma imagem de fixture e um estilo MapLibre local sem ruas ou tiles externos. Ele verifica cidade/UF, foto larga, ausência/falha de imagem, largura de 320 px e seleção real do pin no canvas WebGL, prévia, fechamento e abertura do detalhe. O estilo vazio é exclusivo do teste, não um mapa de produção. A variável `EXPO_PUBLIC_MAP_STYLE_URL` do export usado nesse teste deve apontar para `http://127.0.0.1:8771/design-map-style.json`; o teste intercepta essa URL. Sirva esse export em `127.0.0.1:8771`, como nos demais smokes, com `dist` apontando para ele.

Os testes existentes de exploração, perfil/cadastro, detalhes, avaliações/fotos e apresentação/login também usam fixtures. Eles não comprovam persistência no Supabase real, câmera, teclado nativo, geocodificação ou pontos de interesse do iPhone. Confira esses itens no aparelho após Fetch/Pull de `codex/na-real-dev`, Ctrl+C no Metro e `npm run phone`. Nenhuma dependência nova exige instalação nesta rodada.
