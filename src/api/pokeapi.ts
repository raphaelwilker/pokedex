import { MAX_ID } from '../data/generations'
import type { Pokemon, PokemonListItem, SpriteSet, Sprites } from '../types'

const BASE = 'https://pokeapi.co/api/v2'

// Only the parts of the PokéAPI responses that this app reads.
type SpriteUrls = Record<string, string | null | undefined>

// the flat sprite urls (front_default, back_shiny, ...) live next to these two nested groups
interface RawSprites {
  versions?: { 'generation-v'?: { 'black-white'?: { animated?: SpriteUrls } } }
  other?: { showdown?: SpriteUrls }
}

interface RawPokemon {
  id: number
  name: string
  height: number
  weight: number
  types: { type: { name: string } }[]
  sprites?: RawSprites
  cries?: { latest?: string | null; legacy?: string | null }
}

interface RawSpecies {
  gender_rate?: number
  flavor_text_entries: { flavor_text: string; language: { name: string } }[]
}

interface RawSpeciesList {
  results: { name: string; url: string }[]
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE}${path}`)
  if (!response.ok) {
    throw new Error(`PokeAPI request failed: ${response.status}`)
  }
  return response.json() as Promise<T>
}

export function cleanFlavorText(raw: string): string {
  return raw.replace(/[\n\f]/g, ' ').replace(/\s+/g, ' ').trim()
}

export async function fetchPokemonList(): Promise<PokemonListItem[]> {
  const data = await getJson<RawSpeciesList>(`/pokemon-species?limit=${MAX_ID}`)
  return data.results.map(({ name, url }) => ({
    id: Number(url.split('/').filter(Boolean).pop()),
    name
  }))
}

function spriteSet(source: SpriteUrls | undefined, keys: [string, string, string, string]): SpriteSet {
  const [front, shiny, back, backShiny] = keys
  return {
    front: source?.[front] ?? null,
    shiny: source?.[shiny] ?? null,
    back: source?.[back] ?? null,
    backShiny: source?.[backShiny] ?? null
  }
}

function staticSprites(sprites: RawSprites | undefined): Sprites {
  const flat = sprites as SpriteUrls | undefined
  return {
    ...spriteSet(flat, ['front_default', 'front_shiny', 'back_default', 'back_shiny']),
    female: spriteSet(flat, ['front_female', 'front_shiny_female', 'back_female', 'back_shiny_female'])
  }
}

// Animated GIFs: Gen V (Pokémon up to #649) first, then Showdown (wider coverage).
function animatedSprites(sprites: RawSprites | undefined): Sprites {
  const gen5 = sprites?.versions?.['generation-v']?.['black-white']?.animated
  const showdown = sprites?.other?.showdown
  const merged: SpriteUrls = {}
  for (const source of [showdown, gen5]) {
    for (const [key, value] of Object.entries(source ?? {})) {
      if (value) merged[key] = value
    }
  }
  return {
    ...spriteSet(merged, ['front_default', 'front_shiny', 'back_default', 'back_shiny']),
    female: spriteSet(merged, ['front_female', 'front_shiny_female', 'back_female', 'back_shiny_female'])
  }
}

export async function fetchPokemon(id: number): Promise<Pokemon> {
  const data = await getJson<RawPokemon>(`/pokemon/${id}`)
  return {
    id: data.id,
    name: data.name,
    sprite: (data.sprites as SpriteUrls | undefined)?.front_default ?? null,
    sprites: staticSprites(data.sprites),
    animated: animatedSprites(data.sprites),
    cry: data.cries?.latest ?? data.cries?.legacy ?? null,
    types: data.types.map((t) => t.type.name),
    heightM: data.height / 10,
    weightKg: data.weight / 10
  }
}

// -1 = genderless, 0 = always male, 8 = always female, 1-7 = both (eighths female)
export async function fetchGenderRate(id: number): Promise<number | null> {
  const data = await getJson<RawSpecies>(`/pokemon-species/${id}`)
  return typeof data.gender_rate === 'number' ? data.gender_rate : null
}

export async function fetchEntryText(id: number): Promise<string> {
  const data = await getJson<RawSpecies>(`/pokemon-species/${id}`)
  const entry = data.flavor_text_entries.find((e) => e.language.name === 'en')
  return entry ? cleanFlavorText(entry.flavor_text) : ''
}
