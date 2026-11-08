import { test, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('../api/pokeapi', () => ({
  fetchPokemonList: vi.fn(),
  fetchPokemon: vi.fn(),
  fetchEntryText: vi.fn()
}))

import { fetchPokemon, fetchEntryText } from '../api/pokeapi'
import { usePokedexStore } from './pokedex'

beforeEach(() => {
  setActivePinia(createPinia())
  fetchPokemon.mockReset().mockImplementation(async (id) => ({ id, name: `p${id}`, sprite: null, types: [], heightM: 1, weightKg: 1 }))
  fetchEntryText.mockReset().mockResolvedValue('text')
})

function withSprites(store, pokemon = {}) {
  store.entry = {
    pokemon: {
      id: 1,
      name: 'p1',
      sprite: 'f.png',
      sprites: { front: 'f.png', shiny: 'fs.png', back: 'b.png', backShiny: 'bs.png' },
      animated: { front: null, shiny: null, back: null, backShiny: null },
      ...pokemon
    },
    text: ''
  }
}

test('currentSprite is null without an entry', () => {
  expect(usePokedexStore().currentSprite).toBeNull()
})

test('currentSprite defaults to the normal front sprite', () => {
  const store = usePokedexStore()
  withSprites(store)
  expect(store.currentSprite).toBe('f.png')
})

test('setShiny switches between shiny and normal sprites', () => {
  const store = usePokedexStore()
  withSprites(store)
  store.setShiny(true)
  expect(store.currentSprite).toBe('fs.png')
  store.setShiny(false)
  expect(store.currentSprite).toBe('f.png')
})

test('toggleBack flips between front and back, keeping shiny', () => {
  const store = usePokedexStore()
  withSprites(store)
  store.toggleBack()
  expect(store.currentSprite).toBe('b.png')
  store.setShiny(true)
  expect(store.currentSprite).toBe('bs.png')
  store.toggleBack()
  expect(store.currentSprite).toBe('fs.png')
})

test('currentSprite prefers the animated sprite and falls back to static', () => {
  const store = usePokedexStore()
  withSprites(store, { animated: { front: 'f.gif', shiny: null, back: null, backShiny: null } })
  expect(store.currentSprite).toBe('f.gif')
  store.setShiny(true)
  expect(store.currentSprite).toBe('fs.png')
})

test('currentSprite falls back to the front sprite when an angle is missing', () => {
  const store = usePokedexStore()
  withSprites(store, { sprites: { front: 'f.png', shiny: null, back: null, backShiny: null } })
  store.toggleBack()
  expect(store.currentSprite).toBe('f.png')
})

test('currentSprite works with entries that only have `sprite`', () => {
  const store = usePokedexStore()
  store.entry = { pokemon: { id: 1, name: 'p1', sprite: 'legacy.png' }, text: '' }
  expect(store.currentSprite).toBe('legacy.png')
})

test('shiny and back choices persist when changing pokemon', async () => {
  const store = usePokedexStore()
  store.setShiny(true)
  store.toggleBack()
  await store.select(25)
  expect(store.shiny).toBe(true)
  expect(store.back).toBe(true)
})
