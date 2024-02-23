<script setup>

import { Scene } from '../helpers/Scene.js'
import { Globe } from '../helpers/Globe.js'
import { DataLoader } from '../helpers/DataLoader.js'
import { RayTracer } from '../helpers/RayTracer.js'
import { MeshModifier } from '../helpers/MeshModifier.js'
import { useThreePolysStore } from '../stores/polys.js'
// import { onMounted, onBeforeUnmount, ref, inject, watch } from 'vue'
import { onMounted, onBeforeUnmount, ref } from 'vue'

// import the CONFIG
// @TODO validate this
// @TODO this needs to be based on the user
// @TODO async await this too
import config from '../assets/globe-settings.json'

// @TODO Ensure that resources (like event listeners and Three.js objects) are properly cleaned up if your App instance is ever destroyed or replaced. This is crucial for avoiding memory leaks.
// @TODO consider separating the concerns here

let renderer, globe, hoverRayTracer, clickRayTracer, meshHandler, threePolysStore // Reference to the renderer, globe, and rayTracer
//const selectedRegion = inject('selectedRegion')
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

  // @TODO use a safe recursive function here?
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

    // @TODO bad code smell
    mesh.childMeshIds = childMeshIds
    // @TODO mutation possible here?

  }


  // @TODO what to do here cohesively? observer?
  renderer.scene.add(mesh)
  threePolysStore.addMesh(mesh);



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
// @TODO What are the implications of this??
// watch(threePolysStore, (newVal, oldVal) => {
//   console.log(`Region ID changed from ${oldVal} to ${newVal}`)
//   // Perform actions based on the new selectedRegion
//   // For example, update the globe or trigger other reactive changes
// })

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

  // @TODO add observer class for these?

  // HOVER
  window.addEventListener('mousemove', 
    (event) => 
      hoverRayTracer.handleRayEvent(event, (hoveredRegion) => {

        // @TODO a new one?
        let threePolysStore = useThreePolysStore();

        // @TODO is passing all these meshes around less efficient?

        // update the hovered one
        if (
          hoveredRegion?.regionId
          && (
            (!threePolysStore?.hoveredMesh?.regionId) 
            || (hoveredRegion.regionId !== threePolysStore.hoveredMesh.regionId)
          )
        ) {


          if (
            threePolysStore?.selectedMesh?.regionId
            && hoveredRegion?.regionId
            && (hoveredRegion.regionId == threePolysStore.selectedMesh.regionId)
          ) {
            meshHandler.setColour(hoveredRegion, 'selectedEventColour') // @TODO revisit this design of passing attribute names..
          } else {
            meshHandler.setColour(hoveredRegion, 'eventColour')
          }


        } 
        
        // reset the no-longer-hovered one
        if (
          threePolysStore?.hoveredMesh?.regionId
          && (
            (!hoveredRegion?.regionId) 
            || (hoveredRegion.regionId !== threePolysStore.hoveredMesh.regionId)
          )
        ) {



          if (
            threePolysStore?.selectedMesh?.regionId
            && (threePolysStore.hoveredMesh.regionId == threePolysStore.selectedMesh.regionId)
          ) {
            meshHandler.setColour(threePolysStore.hoveredMesh, 'selectedColour') // @TODO revisit this design of passing attribute names..
          } else {
            meshHandler.setColour(threePolysStore.hoveredMesh, 'defaultColour')
          }


        }

        // if (!hoveredRegion) {
        //   //meshHandler.resetIntersected()
        //   return
        // }

        threePolysStore.setHoveredMesh(hoveredRegion, () => {
          // do nothing for now
        })




      }), 
    false
  )

  // CLICK
  window.addEventListener(
    'click',
    (event) =>
      clickRayTracer.handleRayEvent(event, (selectedRegion) => {

        if (!selectedRegion || !selectedRegion.regionId) {
          return false; // do nothing
        }

        // @TODO a new one?
        let threePolysStore = useThreePolysStore();
        // @TODO combine these or reduce the need for both?
        //threePolysStore.setHoveredMesh(selectedRegion)
        meshHandler.setColour(selectedRegion, 'selectedEventColour')


        if (
            threePolysStore?.selectedMesh?.regionId
            && (
              (!selectedRegion?.regionId) 
              || (selectedRegion.regionId !== threePolysStore.selectedMesh.regionId)
            )
          ) {

            meshHandler.setColour(threePolysStore.selectedMesh, 'defaultColour')
          }

        threePolysStore.setSelectedMesh(selectedRegion, () => {

          // do nothing yet

        }) 
        threePolysStore.drillDown(selectedRegion.regionId) // @TODO confused concerns here? The store class is modifying the meshes

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
