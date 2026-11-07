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
  const data = await getJson(`/pokemon?limit=${MAX_ID}`)
  return data.results.map(({ name, url }) => ({
    id: Number(url.split('/').filter(Boolean).pop()),
    name
  }))
}

export async function fetchPokemon(id) {
  const data = await getJson(`/pokemon/${id}`)
  return {
    id: data.id,
    name: data.name,
    sprite: data.sprites?.front_default ?? null,
    types: data.types.map((t) => t.type.name),
    heightM: data.height / 10,
    weightKg: data.weight / 10
  }
}

export async function fetchEntryText(id) {
  const data = await getJson(`/pokemon-species/${id}`)
  const entry = data.flavor_text_entries.find((e) => e.language.name === 'en')
  return entry ? cleanFlavorText(entry.flavor_text) : ''
}
