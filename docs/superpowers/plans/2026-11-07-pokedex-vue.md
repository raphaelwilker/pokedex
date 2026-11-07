# Pokédex Vue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pokédex em Vue 3 que mostra uma entrada por vez num aparelho vermelho, consumindo a PokéAPI.

**Architecture:** Camada `api` pura (fetch + parse), `data/generations` com as faixas de id, store Pinia com a lista, geração ativa, id atual, cache e navegação; o id atual é sincronizado com a rota `/pokemon/:id?`. Componentes de apresentação leem a store.

**Tech Stack:** Vue 3 (`<script setup>`), Vite, Vue Router 4, Pinia, Vitest + @vue/test-utils + jsdom, CSS puro.

**Spec:** `docs/superpowers/specs/2026-11-07-pokedex-vue-design.md`

## Global Constraints

- Vue 3 + Vite; remover o scaffold antigo (Vue 2, webpack, node-sass, Bootstrap, jQuery, vue-resource, `webpack.config.js`, `src/` antigo).
- Lista: `GET https://pokeapi.co/api/v2/pokemon?limit=1025`; detalhes: `/pokemon/{id}`; texto: `/pokemon-species/{id}`.
- Gerações (faixas de id): G1 1–151, G2 152–251, G3 252–386, G4 387–493, G5 494–649, G6 650–721, G7 722–809, G8 810–905, G9 906–1025; ALL = 1–1025.
- Sprite: `sprites.front_default`. Altura dm→m, peso hg→kg. Texto: primeiro `flavor_text_entries` com `language.name === 'en'`, quebras de linha/form feed normalizadas para espaço.
- Rota `/pokemon/:id?`, padrão id 1. `fetch` nativo, sem libs HTTP.
- Textos do aparelho em inglês e caixa alta: "ENTRY", "LOADING...", "NOT FOUND", "NO. 0001", "GENERATION 1", "Search name or #id...".
- Fora do v1: grid, filtro por tipo, favoritos, evoluções, temas, formas alternativas.

## Review Focus

- Busca com espaços/maiúsculas (`" Pikachu "`, `"#25"`, `"025"`): deve achar o Pokémon certo.
- Busca por id fora da faixa (`0`, `1026`, `-3`) ou texto inexistente: "NOT FOUND", sem mudar o Pokémon atual.
- PREV no primeiro e NEXT no último da geração: ficam desabilitados, sem sair da faixa.
- Trocar de geração com o Pokémon atual fora dela: salta para o primeiro da nova geração.
- `/pokemon/abc`, `/pokemon/0` ou `/pokemon/9999` na URL: cai no id 1.
- Falha de rede/HTTP não-OK: mensagem de erro com "tentar de novo", sem travar o aparelho.
- Pokémon sem texto em inglês: visor mostra "NO DATA".

---

### Task 1: Scaffold Vue 3 + Vite + Vitest

**Files:**
- Delete: `webpack.config.js`, `package-lock.json`, `src/` (todo), `public/index.html`
- Create: `package.json` (substitui), `vite.config.js`, `index.html`, `src/main.js`, `src/App.vue`, `src/App.test.js`
- Modify: `.gitignore` (garantir `node_modules`, `dist`)

**Interfaces:**
- Produces: scripts `npm run dev|build|test`; `src/main.js` monta `App` com Pinia e Router (router entra na Task 5; aqui só Pinia).

- [ ] **Step 1: Remover scaffold antigo e criar `package.json` com deps `vue`, `vue-router`, `pinia` e devDeps `vite`, `@vitejs/plugin-vue`, `vitest`, `jsdom`, `@vue/test-utils`; scripts `dev`, `build`, `test` (`vitest run`). Rodar `npm install`.**
- [ ] **Step 2: Escrever `src/App.test.js`:** monta `App` e espera `wrapper.text()` conter `"ENTRY"`.
- [ ] **Step 3: Rodar `npx vitest run`.** Esperado: FAIL (App sem "ENTRY").
- [ ] **Step 4: Criar `vite.config.js` (plugin vue, `test.environment: 'jsdom'`), `index.html`, `src/main.js`, `src/App.vue` com um `<h1>ENTRY</h1>` provisório.**
- [ ] **Step 5: Rodar `npx vitest run` e `npm run build`.** Esperado: PASS e build sem erros.
- [ ] **Step 6: Commit** `chore: replace legacy scaffold with Vue 3 + Vite + Vitest`.

### Task 2: Gerações

**Files:**
- Create: `src/data/generations.js`
- Test: `src/data/generations.test.js`

