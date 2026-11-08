import { createRouter, createWebHashHistory } from 'vue-router'
import { watch } from 'vue'
import { MAX_ID } from '../data/generations'

const EMPTY_VIEW = { render: () => null }

export function parseId(raw) {
  const n = Number(raw)
  return Number.isInteger(n) && n >= 1 && n <= MAX_ID ? n : 1
}

// Hash history (/#/pokemon/25) works on static hosts such as GitHub Pages,
// which have no server-side fallback for deep links.
export function createAppRouter(history = createWebHashHistory()) {
  const router = createRouter({
    history,
    routes: [
      { path: '/', redirect: '/pokemon/1' },
      { path: '/pokemon/:id?', name: 'pokemon', component: EMPTY_VIEW }
    ]
  })

  router.beforeEach((to) => {
    if (to.name !== 'pokemon') return true
    const raw = to.params.id
    const id = parseId(raw)
    if (String(id) !== raw) return { name: 'pokemon', params: { id } }
    return true
  })

  return router
}

export function syncRouteWithStore(router, store) {
  const routeId = () => parseId(router.currentRoute.value.params.id)

  watch(routeId, (id) => {
    if (id !== store.currentId) store.select(id)
  })

  watch(
    () => store.currentId,
    (id) => {
      if (id !== routeId()) router.replace({ name: 'pokemon', params: { id } })
    }
  )

  store.select(routeId())
}
