import { test, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('../cache/media', () => ({
  MEDIA_LIMIT_BYTES: 50 * 1024 * 1024,
  resolveMedia: vi.fn(),
  revokeMedia: vi.fn()
}))

import * as media from '../cache/media'
import { usePokedexStore } from '../stores/pokedex'
import ScreenDisplay from './ScreenDisplay.vue'
import EntryText from './EntryText.vue'

const resolveMedia = vi.mocked(media.resolveMedia)
const revokeMedia = vi.mocked(media.revokeMedia)

const NO_SPRITES = { front: null, shiny: null, back: null, backShiny: null }

let pinia: ReturnType<typeof createPinia>
let store: ReturnType<typeof usePokedexStore>

function setPokemon(front: string | null, shiny: string | null = null, cry: string | null = null): void {
  store.entry = {
    pokemon: {
      id: 25,
      name: 'pikachu',
      sprite: front,
      sprites: { front, shiny, back: null, backShiny: null, female: NO_SPRITES },
      animated: { ...NO_SPRITES, female: NO_SPRITES },
      cry,
      types: ['electric'],
      heightM: 0.4,
      weightKg: 6
    },
    text: 'text',
    genderRate: 4
  }
}

function mountScreen() {
  return mount(ScreenDisplay, { global: { plugins: [pinia] } })
}

beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)
  store = usePokedexStore()
  store.currentId = 25
  store.status = 'idle'
  // by default "resolving" maps https://x/<name> to blob:local-<name>
  resolveMedia.mockReset().mockImplementation(async (url) => url.replace('https://x/', 'blob:local-'))
  revokeMedia.mockReset()
})

afterEach(() => vi.restoreAllMocks())

test('the sprite on screen is the local copy returned by the media cache', async () => {
  setPokemon('https://x/front.png')
  const wrapper = mountScreen()
  await flushPromises()
  expect(resolveMedia).toHaveBeenCalledWith('https://x/front.png')
  expect(wrapper.find('img').attributes('src')).toBe('blob:local-front.png')
})

test('changing the sprite releases the previous local copy', async () => {
  setPokemon('https://x/front.png', 'https://x/shiny.png')
  const wrapper = mountScreen()
  await flushPromises()
  store.setShiny(true)
  await flushPromises()
  expect(wrapper.find('img').attributes('src')).toBe('blob:local-shiny.png')
  expect(revokeMedia).toHaveBeenCalledWith('blob:local-front.png')
})

test('leaving the screen releases the current local copy', async () => {
  setPokemon('https://x/front.png')
  const wrapper = mountScreen()
  await flushPromises()
  wrapper.unmount()
  expect(revokeMedia).toHaveBeenCalledWith('blob:local-front.png')
})

test('a slow answer for a sprite you already changed away from is discarded and released', async () => {
  let releaseFirst!: (value: string) => void
  resolveMedia.mockImplementationOnce(() => new Promise((resolve) => (releaseFirst = resolve)))
  setPokemon('https://x/front.png', 'https://x/shiny.png')
  const wrapper = mountScreen()
  store.setShiny(true) // second request answers immediately
  await flushPromises()
  releaseFirst('blob:late-front')
  await flushPromises()
  expect(wrapper.find('img').attributes('src')).toBe('blob:local-shiny.png')
  expect(revokeMedia).toHaveBeenCalledWith('blob:late-front')
})

function stubAudio(sources: string[]): void {
  vi.stubGlobal(
    'Audio',
    function (this: { play: () => Promise<void>; pause: () => void; addEventListener: () => void }, src: string) {
      sources.push(src)
      this.play = vi.fn().mockResolvedValue(undefined)
      this.pause = vi.fn()
      this.addEventListener = vi.fn()
    }
  )
}

// Mobile Safari only lets audio start inside the tap itself, so the Audio must be
// created and played synchronously in the click handler (no await before play()).
test('the cry plays from the local copy, started synchronously inside the tap', async () => {
  setPokemon('https://x/front.png', null, 'https://x/cry.ogg')
  const sources: string[] = []
  stubAudio(sources)
  const wrapper = mountScreen()
  await flushPromises() // the local copy of the cry is prepared when the Pokémon appears
  expect(resolveMedia).toHaveBeenCalledWith('https://x/cry.ogg')
  ;(wrapper.find('.cry-btn').element as HTMLButtonElement).click() // no await on purpose
  expect(sources).toEqual(['blob:local-cry.ogg'])
  vi.unstubAllGlobals()
})

test('if the local copy is not ready yet, the cry still plays at once from the original address', async () => {
  setPokemon('https://x/front.png', null, 'https://x/cry.ogg')
  resolveMedia.mockImplementation((url) => (url.endsWith('cry.ogg') ? new Promise(() => {}) : Promise.resolve(url)))
  const sources: string[] = []
  stubAudio(sources)
  const wrapper = mountScreen()
  await flushPromises()
  ;(wrapper.find('.cry-btn').element as HTMLButtonElement).click()
  expect(sources).toEqual(['https://x/cry.ogg'])
  vi.unstubAllGlobals()
})

test('changing Pokémon releases the previous cry copy', async () => {
  setPokemon('https://x/front.png', null, 'https://x/cry.ogg')
  const wrapper = mountScreen()
  await flushPromises()
  setPokemon('https://x/front2.png', null, 'https://x/cry2.ogg')
  await flushPromises()
  expect(revokeMedia).toHaveBeenCalledWith('blob:local-cry.ogg')
  wrapper.unmount()
  expect(revokeMedia).toHaveBeenCalledWith('blob:local-cry2.ogg')
})

function offline(value: boolean): void {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(!value)
}

test('the error shows that the device is offline when it is', () => {
  offline(true)
  store.status = 'error'
  const text = mount(EntryText, { global: { plugins: [pinia] } }).text()
  expect(text).toContain('ERROR: COULD NOT LOAD DATA.')
  expect(text).toContain('YOU ARE OFFLINE.')
})

test('the error does not claim to be offline when the device is online', () => {
  offline(false)
  store.status = 'error'
  const text = mount(EntryText, { global: { plugins: [pinia] } }).text()
  expect(text).toContain('ERROR: COULD NOT LOAD DATA.')
  expect(text).not.toContain('OFFLINE')
})
