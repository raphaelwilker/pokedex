<script setup lang="ts">
import { computed } from 'vue'
import { usePokedexStore } from '../stores/pokedex'

const store = usePokedexStore()
const pokemon = computed(() => store.entry?.pokemon)
const types = computed(() => (pokemon.value ? pokemon.value.types.join(' / ').toUpperCase() : '---'))
const dimensions = computed(() =>
  pokemon.value ? `HT ${pokemon.value.heightM}M | WT ${pokemon.value.weightKg}KG` : '---'
)
</script>

<template>
  <div class="info">
    <div class="info-row">
      <div class="lcd-box">
        <span class="lcd-label">TYPE</span>
        <span class="lcd-value">{{ types }}</span>
      </div>
      <div class="lcd-box">
        <span class="lcd-label">DIMENSIONS</span>
        <span class="lcd-value">{{ dimensions }}</span>
      </div>
    </div>
    <div class="tags">
      <div class="gen-tag">GENERATION {{ store.currentGeneration }}</div>
      <div v-if="store.currentRegion" class="gen-tag region-tag">REGION {{ store.currentRegion.toUpperCase() }}</div>
    </div>
  </div>
</template>
