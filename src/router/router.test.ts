import { test, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import { nextTick } from 'vue'

vi.mock('../api/pokeapi', () => ({
  fetchPokemonList: vi.fn().mockResolvedValue([]),
  fetchPokemon: vi.fn(async (id) => ({ id, name: `p${id}`, sprite: null, types: [], heightM: 1, weightKg: 1 })),
  fetchEntryText: vi.fn().mockResolvedValue('t')
}))

import { createAppRouter, syncRouteWithStore } from './index'
import { usePokedexStore } from '../stores/pokedex'

beforeEach(() => setActivePinia(createPinia()))

async function go(path) {
  const router = createAppRouter(createMemoryHistory())
  await router.push(path)
  await router.isReady()
  return router
}

test('root redirects to /pokemon/1', async () => {
  expect((await go('/')).currentRoute.value.fullPath).toBe('/pokemon/1')
})

test('invalid ids in the URL fall back to /pokemon/1', async () => {
  for (const path of ['/pokemon/abc', '/pokemon/0', '/pokemon/9999']) {
    expect((await go(path)).currentRoute.value.fullPath).toBe('/pokemon/1')
  }
})

test('valid id is kept', async () => {
  expect((await go('/pokemon/25')).currentRoute.value.fullPath).toBe('/pokemon/25')
})

test('store.select updates the route', async () => {
  const router = await go('/pokemon/1')
  const store = usePokedexStore()
  syncRouteWithStore(router, store)
  await store.select(25)
  await nextTick()
  await router.isReady()
  await new Promise((r) => setTimeout(r, 0))
  expect(router.currentRoute.value.fullPath).toBe('/pokemon/25')
})

test('route change selects the pokemon in the store', async () => {
  const router = await go('/pokemon/1')
  const store = usePokedexStore()
  syncRouteWithStore(router, store)
  await router.push('/pokemon/7')
  await new Promise((r) => setTimeout(r, 0))
  expect(store.currentId).toBe(7)
})
