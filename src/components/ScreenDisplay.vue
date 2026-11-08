<script setup>
import { computed } from 'vue'
import { usePokedexStore } from '../stores/pokedex'

const store = usePokedexStore()
const number = computed(() => `NO. ${String(store.currentId).padStart(4, '0')}`)
const sprite = computed(() => store.currentSprite)

let audio = null
function playCry() {
  const url = store.entry?.pokemon?.cry
  if (!url) return
  try {
    if (audio) audio.pause()
    audio = new Audio(url)
    audio.volume = 0.5
    const result = audio.play()
    if (result?.catch) result.catch(() => {})
  } catch {
    // audio not available
  }
}
</script>

<template>
  <div class="screen-wrap">
    <div class="screen">
      <div class="lcd">
        <span v-if="store.status === 'loading'" class="lcd-loading">LOADING...</span>
        <img v-else-if="sprite" :src="sprite" :alt="store.entry.pokemon.name" class="sprite" />
      </div>
    </div>

    <div class="deck">
      <div class="deck-left">
        <button type="button" class="cry-btn" aria-label="Play cry" title="Cry" @click="playCry"></button>
        <div class="number-lcd">{{ number }}</div>
      </div>

      <div class="deck-right">
        <div class="pills">
          <button
            type="button"
            class="pill pill-red"
            :class="{ on: store.shiny }"
            aria-label="Shiny sprite"
            title="Shiny"
            @click="store.setShiny(true)"
          ></button>
          <button
            type="button"
            class="pill pill-blue"
            :class="{ on: !store.shiny }"
            aria-label="Normal sprite"
            title="Normal"
            @click="store.setShiny(false)"
          ></button>
        </div>

        <div class="dpad">
          <button type="button" class="dp dp-up" aria-label="Flip sprite" @click="store.toggleBack()"></button>
          <button type="button" class="dp dp-left" aria-label="Previous" :disabled="!store.canPrev" @click="store.prev()"></button>
          <span class="dp dp-center"></span>
          <button type="button" class="dp dp-right" aria-label="Next" :disabled="!store.canNext" @click="store.next()"></button>
          <button type="button" class="dp dp-down" aria-label="Flip sprite" @click="store.toggleBack()"></button>
        </div>
      </div>
    </div>
  </div>
</template>
