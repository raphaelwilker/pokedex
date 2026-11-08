import { MAX_ID } from '../data/generations'

const BASE = 'https://pokeapi.co/api/v2'

async function getJson(path) {
  const response = await fetch(`${BASE}${path}`)
  if (!response.ok) {
    throw new Error(`PokeAPI request failed: ${response.status}`)
  }
  return response.json()
}

export function cleanFlavorText(raw) {
  return raw.replace(/[\n\f]/g, ' ').replace(/\s+/g, ' ').trim()
}

export async function fetchPokemonList() {
  const data = await getJson(`/pokemon-species?limit=${MAX_ID}`)
  return data.results.map(({ name, url }) => ({
    id: Number(url.split('/').filter(Boolean).pop()),
    name
  }))
}

// Animated GIFs: Gen V (Pokémon up to #649) first, then Showdown (wider coverage).
function animatedSprites(sprites) {
  const gen5 = sprites?.versions?.['generation-v']?.['black-white']?.animated
  const showdown = sprites?.other?.showdown
  const pick = (key) => gen5?.[key] ?? showdown?.[key] ?? null
  return {
    front: pick('front_default'),
    shiny: pick('front_shiny'),
    back: pick('back_default'),
    backShiny: pick('back_shiny'),
    female: {
      front: pick('front_female'),
      shiny: pick('front_shiny_female'),
      back: pick('back_female'),
      backShiny: pick('back_shiny_female')
    }
  }
}

export async function fetchPokemon(id) {
  const data = await getJson(`/pokemon/${id}`)
  return {
    id: data.id,
    name: data.name,
    sprite: data.sprites?.front_default ?? null,
    sprites: {
      front: data.sprites?.front_default ?? null,
      shiny: data.sprites?.front_shiny ?? null,
      back: data.sprites?.back_default ?? null,
      backShiny: data.sprites?.back_shiny ?? null,
      female: {
        front: data.sprites?.front_female ?? null,
        shiny: data.sprites?.front_shiny_female ?? null,
        back: data.sprites?.back_female ?? null,
        backShiny: data.sprites?.back_shiny_female ?? null
      }
    },
    animated: animatedSprites(data.sprites),
    cry: data.cries?.latest ?? data.cries?.legacy ?? null,
    types: data.types.map((t) => t.type.name),
    heightM: data.height / 10,
    weightKg: data.weight / 10
  }
}

// -1 = genderless, 0 = always male, 8 = always female, 1-7 = both (eighths female)
export async function fetchGenderRate(id) {
  const data = await getJson(`/pokemon-species/${id}`)
  return typeof data.gender_rate === 'number' ? data.gender_rate : null
}

export async function fetchEntryText(id) {
  const data = await getJson(`/pokemon-species/${id}`)
  const entry = data.flavor_text_entries.find((e) => e.language.name === 'en')
  return entry ? cleanFlavorText(entry.flavor_text) : ''
}
