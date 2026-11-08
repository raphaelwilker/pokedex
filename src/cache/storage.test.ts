import { test, expect, vi, beforeEach, afterEach } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import type { PokedexEntry, PokemonListItem } from '../types'

// the global test setup replaces the cache with a no-op; these tests need the real one
vi.unmock('./storage')

const NO_SPRITES = { front: null, shiny: null, back: null, backShiny: null }

function entry(id: number, extra: Partial<PokedexEntry> = {}): PokedexEntry {
  return {
    pokemon: {
      id,
      name: `p${id}`,
      sprite: null,
      sprites: { ...NO_SPRITES, female: NO_SPRITES },
      animated: { ...NO_SPRITES, female: NO_SPRITES },
      cry: null,
      types: ['grass'],
      heightM: 1,
      weightKg: 1
    },
    text: 'text',
    genderRate: 4,
    ...extra
  }
}

// a fresh module (and a fresh, empty database) for every test
async function load() {
  vi.resetModules()
  return import('./storage')
}

beforeEach(() => {
  vi.stubGlobal('indexedDB', new IDBFactory())
})

afterEach(() => vi.unstubAllGlobals())

test('an entry that was saved can be read back', async () => {
  const storage = await load()
  await storage.setEntry(25, entry(25))
  expect(await storage.getEntry(25)).toEqual(entry(25))
})

test('reading an entry that was never saved gives undefined', async () => {
  const storage = await load()
  expect(await storage.getEntry(999)).toBeUndefined()
})

test('an entry saved by an older version of the app (old shape) is ignored', async () => {
  const storage = await load()
  const oldShape = { pokemon: { id: 7, name: 'squirtle', sprite: 'x.png' }, text: 'old' }
  await storage.setEntry(7, oldShape as unknown as PokedexEntry)
  expect(await storage.getEntry(7)).toBeUndefined()
})

test('isValidEntry accepts a complete entry and rejects broken ones', async () => {
  const { isValidEntry } = await load()
  expect(isValidEntry(entry(1))).toBe(true)
  expect(isValidEntry(entry(1, { genderRate: null }))).toBe(true)
  expect(isValidEntry(null)).toBe(false)
  expect(isValidEntry('text')).toBe(false)
  expect(isValidEntry({ ...entry(1), text: 5 })).toBe(false)
  expect(isValidEntry({ ...entry(1), genderRate: 'x' })).toBe(false)
  expect(isValidEntry({ pokemon: { id: 1 }, text: '', genderRate: null })).toBe(false)
})

test('the name list can be saved and read back', async () => {
  const storage = await load()
  const list: PokemonListItem[] = [{ id: 1, name: 'bulbasaur' }, { id: 25, name: 'pikachu' }]
  expect(await storage.getList()).toBeUndefined()
  await storage.setList(list)
  expect(await storage.getList()).toEqual(list)
})

test('without IndexedDB everything still works from memory and nothing throws', async () => {
  vi.stubGlobal('indexedDB', undefined)
  const storage = await load()
  await expect(storage.setEntry(1, entry(1))).resolves.toBeUndefined()
  expect(await storage.getEntry(1)).toEqual(entry(1))
  await expect(storage.setList([{ id: 1, name: 'bulbasaur' }])).resolves.toBeUndefined()
  expect(await storage.getList()).toEqual([{ id: 1, name: 'bulbasaur' }])
})

test('when IndexedDB fails while opening, memory is used instead', async () => {
  vi.stubGlobal('indexedDB', {
    open: () => {
      throw new Error('blocked')
    }
  })
  const storage = await load()
  await storage.setEntry(3, entry(3))
  expect(await storage.getEntry(3)).toEqual(entry(3))
})

test('data survives a restart of the app (module reloaded, same IndexedDB)', async () => {
  const first = await load()
  await first.setEntry(25, entry(25))
  await first.setList([{ id: 25, name: 'pikachu' }])

  vi.resetModules() // a fresh memory, but the same database
  const second = await import('./storage')
  expect(await second.getEntry(25)).toEqual(entry(25))
  expect(await second.getList()).toEqual([{ id: 25, name: 'pikachu' }])
})
