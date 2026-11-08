import { test, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('../api/pokeapi', () => ({
  fetchPokemonList: vi.fn(),
  fetchPokemon: vi.fn(),
  fetchEntryText: vi.fn(),
  fetchGenderRate: vi.fn()
}))

import { usePokedexStore } from '../stores/pokedex'
import ScreenDisplay from './ScreenDisplay.vue'
import InfoPanel from './InfoPanel.vue'

let pinia
let store

function pokemon(id) {
  return { id, name: `p${id}`, sprite: 'f.png', types: ['grass'], heightM: 1, weightKg: 1 }
}

beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)
  store = usePokedexStore()
  store.currentId = 1
  store.status = 'idle'
  store.entry = { pokemon: pokemon(1), text: '' }
})

test('the four colored buttons show their labels', () => {
  const wrapper = mount(ScreenDisplay, { global: { plugins: [pinia] } })
  expect(wrapper.find('.pill-red').text()).toBe('Female ♀')
  expect(wrapper.find('.pill-blue').text()).toBe('Male ♂')
  expect(wrapper.find('.pill-yellow').text()).toBe('Shiny')
  expect(wrapper.find('.pill-green').text()).toBe('Comum')
})

test('the d-pad is a single cross shape with four arrow buttons', () => {
  const wrapper = mount(ScreenDisplay, { global: { plugins: [pinia] } })
  expect(wrapper.findAll('.dpad-shape')).toHaveLength(1)
  for (const cls of ['.dp-up', '.dp-down', '.dp-left', '.dp-right']) {
    expect(wrapper.find(cls).exists()).toBe(true)
  }
})

test('InfoPanel shows generation and region', () => {
  store.currentId = 25
  const text = mount(InfoPanel, { global: { plugins: [pinia] } }).text()
  expect(text).toContain('GENERATION 1')
  expect(text).toContain('REGION KANTO')
})

test.each([
  [152, 'GENERATION 2', 'REGION JOHTO'],
  [387, 'GENERATION 4', 'REGION SINNOH'],
  [1000, 'GENERATION 9', 'REGION PALDEA']
])('InfoPanel for #%i shows %s and %s', (id, gen, region) => {
  store.currentId = id
  store.entry = { pokemon: pokemon(id), text: '' }
  const text = mount(InfoPanel, { global: { plugins: [pinia] } }).text()
  expect(text).toContain(gen)
  expect(text).toContain(region)
})
