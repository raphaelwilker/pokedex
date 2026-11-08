import { defineStore } from 'pinia'
import { fetchPokemonList, fetchPokemon, fetchEntryText, fetchGenderRate } from '../api/pokeapi'
import { getEntry, setEntry, getList, setList } from '../cache/storage'
import { MAX_ID, generationOf, regionOf, rangeFor } from '../data/generations'
import type { GenerationKey } from '../data/generations'
import type { Gender, PokedexEntry, PokemonListItem, SpriteKey, Status } from '../types'

let requestToken = 0

// The permanent cache is an optimisation: reading or saving must never break the app.
async function readSavedEntry(id: number): Promise<PokedexEntry | undefined> {
  try {
    return await getEntry(id)
  } catch {
    return undefined
  }
}

function saveEntry(id: number, entry: PokedexEntry): void {
  Promise.resolve()
    .then(() => setEntry(id, entry))
    .catch(() => {})
}

async function readSavedList(): Promise<PokemonListItem[] | undefined> {
  try {
    return await getList()
  } catch {
    return undefined
  }
}

function saveList(list: PokemonListItem[]): void {
  Promise.resolve()
    .then(() => setList(list))
    .catch(() => {})
}

function isValidId(id: number): boolean {
  return Number.isInteger(id) && id >= 1 && id <= MAX_ID
}

interface PokedexState {
  list: PokemonListItem[]
  currentId: number
  generationKey: GenerationKey
  entry: PokedexEntry | null
  status: Status
  shiny: boolean
  back: boolean
  gender: Gender
  searchError: boolean
  listError: boolean
  cache: Record<number, PokedexEntry>
}

export const usePokedexStore = defineStore('pokedex', {
  state: (): PokedexState => ({
    list: [],
    currentId: 1,
    generationKey: 'ALL',
    entry: null,
    status: 'idle',
    shiny: false,
    back: false,
    gender: 'male',
    searchError: false,
    listError: false,
    cache: {}
  }),

  getters: {
    range: (state) => rangeFor(state.generationKey),
    canPrev(): boolean {
      return this.currentId > this.range.min
    },
    canNext(): boolean {
      return this.currentId < this.range.max
    },
    currentGeneration: (state) => generationOf(state.currentId),
    currentRegion: (state) => regionOf(state.currentId),
    // true when the current pokémon has a distinct female sprite
    hasFemale: (state): boolean => {
      const p = state.entry?.pokemon
      return Boolean(p?.animated?.female?.front || p?.sprites?.female?.front)
    },
    // species gender rate: -1 genderless, 0 male only, 8 female only, 1-7 both; null = unknown
    genderRate: (state): number | null => state.entry?.genderRate ?? null,
    canMale(): boolean {
      const rate = this.genderRate
      return this.entry?.pokemon ? (rate === null ? true : rate >= 0 && rate < 8) : false
    },
    canFemale(): boolean {
      const rate = this.genderRate
      if (!this.entry?.pokemon) return false
      return rate === null ? this.hasFemale : rate > 0
    },
    // a female-only pokémon is always shown as female
    isFemale(): boolean {
      if (!this.canFemale) return false
      return this.gender === 'female' || !this.canMale
    },
    currentSprite(): string | null {
      const p = this.entry?.pokemon
      if (!p) return null
      // entries cached from older versions may only have the default `sprite`
      const s = p.sprites ?? { front: p.sprite }
      const key: SpriteKey = this.back ? (this.shiny ? 'backShiny' : 'back') : this.shiny ? 'shiny' : 'front'
      if (this.isFemale) {
        const female = p.animated?.female?.[key] ?? s.female?.[key]
        if (female) return female
      }
      return p.animated?.[key] ?? s[key] ?? p.animated?.front ?? s.front ?? null
    }
  },

  actions: {
    async init(): Promise<void> {
      if (this.list.length) return
      this.listError = false
      const savedList = await readSavedList()
      if (savedList?.length) {
        this.list = savedList
        return
      }
      try {
        this.list = await fetchPokemonList()
        saveList(this.list)
      } catch {
        this.listError = true
      }
    },

    async select(id: number): Promise<void> {
      const target = isValidId(id) ? id : 1
      const token = ++requestToken
      this.currentId = target
      this.status = 'loading'
      this.entry = this.cache[target] ?? null
      try {
        let entry: PokedexEntry | undefined = this.cache[target]
        if (!entry) {
          entry = await readSavedEntry(target)
          if (entry) this.cache[target] = entry
        }
        if (!entry) {
          let genderFailed = false
          const [pokemon, text, genderRate] = await Promise.all([
            fetchPokemon(target),
            fetchEntryText(target),
            // the gender is optional info: a failure here must not break the entry
            Promise.resolve()
              .then(() => fetchGenderRate(target))
              .then((rate) => (typeof rate === 'number' ? rate : null))
              .catch(() => {
                genderFailed = true
                return null
              })
          ])
          entry = { pokemon, text, genderRate }
          this.cache[target] = entry
          // an unknown gender caused by a failed request must not be kept forever
          if (!genderFailed) saveEntry(target, entry)
        }
        if (token !== requestToken) return
        this.entry = entry
        this.status = 'idle'
      } catch {
        if (token !== requestToken) return
        this.status = 'error'
      }
    },

    async next(): Promise<void> {
      if (this.canNext) await this.select(this.currentId + 1)
    },

    async prev(): Promise<void> {
      if (this.canPrev) await this.select(this.currentId - 1)
    },

    async setGeneration(key: GenerationKey): Promise<void> {
      this.generationKey = key
      const { min, max } = this.range
      if (this.currentId < min || this.currentId > max) {
        await this.select(min)
      }
    },

    async search(query: unknown): Promise<boolean> {
      const text = String(query ?? '')
        .trim()
        .toLowerCase()
        .replace(/^#/, '')
        .replace(/[.':]/g, '')
        .replace(/\s+/g, '-')
      let id: number | null = null
      if (/^\d+$/.test(text)) {
        const n = Number(text)
        if (isValidId(n)) id = n
      } else if (text) {
        await this.init()
        if (!this.list.length) {
          this.searchError = false
          return false
        }
        id = this.list.find((p) => p.name === text)?.id ?? null
      }
      if (id === null) {
        this.searchError = true
        return false
      }
      this.searchError = false
      const { min, max } = this.range
      if (id < min || id > max) this.generationKey = 'ALL'
      await this.select(id)
      return true
    },

    setShiny(value: boolean): void {
      this.shiny = Boolean(value)
    },

    setGender(value: Gender): void {
      this.gender = value === 'female' ? 'female' : 'male'
    },

    toggleBack(): void {
      this.back = !this.back
    },

    async retry(): Promise<void> {
      await this.select(this.currentId)
    }
  }
})
