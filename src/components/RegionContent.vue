<script setup>
import { inject } from 'vue'

const selectedRegion = inject('selectedRegion')

// @TODO add validation for the existence of selectedRegion.name
</script>

<template>
  <div id="region-content">
    <p class="content-message">Selected Region Content value: {{ selectedRegion.name }}</p>
  </div>
</template>

<style scoped>
.content-message {
  color: white;
}
</style>
