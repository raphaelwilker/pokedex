import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // relative asset paths: works at github.io/pokedex/ and on a custom domain
  base: './',
  plugins: [vue()],
  server: { port: 3000, strictPort: false },
  preview: { port: 3000, strictPort: false },
  test: { environment: 'jsdom' }
})
