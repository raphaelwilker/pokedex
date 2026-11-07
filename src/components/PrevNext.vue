<script setup>
import { usePokedexStore } from '../stores/pokedex'

const store = usePokedexStore()
</script>

<template>
  <div class="prev-next">
    <button type="button" class="pn-btn" :disabled="!store.canPrev" @click="store.prev()">◀ PREV</button>
    <button type="button" class="pn-btn" :disabled="!store.canNext" @click="store.next()">NEXT ▶</button>
  </div>
</template>
