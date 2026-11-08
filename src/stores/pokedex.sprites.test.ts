import { test, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('../api/pokeapi', () => ({
  fetchPokemonList: vi.fn(),
  fetchPokemon: vi.fn(),
  fetchEntryText: vi.fn(),
  fetchGenderRate: vi.fn()
}))

import * as api from '../api/pokeapi'
const fetchPokemon = vi.mocked(api.fetchPokemon)
const fetchEntryText = vi.mocked(api.fetchEntryText)
const fetchGenderRate = vi.mocked(api.fetchGenderRate)
import { usePokedexStore } from './pokedex'

beforeEach(() => {
  setActivePinia(createPinia())
  fetchPokemon.mockReset().mockImplementation(async (id) => ({ id, name: `p${id}`, sprite: null, types: [], heightM: 1, weightKg: 1 } as never))
  fetchEntryText.mockReset().mockResolvedValue('text')
  fetchGenderRate.mockReset().mockResolvedValue(4)
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
  store.entry = { pokemon: { id: 1, name: 'p1', sprite: 'legacy.png' }, text: '' } as never
  expect(store.currentSprite).toBe('legacy.png')
})

const FEMALE = { front: 'ff.png', shiny: 'ffs.png', back: 'fb.png', backShiny: 'fbs.png' }

test('hasFemale is false without female sprites', () => {
  const store = usePokedexStore()
  withSprites(store)
  expect(store.hasFemale).toBe(false)
  store.setGender('female')
  expect(store.isFemale).toBe(false)
  expect(store.currentSprite).toBe('f.png')
})

test('female gender shows the female sprite and male goes back to the default', () => {
  const store = usePokedexStore()
  withSprites(store, { sprites: { front: 'f.png', shiny: 'fs.png', back: 'b.png', backShiny: 'bs.png', female: FEMALE } })
  expect(store.hasFemale).toBe(true)
  store.setGender('female')
  expect(store.currentSprite).toBe('ff.png')
  store.setShiny(true)
  expect(store.currentSprite).toBe('ffs.png')
  store.toggleBack()
  expect(store.currentSprite).toBe('fbs.png')
  store.setGender('male')
  expect(store.currentSprite).toBe('bs.png')
})

test('female animated sprite is preferred, with fallback to the male sprite for a missing angle', () => {
  const store = usePokedexStore()
  withSprites(store, {
    animated: { front: 'f.gif', shiny: null, back: 'b.gif', backShiny: null, female: { front: 'ff.gif', shiny: null, back: null, backShiny: null } }
  })
  store.setGender('female')
  expect(store.currentSprite).toBe('ff.gif')
  store.toggleBack()
  expect(store.currentSprite).toBe('b.gif')
})

test('gender choice falls back to male for a pokemon without female sprite', async () => {
  const store = usePokedexStore()
  withSprites(store, { sprites: { front: 'f.png', shiny: 'fs.png', back: 'b.png', backShiny: 'bs.png', female: FEMALE } })
  store.setGender('female')
  withSprites(store)
  expect(store.currentSprite).toBe('f.png')
})

test.each([
  [-1, false, false],
  [0, true, false],
  [4, true, true],
  [7, true, true],
  [8, false, true]
])('gender rate %i -> canMale %s, canFemale %s', (rate, male, female) => {
  const store = usePokedexStore()
  withSprites(store)
  store.entry.genderRate = rate
  expect(store.canMale).toBe(male)
  expect(store.canFemale).toBe(female)
})

test('a female-only pokemon is shown as female even with male selected', () => {
  const store = usePokedexStore()
  withSprites(store, { sprites: { front: 'f.png', shiny: null, back: null, backShiny: null, female: FEMALE } })
  store.entry.genderRate = 8
  store.setGender('male')
  expect(store.isFemale).toBe(true)
  expect(store.currentSprite).toBe('ff.png')
})

test('a male-only or genderless pokemon is never female', () => {
  const store = usePokedexStore()
  withSprites(store, { sprites: { front: 'f.png', shiny: null, back: null, backShiny: null, female: FEMALE } })
  store.setGender('female')
  store.entry.genderRate = 0
  expect(store.isFemale).toBe(false)
  store.entry.genderRate = -1
  expect(store.isFemale).toBe(false)
})

test('select stores the gender rate, and tolerates a failing request', async () => {
  const store = usePokedexStore()
  fetchGenderRate.mockResolvedValueOnce(8)
  await store.select(30)
  expect(store.entry.genderRate).toBe(8)
  fetchGenderRate.mockRejectedValueOnce(new Error('boom'))
  await store.select(31)
  expect(store.status).toBe('idle')
  expect(store.entry.genderRate).toBeNull()
})

test('shiny and back choices persist when changing pokemon', async () => {
  const store = usePokedexStore()
  store.setShiny(true)
  store.toggleBack()
  await store.select(25)
  expect(store.shiny).toBe(true)
  expect(store.back).toBe(true)
})