**Interfaces:**
- Produces: `GENERATIONS: Array<{ key: string, label: string, min: number, max: number }>` (G1…G9 e `ALL` com `min:1,max:1025`); `generationOf(id: number): number` (1–9); `rangeFor(key: string): { min, max }`.

- [ ] **Step 1: Testes:** `generationOf(1)===1`, `generationOf(151)===1`, `generationOf(152)===2`, `generationOf(1025)===9`; `rangeFor('G3')` igual a `{min:252,max:386}`; `rangeFor('ALL')` igual a `{min:1,max:1025}`; faixas contíguas sem lacunas de G1 a G9.
- [ ] **Step 2: Rodar `npx vitest run src/data`.** Esperado: FAIL.
- [ ] **Step 3: Implementar com a tabela da seção Global Constraints.**
- [ ] **Step 4: Rodar os testes.** Esperado: PASS.
- [ ] **Step 5: Commit** `feat: add generation ranges`.

### Task 3: Camada de API

**Files:**
- Create: `src/api/pokeapi.js`
- Test: `src/api/pokeapi.test.js`

**Interfaces:**
- Consumes: nada.
- Produces (todas `async`, lançam `Error` em resposta não-OK):
  - `fetchPokemonList(): Promise<Array<{ id: number, name: string }>>` (id extraído da URL).
  - `fetchPokemon(id: number): Promise<{ id, name, sprite: string|null, types: string[], heightM: number, weightKg: number }>`.
  - `fetchEntryText(id: number): Promise<string>` (em inglês, normalizado; `""` se não houver).
  - `cleanFlavorText(raw: string): string` (exportada; troca `\n`, `\f` por espaço, colapsa espaços, `trim`).

- [ ] **Step 1: Testes com `vi.stubGlobal('fetch', ...)`:** lista mapeia `{name:'bulbasaur',url:'.../pokemon/1/'}` para `{id:1,name:'bulbasaur'}`; `fetchPokemon(1)` com `height:7, weight:69` retorna `heightM:0.7, weightKg:6.9` e `types:['grass','poison']`; `cleanFlavorText("A strange\nseed\fwas")` é `"A strange seed was"`; `fetchEntryText` ignora entradas não-`en` e devolve `""` sem nenhuma; `fetch` com `ok:false` rejeita.
- [ ] **Step 2: Rodar `npx vitest run src/api`.** Esperado: FAIL.
- [ ] **Step 3: Implementar com um helper interno `getJson(path)` sobre `https://pokeapi.co/api/v2`.**
- [ ] **Step 4: Rodar os testes.** Esperado: PASS.
- [ ] **Step 5: Commit** `feat: add PokeAPI client`.

### Task 4: Store Pinia

**Files:**
- Create: `src/stores/pokedex.js`
- Test: `src/stores/pokedex.test.js`

**Interfaces:**
- Consumes: `fetchPokemonList`, `fetchPokemon`, `fetchEntryText` (Task 3); `generationOf`, `rangeFor` (Task 2).
- Produces: `usePokedexStore` com
  - state: `list`, `currentId` (1), `generationKey` (`'ALL'`), `entry` (`{ pokemon, text } | null`), `status` (`'idle'|'loading'|'error'`), `searchError` (boolean);
  - getters: `range`, `canPrev`, `canNext`, `currentGeneration` (1–9);
  - actions: `init()` (carrega lista), `select(id: number): Promise<void>` (valida 1–1025, carrega e guarda em cache por id), `next()`, `prev()`, `setGeneration(key)` (se `currentId` fora da faixa, `select(range.min)`), `search(query: string): Promise<boolean>`, `retry()`.

- [ ] **Step 1: Testes (API mockada com `vi.mock`):** `select(25)` define `currentId` e `entry`; segunda chamada ao mesmo id não refaz fetch; `next()` em 151 com `G1` não muda (`canNext` falso); `prev()` em 1 não muda; `setGeneration('G2')` com `currentId=25` leva a 152; `search(' Pikachu ')`, `search('#25')`, `search('025')` resolvem para 25 e retornam `true`; `search('0')`, `search('1026')`, `search('zzz')` retornam `false`, ligam `searchError` e mantêm `currentId`; falha em `fetchPokemon` deixa `status==='error'` e `retry()` tenta de novo; `select(0)` e `select(9999)` caem em 1.
- [ ] **Step 2: Rodar `npx vitest run src/stores`.** Esperado: FAIL.
- [ ] **Step 3: Implementar; busca por nome usa `list` (comparação em minúsculas, `trim`); número aceita prefixo `#` e zeros à esquerda.**
- [ ] **Step 4: Rodar os testes.** Esperado: PASS.
- [ ] **Step 5: Commit** `feat: add pokedex store`.

### Task 5: Router e sincronização com a URL

