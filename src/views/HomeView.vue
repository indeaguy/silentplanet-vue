<script setup>
import FilterNav from '../components/FilterNav.vue'
import RegionContent from '../components/RegionContent.vue'
import BaseGlobe from '../components/BaseGlobe.vue'
import { useThreePolysStore } from '../stores/polys.js'
import { computed, provide, ref, onMounted, watch } from 'vue'
import DataDisplay from '@/components/modals/DataDisplay.vue'
import { useUserStore } from '../stores/user'

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

// Get reference to worldStage from BaseGlobe
const globeRef = ref(null)
const worldStage = ref(null)

// Watch for globe initialization
watch(() => globeRef.value?.globe, (newGlobe) => {
  console.log('Globe updated:', newGlobe)
  if (newGlobe) {
    worldStage.value = newGlobe
  }
}, { immediate: true })

// Debug mounted hook
onMounted(() => {
  console.log('HomeView mounted, globe ref:', globeRef.value)
})

// Add this one new function for DataDisplay
const getCameraData = () => {
  return worldStage.value?.getCameraData()
}

// Add this function for the new DataDisplay
const getUserStoreData = () => {
  const userStore = useUserStore()
  return {
    phraseHistory: {
      entries: userStore.phraseHistory.entries,
      phrases: userStore.phraseHistory.phrases,
      customPhrases: Object.fromEntries(
        Object.entries(userStore.phraseHistory.customPhrases).map(([key, set]) => [
          key, 
          Array.from(set)
        ])
      ),
      cursorPosition: userStore.phraseHistory.cursorPosition,
      selectedPhrase: userStore.selectedPhrase
    },
    user: userStore.user,
    error: userStore.error
  }
}
</script>

<template>
  <div class="home-view">
    <div class="header-extension">
      <div class="header-space"></div>
      <FilterNav />
    </div>
    <div id="world-container">
      <BaseGlobe 
        ref="globeRef"
        @update-region-id="setSelectedRegion" />
    </div>
    <div class="region-content-wrapper">
      <RegionContent />
    </div>
    <div class="data-displays">
      <DataDisplay 
        v-if="worldStage"
        :data-source="getCameraData"
        :use-matrix-style="true"
        :custom-styles="{ bottom: '10px' }"
      />
      <DataDisplay 
        :data-source="getUserStoreData"
        :use-matrix-style="true"
        :custom-styles="{ 
          bottom: '10px', 
          right: '150px',
          width: '100px', 
          color: '#00ffff',
          textShadow: '0 0 3px #00ffff',
          border: '1px solid rgba(0, 255, 255, 0.2)'
        }"
      />
    </div>
  </div>
</template>

<style scoped>
.home-view {
  width: 100vw;
  height: 100vh;
  position: relative;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background: rgb(var(--color-background-rgb));
}

.header-extension {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 100;
  background: rgba(var(--color-background-rgb), 20);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.header-space {
  height: 3rem;
}

#world-container {
  position: fixed;
  top: 5rem;
  left: 0;
  width: 100vw;
  height: calc(100vh - 4rem);
  z-index: 1;
}

.region-content-wrapper {
  position: fixed;
  top: 8rem;
  right: 1rem;
  z-index: 101;
  max-width: 400px;
}

:deep(#world-container > *) {
  width: 100%;
  height: 100%;
}

.data-displays {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 101;
  pointer-events: none;
}

.data-displays :deep(*) {
  pointer-events: auto;
}
</style>
