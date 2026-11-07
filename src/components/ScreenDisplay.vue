<script setup>
import { computed } from 'vue'
import { usePokedexStore } from '../stores/pokedex'

const store = usePokedexStore()
const number = computed(() => `NO. ${String(store.currentId).padStart(4, '0')}`)
const sprite = computed(() => store.entry?.pokemon?.sprite ?? null)
</script>

<template>
  <div class="screen-wrap">
    <div class="screen">
      <div class="lcd">
        <span v-if="store.status === 'loading'" class="lcd-loading">LOADING...</span>
        <img v-else-if="sprite" :src="sprite" :alt="store.entry.pokemon.name" class="sprite" />
      </div>
    </div>
    <div class="number-lcd">{{ number }}</div>
  </div>
</template>
