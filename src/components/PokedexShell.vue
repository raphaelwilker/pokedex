<script setup>
import ScreenDisplay from './ScreenDisplay.vue'
import EntryText from './EntryText.vue'
import GenerationPicker from './GenerationPicker.vue'
import PrevNext from './PrevNext.vue'
import InfoPanel from './InfoPanel.vue'
import SearchField from './SearchField.vue'
</script>

<template>
  <div class="device">
    <section class="half left">
      <div class="top-lights">
        <div class="lens"><span class="lens-glint"></span></div>
        <span class="led red"></span>
        <span class="led yellow"></span>
        <span class="led green"></span>
      </div>
      <ScreenDisplay />
    </section>
    <div class="hinge"></div>
    <section class="half right">
      <EntryText />
      <GenerationPicker />
      <PrevNext />
      <InfoPanel />
      <SearchField />
    </section>
  </div>
</template>
