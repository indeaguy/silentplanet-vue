<script setup>
import { useThreePolysStore } from '../stores/polys'
import { computed } from 'vue'

const store = useThreePolysStore()
const selectedRegion = computed(() => store.selectedMesh)

const emit = defineEmits(['update-region'])

// Example future method that would need to update the store
const handleRegionUpdate = (newData) => {
  emit('update-region', newData)
}
</script>

<template>
  <div id="region-content">
    <p class="content-message">Selected Region Content value: {{ selectedRegion?.name }}</p>
    <!-- Future interactive elements would go here -->
  </div>
</template>

<style scoped>
.content-message {
  color: white;
}
</style>
