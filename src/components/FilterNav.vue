<script setup>
import { inject, defineEmits, ref, watch } from 'vue'

// Selected Region Id
const regionId = inject('regionId')
const emit = defineEmits(['update-region-id'])
// @TODO bad code smell? value being copied?
const selectedValue = ref(regionId) // Initialize with the injected value
// Watch for changes in the selection and emit an event
watch(selectedValue, (newValue) => {
  emit('update-region-id', newValue)
})

// Region dropdown/filter options
const regionOptions = inject('regionOptions')




</script>

<template>
  <div id="filter-nav">
    <p class="content-message">Filter Nav region: {{ regionId }}</p>

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
