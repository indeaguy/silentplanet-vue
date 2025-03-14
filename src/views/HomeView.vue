<script setup>
import FilterNav from '../components/FilterNav/FilterNav.vue'
import RegionContent from '../components/RegionContent.vue'
import BaseGlobe from '../components/BaseGlobe.vue'
import { useThreePolysStore } from '../stores/polys.js'
import { computed, ref, onMounted, watch } from 'vue'
import DataDisplay from '@/components/modals/DataDisplay.vue'
import { useUserStore } from '../stores/user'
import { useNavStore } from '../stores/nav'

const threePolysStore = useThreePolysStore()

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

// Update getUserStoreData to only include user-specific data
const getUserStoreData = () => {
  const userStore = useUserStore()
  return {
    user: userStore.user,
    error: userStore.error
  }
}

// Add new function for nav store data
const getNavStoreData = () => {
  const navStore = useNavStore()
  return {
    phraseHistory: {
      entries: navStore.phraseHistory.entries,
      phrases: navStore.phraseHistory.phrases,
      customPhrases: Object.fromEntries(
        Object.entries(navStore.phraseHistory.customPhrases).map(([key, set]) => [
          key, 
          Array.from(set)
        ])
      ),
      cursorPosition: navStore.phraseHistory.cursorPosition,
      selectedPhrase: navStore.selectedPhrase,
      currentInput: navStore.phraseHistory.currentInput
    }
  }
}
</script>

<template>
  <div class="home-view">
    <div class="header-extension">
      <div class="header-space"></div>
      <FilterNav @update-region-id="setSelectedRegion" />
    </div>
    <div id="world-container">
      <BaseGlobe 
        ref="globeRef"
        @update-region-id="setSelectedRegion" />
    </div>
    <div class="region-content-wrapper">
      <RegionContent @update-region="setSelectedRegion" />
    </div>
    <div class="data-displays">
      <DataDisplay 
        v-if="worldStage"
        :data-source="getCameraData"
        :use-matrix-style="true"
        :custom-styles="{ bottom: '10px' }"
      />
      <DataDisplay 
        :data-source="getNavStoreData"
        :use-matrix-style="true"
        :custom-styles="{ 
          bottom: '10px', 
          right: '150px',
          width: '100px', 
          color: '#ffa500',
          textShadow: '0 0 3px #ffa500',
          border: '1px solid rgba(255, 165, 0, 0.2)'
        }"
      />
      <DataDisplay 
        :data-source="getUserStoreData"
        :use-matrix-style="true"
        :custom-styles="{ 
          bottom: '10px', 
          right: '290px',
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
