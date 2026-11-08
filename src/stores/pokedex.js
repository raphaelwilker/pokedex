import { defineStore } from 'pinia'
import { fetchPokemonList, fetchPokemon, fetchEntryText } from '../api/pokeapi'
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
    currentSprite: (state) => {
      const p = state.entry?.pokemon
      if (!p) return null
      const s = p.sprites ?? { front: p.sprite }
      const pick = state.back
        ? (state.shiny ? s.backShiny : s.back)
        : (state.shiny ? s.shiny : s.front)
      return pick ?? s.front ?? null
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
          const [pokemon, text] = await Promise.all([fetchPokemon(target), fetchEntryText(target)])
          entry = { pokemon, text }
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

    toggleBack() {
      this.back = !this.back
    },

    async retry() {
      await this.select(this.currentId)
    }
  }
})