**Files:**
- Create: `src/router/index.js`
- Modify: `src/main.js`, `src/App.vue`
- Test: `src/router/router.test.js`

**Interfaces:**
- Consumes: `usePokedexStore` (Task 4).
- Produces: `createAppRouter(history = createWebHistory()): Router` com rota `{ path: '/pokemon/:id?', name: 'pokemon' }`; `/` redireciona para `/pokemon/1`. `App.vue` observa `route.params.id` → `store.select(Number(id))` (inválido → 1) e observa `store.currentId` → `router.replace` para `/pokemon/{id}`.

- [ ] **Step 1: Testes com `createMemoryHistory`:** `/` termina em `/pokemon/1`; `/pokemon/abc`, `/pokemon/0` e `/pokemon/9999` terminam em `/pokemon/1`; `store.select(25)` atualiza a rota para `/pokemon/25`.
- [ ] **Step 2: Rodar `npx vitest run src/router`.** Esperado: FAIL.
- [ ] **Step 3: Implementar router, ligar em `main.js` e na `App.vue` (com `<router-view>` desnecessário: a tela é única).**
- [ ] **Step 4: Rodar a suíte completa.** Esperado: PASS.
- [ ] **Step 5: Commit** `feat: sync current Pokémon with URL`.

### Task 6: Componentes do aparelho

**Files:**
- Create: `src/components/PokedexShell.vue`, `ScreenDisplay.vue`, `EntryText.vue`, `GenerationPicker.vue`, `PrevNext.vue`, `InfoPanel.vue`, `SearchField.vue`, `src/styles/pokedex.css`
- Modify: `src/App.vue`
- Test: `src/components/components.test.js`

**Interfaces:**
- Consumes: `usePokedexStore` (Task 4).
- Produces:
  - `SearchField`: input `Search name or #id...`; Enter chama `store.search(value)`; exibe "NOT FOUND" quando `store.searchError`; limpa o erro ao digitar.
  - `GenerationPicker`: 10 botões (G1–G9, ALL), ativo destacado, clique chama `store.setGeneration(key)`.
  - `PrevNext`: botões "PREV"/"NEXT" com `disabled` conforme `canPrev`/`canNext`.
  - `ScreenDisplay`: sprite pixelado (`image-rendering: pixelated`), "LOADING..." durante `status==='loading'`, número `NO. 0001` (4 dígitos).
  - `EntryText`: "ENTRY", nome em destaque, texto (ou "NO DATA"; erro mostra mensagem e botão "tentar de novo" → `store.retry()`).
  - `InfoPanel`: `TYPE` (`GRASS / POISON`), `DIMENSIONS` (`HT 0.7M | WT 6.9KG`), etiqueta `GENERATION n`.
  - `PokedexShell`: carcaça com lente azul e três luzes; layout conforme a referência do spec.

- [ ] **Step 1: Testes (store real com API mockada):** `GenerationPicker` renderiza 10 botões e clicar em `G2` chama `setGeneration('G2')`; `SearchField` com Enter em `zzz` mostra "NOT FOUND"; `PrevNext` com `currentId=1` tem PREV `disabled`; `InfoPanel` com bulbasaur mostra `GRASS / POISON` e `HT 0.7M | WT 6.9KG`; `ScreenDisplay` mostra `NO. 0001`; `EntryText` sem texto mostra `NO DATA`; em erro, clicar "tentar de novo" chama `retry`.
- [ ] **Step 2: Rodar `npx vitest run src/components`.** Esperado: FAIL.
- [ ] **Step 3: Implementar os componentes e o CSS (vermelho `#dc0a2d`, visores `#222` com texto verde monoespaçado, LCD cinza-esverdeado, botões G em azul `#4aa8ff`, ALL branco quando ativo); montar tudo em `PokedexShell` e usar em `App.vue`.**
- [ ] **Step 4: Rodar a suíte completa e `npm run build`.** Esperado: PASS e build ok.
- [ ] **Step 5: Commit** `feat: add Pokédex device UI`.

### Task 7: Verificação visual e README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Subir `npm run dev`, abrir com Playwright (chromium) em `/pokemon/1`, tirar screenshot e comparar com o layout de referência do spec (carcaça, visores, grade de gerações, PREV/NEXT, busca).** Esperado: layout equivalente; ajustar CSS se divergir.
- [ ] **Step 2: Atualizar `README.md` com descrição, `npm install`, `npm run dev`, `npm test`, `npm run build`.**
- [ ] **Step 3: Rodar `npm test` e `npm run build`.** Esperado: tudo passa.
- [ ] **Step 4: Commit** `docs: update README and verify UI`.
