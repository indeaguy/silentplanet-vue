<script setup>
import { Scene } from '../helpers/Scene.js'
import { Globe } from '../helpers/Globe.js'
import { DataLoader } from '../helpers/DataLoader.js'
import { RayTracer } from '../helpers/RayTracer.js'
import { onMounted, onBeforeUnmount, ref, inject, watch } from 'vue'

// import the CONFIG
// @TODO validate this
// @TODO this needs to be based on the user
import config from '../assets/globe-settings.json'

// @TODO Ensure that resources (like event listeners and Three.js objects) are properly cleaned up if your App instance is ever destroyed or replaced. This is crucial for avoiding memory leaks.
// @TODO consider separating the concerns here

let renderer, globe, hoverRayTracer, clickRayTracer // Reference to the renderer, globe, and rayTracer
const regionId = inject('regionId')
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

  hoverRayTracer = new RayTracer(renderer, 0x00ff00, 0xFFC0CB)
  clickRayTracer = new RayTracer(renderer, 0x00ffff, 0xFFC000)
  renderer.addResizeObserver(hoverRayTracer)
  renderer.addResizeObserver(clickRayTracer)
  renderer.animate()

  setupEventListeners()
})


// Watch for changes in regionId
watch(regionId, (newRegionId, oldRegionId) => {
  console.log(`Region ID changed from ${oldRegionId} to ${newRegionId}`);
  // Perform actions based on the new regionId
  // For example, update the globe or trigger other reactive changes
});

// prevent memory leaks!
onBeforeUnmount(() => {
  window.removeEventListener('resize', renderer.onWindowResize)
  window.removeEventListener('mousemove', hoverRayTracer.handleRayEvent)
  window.removeEventListener('click', clickRayTracer.handleRayEvent)
  // Disconnect the ResizeObserver
  if (resizeObserver.value) {
    resizeObserver.value.disconnect()
  }

})


// @TODO update so that anything added here automatically gets removed by onBeforeUnmount as well
// @TODO there is a vue way to do this...
function setupEventListeners() {
  // @TODO just make thie click handler use the polygon from the mousemove handler
  window.addEventListener('resize', () => renderer.onWindowResize(), false)
  window.addEventListener('mousemove', (event) => hoverRayTracer.handleRayEvent(event), false)
  window.addEventListener('click', (event) => clickRayTracer.handleRayEvent(event, (regionId) => {setRegionId(regionId)}), false)

  // Set up ResizeObserver for the #base-globe div
  const baseGlobeDiv = document.getElementById('base-globe')
  if (baseGlobeDiv) {
    resizeObserver.value = new ResizeObserver(entries => {
      for (let entry of entries) {
        if (entry.target === baseGlobeDiv) {
          // Handle the resize event
          renderer.onWindowResize()
        }
      }
    })
    resizeObserver.value.observe(baseGlobeDiv)
  }
}


// @TODO clean this up
// @TODO make this type safe
// @TODO use region.id instead
function setRegionId(region) {
  if (region && region.name) {
    regionId.value = region.name;
  }
}

/**
 * When the user clicks on the globe
 *
 * @param {type} event - description of the event parameter
 * @return {type} no return value
 */
 function globeClick(event) {
  console.log(clickRayTracer);
  console.log(clickRayTracer.intersected);
  if (clickRayTracer.intersected && clickRayTracer.intersected.object) {
    regionId.value = clickRayTracer.intersected.object.name;
  } else {
    // Handle the case where no object is intersected
    console.log("No intersected object or object does not have a name property");
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
  <div @click="globeClick" id="base-globe"></div>
</template>
