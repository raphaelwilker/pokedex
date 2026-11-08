<script setup lang="ts">
import { computed } from 'vue'
import { usePokedexStore } from '../stores/pokedex'

const store = usePokedexStore()
const name = computed(() => {
  const pokemon = store.entry?.pokemon
  if (!pokemon) return 'LOADING...'
  const species = store.list.find((p) => p.id === pokemon.id)
  return (species?.name ?? pokemon.name).toUpperCase()
})
// not reactive on its own: it is read again every time the error state renders
function isOffline(): boolean {
  return navigator.onLine === false
}

const text = computed(() => {
  if (!store.entry) return 'LOADING...'
  return store.entry.text ? store.entry.text.toUpperCase() : 'NO DATA'
})
</script>

<template>
  <div class="entry">
    <span class="entry-label">ENTRY</span>
    <h1 class="entry-name">{{ name }}</h1>
    <div class="terminal">
      <template v-if="store.status === 'error'">
        <p>ERROR: COULD NOT LOAD DATA.</p>
        <p v-if="isOffline()">YOU ARE OFFLINE.</p>
        <button type="button" class="retry" @click="store.retry()">tentar de novo</button>
      </template>
      <p v-else>{{ text }}</p>
    </div>
  </div>
</template>
