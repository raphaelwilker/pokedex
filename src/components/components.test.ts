import { test, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('../api/pokeapi', () => ({
  fetchPokemonList: vi.fn(),
  fetchPokemon: vi.fn(),
  fetchEntryText: vi.fn()
}))

import * as api from '../api/pokeapi'
const fetchPokemonList = vi.mocked(api.fetchPokemonList)
const fetchPokemon = vi.mocked(api.fetchPokemon)
const fetchEntryText = vi.mocked(api.fetchEntryText)
import { usePokedexStore } from '../stores/pokedex'
import GenerationPicker from './GenerationPicker.vue'
import SearchField from './SearchField.vue'
import PrevNext from './PrevNext.vue'
import InfoPanel from './InfoPanel.vue'
import ScreenDisplay from './ScreenDisplay.vue'
import EntryText from './EntryText.vue'

const BULBASAUR = { id: 1, name: 'bulbasaur', sprite: 'b.png', types: ['grass', 'poison'], heightM: 0.7, weightKg: 6.9 }
let pinia
let store

function mountWith(component) {
  return mount(component, { global: { plugins: [pinia] } })
}

beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)
  fetchPokemonList.mockReset().mockResolvedValue([{ id: 25, name: 'pikachu' }])
  fetchPokemon.mockReset().mockImplementation(async (id) => ({ ...BULBASAUR, id, name: `p${id}` } as never))
  fetchEntryText.mockReset().mockResolvedValue('a text')
  store = usePokedexStore()
  store.entry = { pokemon: BULBASAUR, text: 'A strange seed.' }
  store.currentId = 1
  store.status = 'idle'
})

test('GenerationPicker renders G1-G9 and ALL, and clicking G2 selects the generation', async () => {
  const wrapper = mountWith(GenerationPicker)
  const buttons = wrapper.findAll('button')
  expect(buttons.map((b) => b.text())).toEqual(['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9', 'ALL'])
  await buttons[1].trigger('click')
  await flushPromises()
  expect(store.generationKey).toBe('G2')
  expect(store.currentId).toBe(152)
})

test('SearchField shows NOT FOUND after searching an unknown name', async () => {
  const wrapper = mountWith(SearchField)
  const input = wrapper.find('input')
  expect(input.attributes('placeholder')).toBe('Search name or #id...')
  await input.setValue('zzz')
  await input.trigger('keydown.enter')
  await flushPromises()
  expect(wrapper.text()).toContain('NOT FOUND')
})

test('SearchField jumps to a known pokemon on Enter', async () => {
  const wrapper = mountWith(SearchField)
  const input = wrapper.find('input')
  await input.setValue('Pikachu')
  await input.trigger('keydown.enter')
  await flushPromises()
  expect(store.currentId).toBe(25)
  expect(wrapper.text()).not.toContain('NOT FOUND')
})

test('PrevNext disables PREV at the first id', () => {
  const wrapper = mountWith(PrevNext)
  const [prev, next] = wrapper.findAll('button')
  expect(prev.text()).toContain('PREV')
  expect(prev.attributes('disabled')).toBeDefined()
  expect(next.attributes('disabled')).toBeUndefined()
})

test('InfoPanel shows types, dimensions and generation', () => {
  const text = mountWith(InfoPanel).text()
  expect(text).toContain('GRASS / POISON')
  expect(text).toContain('HT 0.7M | WT 6.9KG')
  expect(text).toContain('GENERATION 1')
})

test('ScreenDisplay shows the padded number and sprite', () => {
  const wrapper = mountWith(ScreenDisplay)
  expect(wrapper.text()).toContain('NO. 0001')
  expect(wrapper.find('img').attributes('src')).toBe('b.png')
})

test('ScreenDisplay shows LOADING... while loading', () => {
  store.status = 'loading'
  expect(mountWith(ScreenDisplay).text()).toContain('LOADING...')
})

test('EntryText shows ENTRY, uppercase name and text', () => {
  const text = mountWith(EntryText).text()
  expect(text).toContain('ENTRY')
  expect(text).toContain('BULBASAUR')
  expect(text).toContain('A STRANGE SEED.')
})

test('EntryText shows NO DATA when the text is empty', () => {
  store.entry = { pokemon: BULBASAUR, text: '' }
  expect(mountWith(EntryText).text()).toContain('NO DATA')
})

test('EntryText shows an error and retries on click', async () => {
  store.status = 'error'
  const wrapper = mountWith(EntryText)
  const button = wrapper.find('button')
  expect(button.text()).toBe('tentar de novo')
  await button.trigger('click')
  await flushPromises()
  expect(store.status).toBe('idle')
})

test('EntryText shows the species name from the list instead of the form name', () => {
  store.list = [{ id: 487, name: 'giratina' }]
  store.currentId = 487
  store.entry = { pokemon: { ...BULBASAUR, id: 487, name: 'giratina-altered' }, text: 'x' }
  const text = mountWith(EntryText).text()
  expect(text).toContain('GIRATINA')
  expect(text).not.toContain('ALTERED')
})

test('SearchField shows a network error when the list could not be loaded', async () => {
  store.listError = true
  expect(mountWith(SearchField).text()).toContain('NETWORK ERROR')
})

test('SearchField has an accessible name', () => {
  expect(mountWith(SearchField).find('input').attributes('aria-label')).toBe('Search name or #id')
})
