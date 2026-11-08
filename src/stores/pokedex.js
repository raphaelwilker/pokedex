import { defineStore } from 'pinia'
import { fetchPokemonList, fetchPokemon, fetchEntryText, fetchGenderRate } from '../api/pokeapi'
import { MAX_ID, generationOf, rangeFor } from '../data/generations'

let requestToken = 0

function isValidId(id) {
  return Number.isInteger(id) && id >= 1 && id <= MAX_ID
}

export const usePokedexStore = defineStore('pokedex', {
  state: () => ({
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
    canPrev() {
      return this.currentId > this.range.min
    },
    canNext() {
      return this.currentId < this.range.max
    },
    currentGeneration: (state) => generationOf(state.currentId),
    // true when the current pokémon has a distinct female sprite
    hasFemale: (state) => {
      const p = state.entry?.pokemon
      return Boolean(p?.animated?.female?.front || p?.sprites?.female?.front)
    },
    // species gender rate: -1 genderless, 0 male only, 8 female only, 1-7 both; null = unknown
    genderRate: (state) => state.entry?.genderRate ?? null,
    canMale() {
      const rate = this.genderRate
      return this.entry?.pokemon ? (rate === null ? true : rate >= 0 && rate < 8) : false
    },
    canFemale() {
      const rate = this.genderRate
      if (!this.entry?.pokemon) return false
      return rate === null ? this.hasFemale : rate > 0
    },
    // a female-only pokémon is always shown as female
    isFemale() {
      if (!this.canFemale) return false
      return this.gender === 'female' || !this.canMale
    },
    currentSprite() {
      const p = this.entry?.pokemon
      if (!p) return null
      const s = p.sprites ?? { front: p.sprite }
      const key = this.back ? (this.shiny ? 'backShiny' : 'back') : this.shiny ? 'shiny' : 'front'
      if (this.isFemale) {
        const female = p.animated?.female?.[key] ?? s.female?.[key]
        if (female) return female
      }
      return p.animated?.[key] ?? s[key] ?? p.animated?.front ?? s.front ?? null
    }
  },

  actions: {
    async init() {
      if (this.list.length) return
      this.listError = false
      try {
        this.list = await fetchPokemonList()
      } catch {
        this.listError = true
      }
    },

    async select(id) {
      const target = isValidId(id) ? id : 1
      const token = ++requestToken
      this.currentId = target
      this.status = 'loading'
      this.entry = this.cache[target] ?? null
      try {
        let entry = this.cache[target]
        if (!entry) {
          const [pokemon, text, genderRate] = await Promise.all([
            fetchPokemon(target),
            fetchEntryText(target),
            // the gender is optional info: a failure here must not break the entry
            Promise.resolve()
              .then(() => fetchGenderRate(target))
              .then((rate) => (typeof rate === 'number' ? rate : null))
              .catch(() => null)
          ])
          entry = { pokemon, text, genderRate }
          this.cache[target] = entry
        }
        if (token !== requestToken) return
        this.entry = entry
        this.status = 'idle'
      } catch {
        if (token !== requestToken) return
        this.status = 'error'
      }
    },

    async next() {
      if (this.canNext) await this.select(this.currentId + 1)
    },

    async prev() {
      if (this.canPrev) await this.select(this.currentId - 1)
    },

    async setGeneration(key) {
      this.generationKey = key
      const { min, max } = this.range
      if (this.currentId < min || this.currentId > max) {
        await this.select(min)
      }
    },

    async search(query) {
      const text = String(query ?? '')
        .trim()
        .toLowerCase()
        .replace(/^#/, '')
        .replace(/[.':]/g, '')
        .replace(/\s+/g, '-')
      let id = null
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

    setShiny(value) {
      this.shiny = Boolean(value)
    },

    setGender(value) {
      this.gender = value === 'female' ? 'female' : 'male'
    },

    toggleBack() {
      this.back = !this.back
    },

    async retry() {
      await this.select(this.currentId)
    }
  }
})
