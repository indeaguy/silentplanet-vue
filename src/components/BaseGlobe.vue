<script setup>
import { Scene } from '../helpers/Scene.js'
import { Globe } from '../helpers/Globe.js'
import { DataLoader } from '../helpers/DataLoader.js'
import { RayTracer } from '../helpers/RayTracer.js'
import { onMounted, onBeforeUnmount, ref, inject } from 'vue'

// import the CONFIG
// @TODO validate this
import config from '../assets/globe-settings.json'

// @TODO Ensure that resources (like event listeners and Three.js objects) are properly cleaned up if your App instance is ever destroyed or replaced. This is crucial for avoiding memory leaks.
// @TODO consider separating the concerns here

let renderer, globe, rayTracer
const polygonContent = inject('polygonContent')
const resizeObserver = ref(null) // Reference for the ResizeObserver

// @TODO render accessible non-threejs alternative as well/instead
// this makes sure the base-globe element is loaded in the dom first
onMounted(() => {
  renderer = new Scene(config.CAMERA, config.SCENE, 'base-globe')
  globe = new Globe(config.SPHERE, renderer)
  globe.createSphere()
  renderer.renderables.push(globe)

  // @TODO get this from redis or something similar
  const loader = new DataLoader('geojson/usa.geojson')

  // @TODO this is asyncronous Ensure that the rest of your application can handle the case where this data is not yet available, especially if other components depend on it.
  loader
    .loadData()
    .then((data) => {
      const result = globe.mapDataToSphere(
        data,
        config.SPHERE.RADIUS,
        parseInt(config.POLYGONS.COLOR, 16),
        config.POLYGONS.RISE,
        config.POLYGONS.SUBDIVIDE_DEPTH,
        config.POLYGONS.MIN_EDGE_LENGTH
      )
      result.meshes.forEach((mesh) => renderer.scene.add(mesh))
    })
    .catch((error) => {
      console.error('Error loading globe data:', error)
    })

  rayTracer = new RayTracer(renderer)
  renderer.addResizeObserver(rayTracer)
  renderer.animate()

  setupEventListeners()
})

// @TODO update so that anything added here automatically gets removed by onBeforeUnmount as well
// @TODO there is a vue way to do this...
function setupEventListeners() {
  window.addEventListener('resize', () => renderer.onWindowResize(), false)
  window.addEventListener('mousemove', (event) => rayTracer.handleRayEvent(event), false)

  // Set up ResizeObserver for the #base-globe div
  const baseGlobeDiv = document.getElementById('base-globe')
  if (baseGlobeDiv) {
    console.log('wambo');
    resizeObserver.value = new ResizeObserver(entries => {
      for (let entry of entries) {
        if (entry.target === baseGlobeDiv) {
          console.log('bambo');
          // Handle the resize event
          renderer.onWindowResize()
        }
      }
    })
    resizeObserver.value.observe(baseGlobeDiv)
  }
}

// prevent memory leaks!
onBeforeUnmount(() => {
  window.removeEventListener('resize', renderer.onWindowResize)
  window.removeEventListener('mousemove', rayTracer.handleRayEvent)
  // Disconnect the ResizeObserver
  if (resizeObserver.value) {
    resizeObserver.value.disconnect()
  }

})

/**
 * When the user clicks on the globe
 *
 * @param {type} event - description of the event parameter
 * @return {type} no return value
 */
function globeClick(event) {
  polygonContent.value = 'anything'
}
</script>

<style scoped>
#base-globe {
  width: 100%;
  height: 100%;
}
</style>

<template>
  <div @click="globeClick" id="base-globe"></div>
</template>
