import { test, expect, vi, afterEach } from 'vitest'
import { fetchPokemon } from './pokeapi'

function mockFetch(body) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => body }))
}

afterEach(() => vi.unstubAllGlobals())

const FULL_POKEMON = {
  id: 25,
  name: 'pikachu',
  height: 4,
  weight: 60,
  types: [{ type: { name: 'electric' } }],
  cries: { latest: 'latest.ogg', legacy: 'legacy.ogg' },
  sprites: {
    front_default: 'f.png',
    front_shiny: 'fs.png',
    back_default: 'b.png',
    back_shiny: 'bs.png',
    versions: {
      'generation-v': {
        'black-white': {
          animated: {
            front_default: 'g5-f.gif',
            front_shiny: 'g5-fs.gif',
            back_default: 'g5-b.gif',
            back_shiny: 'g5-bs.gif'
          }
        }
      }
    },
    other: {
      showdown: {
        front_default: 'sd-f.gif',
        front_shiny: 'sd-fs.gif',
        back_default: 'sd-b.gif',
        back_shiny: 'sd-bs.gif'
      }
    }
  }
}

test('maps static sprites for all four angles', async () => {
  mockFetch(FULL_POKEMON)
  const p = await fetchPokemon(25)
  expect(p.sprites).toEqual({ front: 'f.png', shiny: 'fs.png', back: 'b.png', backShiny: 'bs.png' })
})

test('prefers generation V animated sprites', async () => {
  mockFetch(FULL_POKEMON)
  const p = await fetchPokemon(25)
  expect(p.animated).toEqual({
    front: 'g5-f.gif',
    shiny: 'g5-fs.gif',
    back: 'g5-b.gif',
    backShiny: 'g5-bs.gif'
  })
})

test('falls back to showdown animated sprites', async () => {
  mockFetch({ ...FULL_POKEMON, sprites: { ...FULL_POKEMON.sprites, versions: {} } })
  const p = await fetchPokemon(25)
  expect(p.animated.front).toBe('sd-f.gif')
  expect(p.animated.backShiny).toBe('sd-bs.gif')
})

test('returns null animated sprites when none exist', async () => {
  mockFetch({ ...FULL_POKEMON, sprites: { front_default: 'f.png' } })
  const p = await fetchPokemon(25)
  expect(p.animated).toEqual({ front: null, shiny: null, back: null, backShiny: null })
})

test('uses the latest cry, then legacy, then null', async () => {
  mockFetch(FULL_POKEMON)
  expect((await fetchPokemon(25)).cry).toBe('latest.ogg')
  mockFetch({ ...FULL_POKEMON, cries: { legacy: 'legacy.ogg' } })
  expect((await fetchPokemon(25)).cry).toBe('legacy.ogg')
  mockFetch({ ...FULL_POKEMON, cries: undefined })
  expect((await fetchPokemon(25)).cry).toBeNull()
})
