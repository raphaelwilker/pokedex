<script setup>
import { usePokedexStore } from '../stores/pokedex'
import { GENERATIONS } from '../data/generations'

const store = usePokedexStore()
</script>

<template>
  <div class="gen-grid">
    <button
      v-for="g in GENERATIONS"
      :key="g.key"
      type="button"
      class="gen-btn"
      :class="{ active: store.generationKey === g.key }"
      @click="store.setGeneration(g.key)"
    >
      {{ g.label }}
    </button>
  </div>
</template>
