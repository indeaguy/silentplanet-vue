<script setup>
import FilterNav from '../components/FilterNav.vue'
import RegionContent from '../components/RegionContent.vue'
import BaseGlobe from '../components/BaseGlobe.vue'
import { useThreePolysStore } from '../stores/polys.js'
import { computed, provide } from 'vue'

//const selectedRegion = ref('')
const threePolysStore = useThreePolysStore()
provide(
  'selectedRegion',
  computed(() => threePolysStore.selectedMesh)
) // @TODO what is vue computed?
//provide('selectedRegion', selectedRegion)

// @TODO get the geotree from a backend source
const regionOptions = {
  regions: [
    {
      id: 1,
      name: 'Elysium',
      children: [
        {
          id: 101,
          name: 'Elysium Jr.'
        },
        {
          id: 102,
          name: 'Elysium Sr.'
        }
      ]
    },
    {
      id: 2,
      name: 'Not Elysium',
      children: []
    }
  ]
}
provide('regionOptions', regionOptions)

// Event handler for the 'update-region-id' emit
const setSelectedRegion = (newRegion) => {
  threePolysStore.setSelectedMeshByRegionId(newRegion)
}
</script>

<template>
  <main>
    <RegionContent />
    <div id="world-container">
      <FilterNav />
      <BaseGlobe @update-region-id="setSelectedRegion" />
    </div>
  </main>
</template>

<style scoped>
#world-container {
  color: white;
}
</style>
