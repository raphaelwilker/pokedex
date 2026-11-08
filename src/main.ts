import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { createAppRouter, syncRouteWithStore } from './router'
import { usePokedexStore } from './stores/pokedex'
import { initNative } from './native/init'

const app = createApp(App)
const pinia = createPinia()
const router = createAppRouter()

app.use(pinia).use(router)

router.isReady().then(() => {
  const store = usePokedexStore()
  syncRouteWithStore(router, store)
  store.init()
  app.mount('#app')
  void initNative() // status bar and splash screen in the native app; nothing in a browser
})
