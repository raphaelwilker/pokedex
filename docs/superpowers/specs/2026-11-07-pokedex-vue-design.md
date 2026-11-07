# Pokédex Vue — Design

## Objetivo
Pokédex em Vue 3 que consome a PokéAPI (https://pokeapi.co/), com o layout do poke-love-dex (https://poke-love-dex.lovable.app/): um aparelho de Pokédex que exibe **uma entrada por vez**.

## Referência visual
Carcaça vermelha em duas metades, lente azul brilhante e três luzes (vermelha, amarela, verde).
- **Esquerda:** tela LCD com o sprite pixelado; visor verde "NO. 0001" abaixo.
- **Direita:** rótulo "ENTRY" + nome em destaque; visor escuro com texto da Pokédex (fonte verde monoespaçada, caixa alta); grade de gerações G1–G9 + ALL; botões PREV/NEXT; visores TYPE (ex.: GRASS / POISON) e DIMENSIONS (HT 0.7M | WT 6.9KG); etiqueta "GENERATION 1"; campo "Search name or #id...".

## Escopo v1
- Exibir uma entrada (sprite, nº, nome, texto, tipos, altura/peso, geração).
- PREV/NEXT dentro da geração selecionada (ALL percorre todos).
- Seleção de geração G1–G9 / ALL.
- Busca por nome ou `#id`; ao encontrar, o aparelho salta para o Pokémon.
- Pokémon selecionado refletido na URL (`/pokemon/:id`) para compartilhar.

Fora do v1: grid/lista, filtro por tipo, favoritos, evoluções, temas.

## Stack
Vue 3 (`<script setup>`), Vite, Vue Router, Pinia, CSS puro (fonte monoespaçada pixelada), `fetch` nativo, Vitest.
O scaffold antigo (Vue 2, webpack, node-sass, Bootstrap, jQuery, vue-resource) é removido.

## Dados (PokéAPI)
- Lista: `GET /pokemon?limit=1025` (nome + URL; id extraído da URL), usada para busca e navegação.
- Gerações: tabela fixa de faixas de id (G1 1–151, G2 152–251, G3 252–386, G4 387–493, G5 494–649, G6 650–721, G7 722–809, G8 810–905, G9 906–1025).
- Detalhes: `GET /pokemon/{id}` → sprite (`sprites.front_default`), tipos, altura (dm→m), peso (hg→kg).
- Texto: `GET /pokemon-species/{id}` → `flavor_text_entries` (primeiro em `en`, quebras de linha normalizadas).
- Cache por id na store Pinia.

## Estrutura
- `src/api/pokeapi.js`, `src/data/generations.js`
- `src/stores/pokedex.js` (lista, geração ativa, id atual, cache, navegação)
- `src/router/index.js` — rota `/pokemon/:id?` (padrão: 1)
- `src/components/`: `PokedexShell`, `ScreenDisplay`, `EntryText`, `GenerationPicker`, `PrevNext`, `InfoPanel`, `SearchField`

## Erros e carregamento
Tela LCD com estado "LOADING..." durante o fetch; mensagem de erro no visor de texto com "tentar de novo"; busca sem resultado exibe "NOT FOUND" no campo.

## Testes
Vitest para `api/pokeapi.js` (parse de texto, unidades), `data/generations.js` (faixas) e store (navegação PREV/NEXT nos limites de cada geração, busca); teste de componente para `SearchField` e `GenerationPicker`.
