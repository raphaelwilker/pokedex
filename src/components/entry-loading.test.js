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
import EntryText from './EntryText.vue'
import App from '../App.vue'

let pinia
let store

beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)
  store = usePokedexStore()
})

test('EntryText shows LOADING... as name and text while there is no entry', () => {
  store.entry = null
  const wrapper = mount(EntryText, { global: { plugins: [pinia] } })
  expect(wrapper.find('.entry-name').text()).toBe('LOADING...')
  expect(wrapper.find('.terminal').text()).toBe('LOADING...')
})

test('EntryText replaces LOADING... with the pokemon once loaded', async () => {
  const wrapper = mount(EntryText, { global: { plugins: [pinia] } })
  store.entry = { pokemon: { id: 25, name: 'pikachu' }, text: 'It stores electricity.' }
  await wrapper.vm.$nextTick()
  expect(wrapper.find('.entry-name').text()).toBe('PIKACHU')
  expect(wrapper.find('.terminal').text()).toBe('IT STORES ELECTRICITY.')
})

test('document title follows the pokemon on screen', async () => {
  const wrapper = mount(App, { global: { plugins: [pinia] } })
  expect(document.title).toContain('Pokédex Online')
  store.entry = { pokemon: { id: 25, name: 'pikachu', types: ['electric'], heightM: 0.4, weightKg: 6 }, text: '' }
  await wrapper.vm.$nextTick()
  expect(document.title).toBe('Pikachu #0025 – Pokédex Online')
})
