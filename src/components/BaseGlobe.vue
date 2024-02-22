<script setup>

import { Scene } from '../helpers/Scene.js'
import { Globe } from '../helpers/Globe.js'
import { DataLoader } from '../helpers/DataLoader.js'
import { RayTracer } from '../helpers/RayTracer.js'
import { MeshModifier } from '../helpers/MeshModifier.js'
import { useThreePolysStore } from '../stores/polys.js'
import { onMounted, onBeforeUnmount, ref, inject, watch } from 'vue'

// import the CONFIG
// @TODO validate this
// @TODO this needs to be based on the user
import config from '../assets/globe-settings.json'

// @TODO Ensure that resources (like event listeners and Three.js objects) are properly cleaned up if your App instance is ever destroyed or replaced. This is crucial for avoiding memory leaks.
// @TODO consider separating the concerns here

let renderer, globe, hoverRayTracer, clickRayTracer, meshHandler, threePolysStore // Reference to the renderer, globe, and rayTracer
const selectedRegion = inject('selectedRegion')
const resizeObserver = ref(null) // Reference for the ResizeObserver

// @TODO render accessible non-threejs alternative as well/instead
// this makes sure the base-globe element is loaded in the dom first
// @TODO revisit whether I need to use aysnc for the arrow function here
onMounted(async () => {
  renderer = new Scene(config.CAMERA, config.SCENE, 'base-globe')
  globe = new Globe(config.SPHERE, renderer)
  threePolysStore = useThreePolysStore();
  globe.createSphere()
  renderer.renderables.push(globe)

  let initialMeshes = []
  let childMeshIds = [] // I guess..

  // @TODO use a safe recursive function here..
  // @TODO get this from redis or something similar
  initialMeshes = await loadPertinentGeos(globe, renderer);
  
  for (const mesh of initialMeshes) {

    if (!mesh.regionId) {
      continue
    }

    childMeshIds = [] // @TODO bad code smell

    // @TODO this stuff is bound to be repeated..
    if (mesh.hasChild && mesh.regionId) {

    const childMeshes = await loadPertinentGeos(globe, renderer, mesh.regionId);

    for (const childMesh of childMeshes) { // @TODO nested for loop bad code smell

      if (!childMesh.regionId) {
        continue
      }
      childMesh.visible = false
      renderer.scene.add(childMesh)
      threePolysStore.addMesh(childMesh);
      childMeshIds.push(childMesh.regionId)
    }

    mesh.childMeshIds = childMeshIds
    // @TODO mutation possible here?

  }


  renderer.scene.add(mesh)
  threePolysStore.addSelectedMesh(mesh);



      // Do something with childMeshes
  }

  meshHandler = new MeshModifier()
  hoverRayTracer = new RayTracer(renderer, meshHandler)
  clickRayTracer = new RayTracer(renderer, meshHandler)

  renderer.addResizeObserver(hoverRayTracer)
  renderer.addResizeObserver(clickRayTracer)
  renderer.animate()

  setupEventListeners()
})

async function loadPertinentGeos(globe, renderer, context = '') {

  console.log(`geojson/geos${context}.json`)
  
  const loader = await new DataLoader(`geojson/geos${context}.json`)

  // @TODO this is asyncronous Ensure that the rest of your application can handle the case where this data is not yet available, especially if other components depend on it.
  try {
      const data = await loader.loadData();

      if (!data || !data.geos) return // @TODO throw an error instead

      let meshes = [];

      data.geos.forEach((geo) => {
        const result = globe.mapDataToSphere(
          geo,
          config.SPHERE.RADIUS,
          parseInt(config.POLYGONS.COLOR, 16),
          config.POLYGONS.RISE,
          config.POLYGONS.SUBDIVIDE_DEPTH,
          config.POLYGONS.MIN_EDGE_LENGTH,
          // false // make it invisible
        )
        if (!result || !result.meshes) return

        meshes = meshes.concat(result.meshes)
      });

      // @TODO don't do this here
      //meshes.forEach((mesh) => renderer.scene.add(mesh))

      return meshes;
      
    } catch (error) {
      console.error('Error loading globe data:', error);
      throw error; // rethrow the error for caller to handle
    }
  
}

// Watch for changes in selectedRegion
watch(selectedRegion, (newVal, oldVal) => {
  console.log(`Region ID changed from ${oldVal} to ${newVal}`)
  // Perform actions based on the new selectedRegion
  // For example, update the globe or trigger other reactive changes
})

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

  // @TODO move this over to mesh modifier
  window.addEventListener(
    'click',
    (event) =>
      clickRayTracer.handleRayEvent(event, (selectedRegion) => {

        let threePolysStore = useThreePolysStore();
        setSelectedRegion(selectedRegion) // @TODO do this only in the store?

        if (selectedRegion && selectedRegion.regionId) {
          threePolysStore.drillDown(selectedRegion.regionId)
        }

        // if (selectedRegion && selectedRegion.name) {
        //   console.log(selectedRegion.name + ' is selected')
        // }
        
        // if (selectedRegion && selectedRegion.regionId) {
        //   console.log(selectedRegion.regionId + ' is selected')
        // }

        // if (selectedRegion && selectedRegion.hasChild) {
        //   console.log(selectedRegion.name + ' ha children')
          
        // } else {
        //   console.log(' has no children')
        // }
      }),
    false
  )

  // Set up ResizeObserver for the #base-globe div
  const baseGlobeDiv = document.getElementById('base-globe')
  if (baseGlobeDiv) {
    resizeObserver.value = new ResizeObserver((entries) => {
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
function setSelectedRegion(region) {
  // @TODO add this business logic to ORM instead
  if (region && region.name) {
    //region must have a name
    // @TODO investigate how this vue 3 'reactive manor' of syntax is better
    selectedRegion.value = { ...region }
    console.log('Selected Region: ' + region.name)
  }
}

/**
 * When the user clicks on the globe
 *
 * @return {type} no return value
 */
// function globeClick() {
//   console.log(clickRayTracer)
//   //console.log(clickRayTracer.intersected)
//   if (clickRayTracer.intersected && clickRayTracer.intersected.object) {
//     setSelectedRegion(clickRayTracer.intersected.object)
//   } else {
//     // Handle the case where no object is intersected
//     console.log('No intersected object or object does not have a name property')
//   }
// }
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
