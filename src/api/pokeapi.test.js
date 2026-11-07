import { test, expect, vi, afterEach } from 'vitest'
import { fetchPokemonList, fetchPokemon, fetchEntryText, cleanFlavorText } from './pokeapi'

function mockFetch(body, ok = true) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok, status: ok ? 200 : 500, json: async () => body }))
}

afterEach(() => vi.unstubAllGlobals())

test('fetchPokemonList extracts ids from urls', async () => {
  mockFetch({ results: [{ name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' }] })
  expect(await fetchPokemonList()).toEqual([{ id: 1, name: 'bulbasaur' }])
  expect(fetch.mock.calls[0][0]).toContain('/pokemon?limit=1025')
})

test('fetchPokemon converts units and maps types and sprite', async () => {
  mockFetch({
    id: 1,
    name: 'bulbasaur',
    height: 7,
    weight: 69,
    sprites: { front_default: 'x.png' },
    types: [{ type: { name: 'grass' } }, { type: { name: 'poison' } }]
  })
  expect(await fetchPokemon(1)).toEqual({
    id: 1,
    name: 'bulbasaur',
    sprite: 'x.png',
    types: ['grass', 'poison'],
    heightM: 0.7,
    weightKg: 6.9
  })
})

test('cleanFlavorText normalizes line breaks and form feeds', () => {
  expect(cleanFlavorText('A strange\nseed\fwas  planted')).toBe('A strange seed was planted')
})

test('fetchEntryText returns the first english entry', async () => {
  mockFetch({
    flavor_text_entries: [
      { flavor_text: 'Texto', language: { name: 'es' } },
      { flavor_text: 'A strange\nseed', language: { name: 'en' } }
    ]
  })
  expect(await fetchEntryText(1)).toBe('A strange seed')
})

test('fetchEntryText returns empty string when no english entry exists', async () => {
  mockFetch({ flavor_text_entries: [{ flavor_text: 'Texto', language: { name: 'es' } }] })
  expect(await fetchEntryText(1)).toBe('')
})

test('non-ok responses reject', async () => {
  mockFetch({}, false)
  await expect(fetchPokemon(1)).rejects.toThrow()
})
