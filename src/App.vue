<script setup lang="ts">
import { watchEffect } from 'vue'
import PokedexShell from './components/PokedexShell.vue'
import { usePokedexStore } from './stores/pokedex'
import './styles/pokedex.css'

const DEFAULT_TITLE = 'Pokédex Online – Search Pokémon by Name, Number or Generation'
const store = usePokedexStore()

// Tab title follows the Pokémon on screen, e.g. "Pikachu #0025 – Pokédex Online"
watchEffect(() => {
  const pokemon = store.entry?.pokemon
  if (!pokemon) {
    document.title = DEFAULT_TITLE
    return
  }
  const species = store.list.find((p) => p.id === pokemon.id)
  const name = species?.name ?? pokemon.name
  const label = name.charAt(0).toUpperCase() + name.slice(1)
  document.title = `${label} #${String(pokemon.id).padStart(4, '0')} – Pokédex Online`
})
</script>

<template>
  <main class="page">
    <PokedexShell />
  </main>
</template>
