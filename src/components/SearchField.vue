<script setup>
import { ref } from 'vue'
import { usePokedexStore } from '../stores/pokedex'

const store = usePokedexStore()
const query = ref('')

function onInput() {
  store.searchError = false
}

function submit() {
  store.search(query.value)
}
</script>

<template>
  <div class="search">
    <input
      v-model="query"
      class="search-input"
      type="text"
      placeholder="Search name or #id..."
      autocomplete="off"
      @input="onInput"
      @keydown.enter="submit"
    />
    <span v-if="store.searchError" class="search-error">NOT FOUND</span>
    <span v-else class="search-led" aria-hidden="true"></span>
  </div>
</template>
