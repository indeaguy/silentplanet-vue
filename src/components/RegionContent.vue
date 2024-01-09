<script setup>
import { inject } from 'vue'

const regionId = inject('regionId')
</script>

<template>
  <div id="region-content">
    <p class="content-message">Selected Region Content value: {{ regionId }}</p>
  </div>
</template>

<style scoped>
.content-message {
  color: white;
}
</style>
