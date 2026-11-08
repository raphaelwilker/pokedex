<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { usePokedexStore } from '../stores/pokedex'
import { buzz } from '../native/haptics'
import { resolveMedia, revokeMedia } from '../cache/media'

const store = usePokedexStore()
const number = computed(() => `NO. ${String(store.currentId).padStart(4, '0')}`)
// The sprite shown is the local copy when the file was seen before (works offline).
const shownSprite = ref<string | null>(null)
let spriteRequest = 0

watch(
  () => store.currentSprite,
  async (url) => {
    const mine = ++spriteRequest
    if (!url) {
      if (shownSprite.value) revokeMedia(shownSprite.value)
      shownSprite.value = null
      return
    }
    const resolved = await resolveMedia(url)
    if (mine !== spriteRequest) {
      revokeMedia(resolved) // a newer request took over while this one was pending
      return
    }
    const previous = shownSprite.value
    shownSprite.value = resolved
    if (previous) revokeMedia(previous)
  },
  { immediate: true }
)

// every control gives a light vibration, then does its job
function press(action: () => unknown): void {
  buzz()
  action()
}

let audio: HTMLAudioElement | null = null
let cryUrl: string | null = null

function stopCry(): void {
  if (audio) audio.pause()
  if (cryUrl) revokeMedia(cryUrl)
  audio = null
  cryUrl = null
}

async function playCry(): Promise<void> {
  buzz()
  const url = store.entry?.pokemon?.cry
  if (!url) return
  try {
    const src = await resolveMedia(url)
    stopCry()
    cryUrl = src
    const player = new Audio(src)
    audio = player
    player.volume = 0.5
    player.addEventListener('ended', () => {
      if (audio === player) stopCry()
    })
    const result = player.play()
    if (result?.catch) result.catch(() => {})
  } catch {
    // audio not available
  }
}

onBeforeUnmount(() => {
  spriteRequest++ // ignore any answer still pending
  if (shownSprite.value) revokeMedia(shownSprite.value)
  stopCry()
})
</script>

<template>
  <div class="screen-wrap">
    <div class="screen">
      <div class="lcd">
        <span v-if="store.status === 'loading'" class="lcd-loading">LOADING...</span>
        <div v-else-if="shownSprite" class="sprite-box">
          <img :src="shownSprite" :alt="store.entry?.pokemon.name" class="sprite" />
        </div>
      </div>
    </div>

    <div class="deck">
      <button type="button" class="cry-btn" aria-label="Play cry" title="Cry" @click="playCry"></button>
      <div class="number-lcd">{{ number }}</div>

      <div class="pills">
        <button
          type="button"
          class="pill pill-red"
          :class="{ on: store.isFemale }"
          :disabled="!store.canFemale"
          aria-label="Female sprite"
          @click="press(() => store.setGender('female'))"
        >
          Female ♀
        </button>
        <button
          type="button"
          class="pill pill-blue"
          :class="{ on: store.canMale && !store.isFemale }"
          :disabled="!store.canMale"
          aria-label="Male sprite"
          @click="press(() => store.setGender('male'))"
        >
          Male ♂
        </button>
        <button
          type="button"
          class="pill pill-yellow"
          :class="{ on: store.shiny }"
          aria-label="Shiny sprite"
          @click="press(() => store.setShiny(true))"
        >
          Shiny
        </button>
        <button
          type="button"
          class="pill pill-green"
          :class="{ on: !store.shiny }"
          aria-label="Normal sprite"
          @click="press(() => store.setShiny(false))"
        >
          Comum
        </button>
      </div>

      <div class="dpad">
        <svg class="dpad-shape" viewBox="0 0 102 102" aria-hidden="true">
          <defs>
            <linearGradient id="dpad-body" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#3a3a3a" />
              <stop offset="1" stop-color="#2e2e2e" />
            </linearGradient>
            <radialGradient id="dpad-hub" cx="0.35" cy="0.3" r="0.8">
              <stop offset="0" stop-color="#555" />
              <stop offset="1" stop-color="#333" />
            </radialGradient>
          </defs>
          <!-- one single cross shape: no seams or squares between the arms -->
          <path
            d="M36 4H66V36H98V66H66V98H36V66H4V36H36Z"
            fill="var(--ink)"
            stroke="var(--ink)"
            stroke-width="8"
            stroke-linejoin="round"
          />
          <path
            d="M36 4H66V36H98V66H66V98H36V66H4V36H36Z"
            fill="url(#dpad-body)"
            stroke="url(#dpad-body)"
            stroke-width="2"
            stroke-linejoin="round"
          />
          <circle cx="51" cy="51" r="8" fill="url(#dpad-hub)" stroke="var(--ink)" stroke-width="2" />
        </svg>
        <button type="button" class="dp dp-up" aria-label="Flip sprite" @click="press(() => store.toggleBack())"></button>
        <button type="button" class="dp dp-left" aria-label="Previous" :disabled="!store.canPrev" @click="press(() => store.prev())"></button>
        <button type="button" class="dp dp-right" aria-label="Next" :disabled="!store.canNext" @click="press(() => store.next())"></button>
        <button type="button" class="dp dp-down" aria-label="Flip sprite" @click="press(() => store.toggleBack())"></button>
      </div>
    </div>
  </div>
</template>
