# Pokédex Vue — Design

## Objetivo
Pokédex em Vue 3 que consome a PokéAPI (https://pokeapi.co/), inspirada em https://poke-love-dex.lovable.app/.

## Escopo v1
- Listagem em grid (cards com imagem, nome e número).
- Busca por nome ou número.
- Filtro por tipo.
- Página de detalhes (stats, tipos, habilidades, altura/peso).

Fora do v1: favoritos, evoluções, temas.

## Stack
Vue 3 (`<script setup>`), Vite, Vue Router, Pinia, CSS próprio, `fetch` nativo, Vitest.
O scaffold antigo (Vue 2, webpack, node-sass, Bootstrap, jQuery, vue-resource) é removido.

## Rotas
- `/` — lista com busca e filtro.
- `/pokemon/:id` — detalhes.

## Dados (PokéAPI)
- Lista: `GET /pokemon?limit=1025` (nome + URL). O id é extraído da URL; imagem pelo sprite oficial.
- Busca: local, sobre a lista, por nome ou número.
- Filtro por tipo: `GET /type/{nome}`; resultado final = interseção com a busca.
- Detalhes: `GET /pokemon/{id}`, carregado ao abrir a página.
- Cache na store Pinia para evitar requisições repetidas.

## Estrutura
- `src/api/pokeapi.js`
- `src/stores/pokedex.js`
- `src/views/HomeView.vue`, `src/views/PokemonView.vue`
- `src/components/`: `PokemonCard`, `SearchBar`, `TypeFilter`, `TypeBadge`, `StatBar`

## Erros e carregamento
Esqueleto de carregamento nos cards; mensagem de erro com "tentar de novo"; estado "nenhum resultado".

## Testes
Vitest para `api/pokeapi.js` e para a store; teste de componente para busca + filtro.

## Pendência
Visual de referência: o site não pôde ser acessado na sessão; o estilo seguirá descrição/prints fornecidos pelo usuário.
