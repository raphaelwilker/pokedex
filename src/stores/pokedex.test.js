import { test, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('../api/pokeapi', () => ({
  fetchPokemonList: vi.fn(),
  fetchPokemon: vi.fn(),
  fetchEntryText: vi.fn()
}))

import { fetchPokemonList, fetchPokemon, fetchEntryText } from '../api/pokeapi'
import { usePokedexStore } from './pokedex'

const LIST = [
  { id: 1, name: 'bulbasaur' },
  { id: 25, name: 'pikachu' },
  { id: 152, name: 'chikorita' }
]

function makeStore() {
  const store = usePokedexStore()
  store.list = LIST
  return store
}

beforeEach(() => {
  setActivePinia(createPinia())
  fetchPokemonList.mockReset().mockResolvedValue(LIST)
  fetchPokemon.mockReset().mockImplementation(async (id) => ({ id, name: `p${id}`, sprite: null, types: ['grass'], heightM: 1, weightKg: 1 }))
  fetchEntryText.mockReset().mockResolvedValue('text')
})

test('select loads the entry and sets currentId', async () => {
  const store = makeStore()
  await store.select(25)
  expect(store.currentId).toBe(25)
  expect(store.entry.pokemon.id).toBe(25)
  expect(store.entry.text).toBe('text')
  expect(store.status).toBe('idle')
})

test('select caches by id', async () => {
  const store = makeStore()
  await store.select(25)
  await store.select(25)
  expect(fetchPokemon).toHaveBeenCalledTimes(1)
})

test('select falls back to 1 for invalid ids', async () => {
  const store = makeStore()
  await store.select(0)
  expect(store.currentId).toBe(1)
  await store.select(9999)
  expect(store.currentId).toBe(1)
  await store.select(NaN)
  expect(store.currentId).toBe(1)
})

test('next stops at the last id of the generation', async () => {
  const store = makeStore()
  store.generationKey = 'G1'
  await store.select(151)
  expect(store.canNext).toBe(false)
  await store.next()
  expect(store.currentId).toBe(151)
})

test('prev stops at the first id of the generation', async () => {
  const store = makeStore()
  await store.select(1)
  expect(store.canPrev).toBe(false)
  await store.prev()
  expect(store.currentId).toBe(1)
})

test('next and prev move by one inside the range', async () => {
  const store = makeStore()
  await store.select(10)
  await store.next()
  expect(store.currentId).toBe(11)
  await store.prev()
  expect(store.currentId).toBe(10)
})

test('setGeneration jumps to the first id when current is outside the range', async () => {
  const store = makeStore()
  await store.select(25)
  await store.setGeneration('G2')
  expect(store.generationKey).toBe('G2')
  expect(store.currentId).toBe(152)
})

test('setGeneration keeps current id when it is inside the range', async () => {
  const store = makeStore()
  await store.select(25)
  await store.setGeneration('G1')
  expect(store.currentId).toBe(25)
})

test('search accepts names with spaces and mixed case, #id and zero padded ids', async () => {
  const store = makeStore()
  expect(await store.search(' Pikachu ')).toBe(true)
  expect(store.currentId).toBe(25)
  await store.select(1)
  expect(await store.search('#25')).toBe(true)
  expect(store.currentId).toBe(25)
  await store.select(1)
  expect(await store.search('025')).toBe(true)
  expect(store.currentId).toBe(25)
})

test('search failures set searchError and keep the current pokemon', async () => {
  const store = makeStore()
  await store.select(25)
  for (const q of ['0', '1026', '-3', 'zzz', '']) {
    expect(await store.search(q)).toBe(false)
    expect(store.searchError).toBe(true)
    expect(store.currentId).toBe(25)
  }
})

test('search clears a previous error on success', async () => {
  const store = makeStore()
  await store.search('zzz')
  await store.search('pikachu')
  expect(store.searchError).toBe(false)
})

test('search result outside the active generation switches to ALL', async () => {
  const store = makeStore()
  store.generationKey = 'G1'
  await store.search('chikorita')
  expect(store.currentId).toBe(152)
  expect(store.generationKey).toBe('ALL')
})

test('search loads the list first when it is empty', async () => {
  const store = usePokedexStore()
  expect(await store.search('pikachu')).toBe(true)
  expect(fetchPokemonList).toHaveBeenCalledTimes(1)
})

test('failed fetch sets error status and retry recovers', async () => {
  const store = makeStore()
  fetchPokemon.mockRejectedValueOnce(new Error('boom'))
  await store.select(25)
  expect(store.status).toBe('error')
  await store.retry()
  expect(store.status).toBe('idle')
  expect(store.entry.pokemon.id).toBe(25)
})
