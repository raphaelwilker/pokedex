import { test, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { PokedexEntry } from '../types'

vi.mock('../api/pokeapi', () => ({
  fetchPokemonList: vi.fn(),
  fetchPokemon: vi.fn(),
  fetchEntryText: vi.fn(),
  fetchGenderRate: vi.fn()
}))
vi.mock('../cache/storage', () => ({
  getEntry: vi.fn(),
  setEntry: vi.fn(),
  getList: vi.fn(),
  setList: vi.fn()
}))

import * as api from '../api/pokeapi'
import * as storage from '../cache/storage'
import { usePokedexStore } from './pokedex'

const fetchPokemon = vi.mocked(api.fetchPokemon)
const fetchEntryText = vi.mocked(api.fetchEntryText)
const fetchGenderRate = vi.mocked(api.fetchGenderRate)
const fetchPokemonList = vi.mocked(api.fetchPokemonList)
const getEntry = vi.mocked(storage.getEntry)
const setEntry = vi.mocked(storage.setEntry)
const getList = vi.mocked(storage.getList)
const setList = vi.mocked(storage.setList)

const NO_SPRITES = { front: null, shiny: null, back: null, backShiny: null }

function pokemon(id: number) {
  return {
    id,
    name: `p${id}`,
    sprite: null,
    sprites: { ...NO_SPRITES, female: NO_SPRITES },
    animated: { ...NO_SPRITES, female: NO_SPRITES },
    cry: null,
    types: ['grass'],
    heightM: 1,
    weightKg: 1
  }
}

function saved(id: number): PokedexEntry {
  return { pokemon: pokemon(id), text: `saved ${id}`, genderRate: 4 }
}

beforeEach(() => {
  setActivePinia(createPinia())
  fetchPokemon.mockReset().mockImplementation(async (id) => pokemon(id))
  fetchEntryText.mockReset().mockResolvedValue('from api')
  fetchGenderRate.mockReset().mockResolvedValue(4)
  fetchPokemonList.mockReset().mockResolvedValue([{ id: 25, name: 'pikachu' }])
  getEntry.mockReset().mockResolvedValue(undefined)
  setEntry.mockReset().mockResolvedValue(undefined)
  getList.mockReset().mockResolvedValue(undefined)
  setList.mockReset().mockResolvedValue(undefined)
})

test('a Pokémon seen before is shown from the permanent cache without calling the API', async () => {
  getEntry.mockResolvedValue(saved(25))
  const store = usePokedexStore()
  await store.select(25)
  expect(store.entry?.text).toBe('saved 25')
  expect(store.status).toBe('idle')
  expect(fetchPokemon).not.toHaveBeenCalled()
  expect(fetchEntryText).not.toHaveBeenCalled()
})

test('a new Pokémon is fetched from the API and then saved in the permanent cache', async () => {
  const store = usePokedexStore()
  await store.select(7)
  expect(fetchPokemon).toHaveBeenCalledWith(7)
  expect(setEntry).toHaveBeenCalledWith(7, { pokemon: pokemon(7), text: 'from api', genderRate: 4 })
})

test('an unreadable or invalid saved entry is ignored and the API is used', async () => {
  getEntry.mockRejectedValue(new Error('IndexedDB exploded'))
  const store = usePokedexStore()
  await store.select(9)
  expect(store.status).toBe('idle')
  expect(store.entry?.text).toBe('from api')
})

test('failing to save does not break showing the Pokémon', async () => {
  setEntry.mockRejectedValue(new Error('disk full'))
  const store = usePokedexStore()
  await store.select(9)
  expect(store.status).toBe('idle')
  expect(store.entry?.pokemon.id).toBe(9)
})

test('the same Pokémon twice in a session reads the permanent cache only once', async () => {
  getEntry.mockResolvedValue(saved(25))
  const store = usePokedexStore()
  await store.select(25)
  await store.select(25)
  expect(getEntry).toHaveBeenCalledTimes(1)
})

test('a slow cache read for a Pokémon you already left cannot replace the current one', async () => {
  let release!: (entry: PokedexEntry) => void
  getEntry.mockImplementation((id) => (id === 1 ? new Promise((resolve) => (release = resolve)) : Promise.resolve(undefined)))
  const store = usePokedexStore()
  const first = store.select(1)
  await store.select(2)
  release(saved(1))
  await first
  expect(store.currentId).toBe(2)
  expect(store.entry?.pokemon.id).toBe(2)
  expect(store.status).toBe('idle')
})

test('the saved name list is used instead of the API', async () => {
  getList.mockResolvedValue([{ id: 1, name: 'bulbasaur' }])
  const store = usePokedexStore()
  await store.init()
  expect(store.list).toEqual([{ id: 1, name: 'bulbasaur' }])
  expect(fetchPokemonList).not.toHaveBeenCalled()
})

test('without a saved list it is fetched and then saved', async () => {
  const store = usePokedexStore()
  await store.init()
  expect(store.list).toEqual([{ id: 25, name: 'pikachu' }])
  expect(setList).toHaveBeenCalledWith([{ id: 25, name: 'pikachu' }])
})

test('a failing list read falls back to the API', async () => {
  getList.mockRejectedValue(new Error('IndexedDB exploded'))
  const store = usePokedexStore()
  await store.init()
  expect(store.list).toEqual([{ id: 25, name: 'pikachu' }])
  expect(store.listError).toBe(false)
})

test('a Pokémon whose gender lookup failed is shown but NOT saved, so the next session asks again', async () => {
  fetchGenderRate.mockRejectedValue(new Error('rate limited'))
  const store = usePokedexStore()
  await store.select(29)
  expect(store.status).toBe('idle')
  expect(store.entry?.genderRate).toBeNull()
  expect(setEntry).not.toHaveBeenCalled()
})

test('a genuinely unknown gender (the API answered without one) is saved normally', async () => {
  fetchGenderRate.mockResolvedValue(null)
  const store = usePokedexStore()
  await store.select(29)
  expect(setEntry).toHaveBeenCalledTimes(1)
})
