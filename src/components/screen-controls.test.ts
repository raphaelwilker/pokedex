import { test, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('../api/pokeapi', () => ({
  fetchPokemonList: vi.fn(),
  fetchPokemon: vi.fn(),
  fetchEntryText: vi.fn()
}))

vi.mock('../native/haptics', () => ({ buzz: vi.fn() }))

import * as api from '../api/pokeapi'
import { buzz } from '../native/haptics'
const fetchPokemon = vi.mocked(api.fetchPokemon)
const fetchEntryText = vi.mocked(api.fetchEntryText)
const buzzMock = vi.mocked(buzz)
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
  fetchPokemon.mockReset().mockImplementation(async (id) => ({ id, name: `p${id}`, sprite: 'x.png', sprites: SPRITES, types: [], heightM: 1, weightKg: 1 } as never))
  fetchEntryText.mockReset().mockResolvedValue('text')
  buzzMock.mockClear()
  store = usePokedexStore()
  store.currentId = 1
  store.status = 'idle'
  setPokemon()
})

afterEach(() => vi.unstubAllGlobals())

const FEMALE = { front: 'ff.png', shiny: 'ffs.png', back: 'fb.png', backShiny: 'fbs.png' }

test('yellow pill shows shiny and green pill shows normal', async () => {
  const wrapper = mountScreen()
  expect(wrapper.find('img').attributes('src')).toBe('f.png')
  await wrapper.find('.pill-yellow').trigger('click')
  expect(wrapper.find('img').attributes('src')).toBe('fs.png')
  await wrapper.find('.pill-green').trigger('click')
  expect(wrapper.find('img').attributes('src')).toBe('f.png')
})

function disabled(wrapper, selector) {
  return wrapper.find(selector).attributes('disabled') !== undefined
}

test('both red and blue are enabled when the pokemon can be male and female', () => {
  store.entry.genderRate = 4
  const wrapper = mountScreen()
  expect(disabled(wrapper, '.pill-red')).toBe(false)
  expect(disabled(wrapper, '.pill-blue')).toBe(false)
})

test('red is disabled when the pokemon is male only', () => {
  store.entry.genderRate = 0
  const wrapper = mountScreen()
  expect(disabled(wrapper, '.pill-red')).toBe(true)
  expect(disabled(wrapper, '.pill-blue')).toBe(false)
})

test('blue is disabled and the female sprite is shown when the pokemon is female only', () => {
  setPokemon({ sprites: { ...SPRITES, female: FEMALE } })
  store.entry.genderRate = 8
  const wrapper = mountScreen()
  expect(disabled(wrapper, '.pill-blue')).toBe(true)
  expect(disabled(wrapper, '.pill-red')).toBe(false)
  expect(wrapper.find('img').attributes('src')).toBe('ff.png')
})

test('red and blue are both disabled when the pokemon is genderless', () => {
  store.entry.genderRate = -1
  const wrapper = mountScreen()
  expect(disabled(wrapper, '.pill-red')).toBe(true)
  expect(disabled(wrapper, '.pill-blue')).toBe(true)
})

test('with unknown gender, red depends on the female sprite and blue stays enabled', () => {
  const wrapper = mountScreen()
  expect(disabled(wrapper, '.pill-red')).toBe(true)
  expect(disabled(wrapper, '.pill-blue')).toBe(false)
})

test('red shows the default sprite when the pokemon has both sexes but no distinct female sprite', async () => {
  store.entry.genderRate = 1
  const wrapper = mountScreen()
  await wrapper.find('.pill-red').trigger('click')
  expect(wrapper.find('img').attributes('src')).toBe('f.png')
})

test('red pill shows the female sprite and blue pill the male sprite', async () => {
  setPokemon({ sprites: { ...SPRITES, female: FEMALE } })
  store.entry.genderRate = 4
  const wrapper = mountScreen()
  expect(wrapper.find('.pill-red').attributes('disabled')).toBeUndefined()
  await wrapper.find('.pill-red').trigger('click')
  expect(wrapper.find('img').attributes('src')).toBe('ff.png')
  await wrapper.find('.pill-blue').trigger('click')
  expect(wrapper.find('img').attributes('src')).toBe('f.png')
})

test('gender and shiny combine, and d-pad flips the female sprite', async () => {
  setPokemon({ sprites: { ...SPRITES, female: FEMALE } })
  store.entry.genderRate = 4
  const wrapper = mountScreen()
  await wrapper.find('.pill-red').trigger('click')
  await wrapper.find('.pill-yellow').trigger('click')
  expect(wrapper.find('img').attributes('src')).toBe('ffs.png')
  await wrapper.find('.dp-up').trigger('click')
  expect(wrapper.find('img').attributes('src')).toBe('fbs.png')
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

test('d-pad arrows, coloured buttons and the cry button give haptic feedback', async () => {
  store.entry.genderRate = 4
  store.currentId = 5 // so both PREV and NEXT are enabled
  vi.stubGlobal('Audio', function () {
    this.play = vi.fn().mockResolvedValue(undefined)
    this.pause = vi.fn()
  })
  const wrapper = mountScreen()
  // navigation last: it changes the Pokémon
  for (const selector of ['.pill-red', '.pill-blue', '.pill-yellow', '.pill-green', '.cry-btn', '.dp-up', '.dp-down', '.dp-left', '.dp-right']) {
    buzzMock.mockClear()
    await wrapper.find(selector).trigger('click')
    expect(buzzMock, selector).toHaveBeenCalledTimes(1)
  }
})

test('a disabled button gives no haptic feedback', async () => {
  const wrapper = mountScreen()
  await wrapper.find('.dp-left').trigger('click')
  expect(buzzMock).not.toHaveBeenCalled()
})
