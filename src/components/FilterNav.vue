<script setup>
import { inject, defineEmits, ref, watch } from 'vue'

// Selected Region Id
const selectedRegion = inject('selectedRegion')
//const regionOptions = inject('regionOptions')
const emit = defineEmits(['update-region-id'])
// @TODO bad code smell? value being copied?
const selectedValue = ref(selectedRegion) // Initialize with the injected value
// Watch for changes in the selection and emit an event

// @TODO Don't need this watch, it's being handled be the reference
watch(selectedValue, (newValue) => {
  emit('update-region-id', newValue)
})

// @TODO add validation for the existence of selectedRegion.name
</script>

<template>
  <div id="filter-nav">
    <p class="content-message">Filter Nav region: {{ selectedRegion.name }}</p>

    <select v-model="selectedValue">
      <option value="Elysium">Elysium</option>
      <option value="Not Elysium">Not Elysium</option>
    </select>
  </div>
</template>

<style scoped>
.content-message {
  color: white;
}
</style>
