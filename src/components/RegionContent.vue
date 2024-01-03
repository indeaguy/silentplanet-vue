<script setup>
import { inject } from 'vue'

const polygonContent = inject('polygonContent')
</script>

<template>
  <div id="region-content">
    <p class="content-message">The value: {{ polygonContent }}</p>
  </div>
</template>

<style scoped>
.content-message {
  color: white;
}
</style>
