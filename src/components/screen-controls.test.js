import { test, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('../api/pokeapi', () => ({
  fetchPokemonList: vi.fn(),
  fetchPokemon: vi.fn(),
  fetchEntryText: vi.fn()
}))

import { fetchPokemon, fetchEntryText } from '../api/pokeapi'
import { usePokedexStore } from '../stores/pokedex'
import ScreenDisplay from './ScreenDisplay.vue'

const SPRITES = { front: 'f.png', shiny: 'fs.png', back: 'b.png', backShiny: 'bs.png' }
let pinia
let store

function mountScreen() {
  return mount(ScreenDisplay, { global: { plugins: [pinia] } })
}

function setPokemon(extra = {}) {
  store.entry = {
    pokemon: { id: 1, name: 'bulbasaur', sprite: 'f.png', sprites: SPRITES, cry: 'cry.ogg', ...extra },
    text: ''
  }
}

beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)
  fetchPokemon.mockReset().mockImplementation(async (id) => ({ id, name: `p${id}`, sprite: 'x.png', sprites: SPRITES, types: [], heightM: 1, weightKg: 1 }))
  fetchEntryText.mockReset().mockResolvedValue('text')
  store = usePokedexStore()
  store.currentId = 1
  store.status = 'idle'
  setPokemon()
})

afterEach(() => vi.unstubAllGlobals())

test('red pill shows shiny and blue pill shows normal', async () => {
  const wrapper = mountScreen()
  expect(wrapper.find('img').attributes('src')).toBe('f.png')
  await wrapper.find('.pill-red').trigger('click')
  expect(wrapper.find('img').attributes('src')).toBe('fs.png')
  await wrapper.find('.pill-blue').trigger('click')
  expect(wrapper.find('img').attributes('src')).toBe('f.png')
})

test('d-pad up and down flip the sprite to the back and again to the front', async () => {
  const wrapper = mountScreen()
  await wrapper.find('.dp-up').trigger('click')
  expect(wrapper.find('img').attributes('src')).toBe('b.png')
  await wrapper.find('.dp-down').trigger('click')
  expect(wrapper.find('img').attributes('src')).toBe('f.png')
})

test('d-pad right loads the next pokemon and left the previous one', async () => {
  store.currentId = 5
  const wrapper = mountScreen()
  await wrapper.find('.dp-right').trigger('click')
  await flushPromises()
  expect(store.currentId).toBe(6)
  await wrapper.find('.dp-left').trigger('click')
  await flushPromises()
  expect(store.currentId).toBe(5)
})

test('d-pad left is disabled on the first pokemon', () => {
  const wrapper = mountScreen()
  expect(wrapper.find('.dp-left').attributes('disabled')).toBeDefined()
  expect(wrapper.find('.dp-right').attributes('disabled')).toBeUndefined()
})

test('round button plays the cry', async () => {
  const play = vi.fn().mockResolvedValue(undefined)
  const urls = []
  vi.stubGlobal('Audio', function (url) {
    urls.push(url)
    this.play = play
    this.pause = vi.fn()
  })
  await mountScreen().find('.cry-btn').trigger('click')
  expect(urls).toEqual(['cry.ogg'])
  expect(play).toHaveBeenCalledTimes(1)
})

test('round button does nothing when there is no cry', async () => {
  setPokemon({ cry: null })
  const audio = vi.fn()
  vi.stubGlobal('Audio', audio)
  await mountScreen().find('.cry-btn').trigger('click')
  expect(audio).not.toHaveBeenCalled()
})
