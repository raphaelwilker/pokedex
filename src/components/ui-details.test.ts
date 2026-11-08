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

// label/value pairs of the LCD boxes, e.g. { TYPE: 'GRASS', GENERATION: '1', REGION: 'KANTO' }
function boxes(): Record<string, string> {
  const wrapper = mount(InfoPanel, { global: { plugins: [pinia] } })
  const result: Record<string, string> = {}
  for (const box of wrapper.findAll('.lcd-box')) {
    result[box.find('.lcd-label').text()] = box.find('.lcd-value').text()
  }
  return result
}

test('InfoPanel shows generation and region in the same LCD format as type and dimensions', () => {
  store.currentId = 25
  const info = boxes()
  expect(Object.keys(info)).toEqual(['TYPE', 'DIMENSIONS', 'GENERATION', 'REGION'])
  expect(info.GENERATION).toBe('1')
  expect(info.REGION).toBe('KANTO')
})

test.each([
  [152, '2', 'JOHTO'],
  [387, '4', 'SINNOH'],
  [1000, '9', 'PALDEA']
])('InfoPanel for #%i shows generation %s and region %s', (id, gen, region) => {
  store.currentId = id
  store.entry = { pokemon: pokemon(id), text: '' }
  const info = boxes()
  expect(info.GENERATION).toBe(gen)
  expect(info.REGION).toBe(region)
})
