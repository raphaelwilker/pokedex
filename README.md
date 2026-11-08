# Pokédex

Pokédex em Vue 3 que consome a [PokéAPI](https://pokeapi.co/), com layout de aparelho que mostra uma entrada por vez (inspirado em https://poke-love-dex.lovable.app/).

## Funcionalidades
- Navegação PREV/NEXT dentro da geração escolhida (G1–G9 ou ALL)
- Busca por nome ou `#id`
- Pokémon atual na URL (`/pokemon/:id`)

## Scripts
```bash
npm install
npm run dev     # servidor de desenvolvimento
npm test        # testes (Vitest)
npm run build   # build de produção
```

## Publicação (GitHub Pages)
O deploy é automático: a cada push na `main`, o workflow `.github/workflows/deploy.yml` roda os testes, gera a build e publica.
Em *Settings → Pages*, a origem (Source) deve ser **GitHub Actions**. O site fica em `https://<usuario>.github.io/pokedex/`.

Spec e plano: `docs/superpowers/`.
