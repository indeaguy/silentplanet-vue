<script setup>
import { SilentPlanetThree } from '@/silentplanet-three-app';
import { useThreePolysStore } from '../stores/polys.js'
import { onMounted, onBeforeUnmount, ref } from 'vue'

let globe, threePolysStore
const resizeObserver = ref(null)

onMounted(async () => {

  // STORE ADAPTER! ThreePolysStore is the only thing that the SilentPlanetThreeApp needs of Vue.
  threePolysStore = useThreePolysStore()
  globe = new SilentPlanetThree('base-globe', threePolysStore)
  await globe.initialize()

  setupEventListeners()
})

// @TODO prevent memory leaks!
onBeforeUnmount(() => {
  window.removeEventListener('resize', globe.worldStage.onWindowResize)
  window.removeEventListener('mousemove', globe.worldStage.handleRayEvent)
  window.removeEventListener('click', globe.worldStage.handleRayEvent)
  if (resizeObserver.value) {
    resizeObserver.value.disconnect()
  }
})

// @TODO update so that anything added here automatically gets removed by onBeforeUnmount as well
// @TODO there is a vue way to do this...
function setupEventListeners() {
  window.addEventListener('resize', () => globe.worldStage.onWindowResize(), false)
  window.addEventListener('mousemove', (event) => globe.worldStage.handleRayEvent(event, globe.handleHoverEvent), false)
  window.addEventListener('click', (event) => globe.worldStage.handleRayEvent(event, globe.handleClickEvent), false)

  // @TODO add observer?
  // @TODO use const for id
  const baseGlobeDiv = document.getElementById('base-globe')
  if (baseGlobeDiv) {
    resizeObserver.value = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.target === baseGlobeDiv) {
          globe.worldStage.onWindowResize()
        }
      }
    })
    resizeObserver.value.observe(baseGlobeDiv)
  }
}
</script>

<style scoped>
#base-globe {
  width: 100%;
  height: 100vh;
  max-height: 100vh;
}
</style>

<template>
  <div id="base-globe"></div>
</template>
