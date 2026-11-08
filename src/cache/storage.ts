import { createStore, get, set } from 'idb-keyval'
import type { UseStore } from 'idb-keyval'
import type { PokedexEntry, PokemonListItem } from '../types'

/*
 * Permanent cache for Pokémon data, backed by IndexedDB (works in browsers and
 * in the Capacitor WebViews). Nothing here throws: when IndexedDB is missing or
 * fails (private tabs, blocked storage), the data lives in memory only.
 */

const memory = new Map<string, unknown>()
let idb: UseStore | null | undefined // undefined = not opened yet, null = unavailable

function database(): UseStore | null {
  if (idb === undefined) {
    try {
      idb = createStore('pokedex', 'data')
    } catch {
      idb = null
    }
  }
  return idb
}

async function read(key: string): Promise<unknown> {
  if (memory.has(key)) return memory.get(key)
  const db = database()
  if (db) {
    try {
      const value = await get(key, db)
      if (value !== undefined) memory.set(key, value)
      return value
    } catch {
      // IndexedDB failed: nothing more to try
    }
  }
  return undefined
}

async function write(key: string, value: unknown): Promise<void> {
  memory.set(key, value)
  const db = database()
  if (!db) return
  try {
    await set(key, value, db)
  } catch {
    // memory still has it for this session
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

// Entries saved by older versions of the app may have another shape: they are ignored.
export function isValidEntry(value: unknown): value is PokedexEntry {
  if (!isObject(value) || !isObject(value.pokemon)) return false
  const pokemon = value.pokemon
  return (
    typeof pokemon.id === 'number' &&
    typeof pokemon.name === 'string' &&
    isObject(pokemon.sprites) &&
    isObject(pokemon.animated) &&
    typeof value.text === 'string' &&
    (value.genderRate === null || typeof value.genderRate === 'number')
  )
}

export async function getEntry(id: number): Promise<PokedexEntry | undefined> {
  const value = await read(`entry:${id}`)
  return isValidEntry(value) ? value : undefined
}

export async function setEntry(id: number, entry: PokedexEntry): Promise<void> {
  await write(`entry:${id}`, entry)
}

export async function getList(): Promise<PokemonListItem[] | undefined> {
  const value = await read('list')
  return Array.isArray(value) ? (value as PokemonListItem[]) : undefined
}

export async function setList(list: PokemonListItem[]): Promise<void> {
  await write('list', list)
}
