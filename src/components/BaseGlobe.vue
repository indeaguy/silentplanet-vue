<script setup>
import { Scene } from '../helpers/Scene.js'
import { Globe } from '../helpers/Globe.js'
import { DataLoader } from '../helpers/DataLoader.js'
import { RayTracer } from '../helpers/RayTracer.js'
import { MeshModifier } from '../helpers/MeshModifier.js'
import { useThreePolysStore } from '../stores/polys.js'
import { onMounted, onBeforeUnmount, ref } from 'vue'

// import the CONFIG
// @TODO validate this
// @TODO this needs to be based on the user
// @TODO async await this too
import config from '../assets/globe-settings.json'

// @TODO Ensure that resources (like event listeners and Three.js objects) are properly cleaned up if your App instance is ever destroyed or replaced. This is crucial for avoiding memory leaks.
// @TODO consider separating the concerns here

let renderer, globe, combinedRayTracer, meshHandler, threePolysStore, sphere // Reference to the renderer, globe, and rayTracer
//const selectedRegion = inject('selectedRegion')
const resizeObserver = ref(null) // Reference for the ResizeObserver

// @TODO render accessible non-threejs alternative as well/instead
// this makes sure the base-globe element is loaded in the dom first
// @TODO revisit whether I need to use aysnc for the arrow function here
onMounted(async () => {
  renderer = new Scene(config.CAMERA, config.SCENE, 'base-globe')
  globe = new Globe(config.SPHERE, renderer)
  threePolysStore = useThreePolysStore()
  sphere = globe.createSphere()
  renderer.scene.add(sphere)
  renderer.renderables.push(globe)

  let initialMeshes = []
  let childMeshIds = [] // I guess..

  // @TODO 10x maybe lets never do this
  // this adds the region of 'earth' to the heirarchy
  // the first mesh isn't a mesh!
  let boobyMesh = { regionId: 1, visible: true, childMeshIds: [2, 3], hasChild: true }
  threePolysStore.addMesh(boobyMesh)
  renderer.scene.add(boobyMesh) // I want thees to be the same thing..

  // @TODO use a safe recursive function here?
  // @TODO get this from redis or something similar
  // @TODO don't load these from scratch every time
  initialMeshes = await loadPertinentGeos(globe)

  // @TODO n+1 issue here. load them batches
  for (const mesh of initialMeshes) {
    if (!mesh.regionId) {
      continue
    }

    childMeshIds = []

    // @TODO this stuff is bound to be repeated..
    if (mesh.hasChild && mesh.regionId) {
      const childMeshes = await loadPertinentGeos(globe, mesh.regionId, false)

      for (const childMesh of childMeshes) {
        // @TODO nested for loop bad code smell

        if (!childMesh.regionId) {
          continue
        }
        renderer.scene.add(childMesh)
        threePolysStore.addMesh(childMesh)
        childMeshIds.push(childMesh.regionId)
      }

      mesh.childMeshIds = childMeshIds
    }

    // @TODO what to do here cohesively? observer?
    renderer.scene.add(mesh)
    // @TODO yucky.
    threePolysStore.addVisibleMesh(mesh)
  }
  

  meshHandler = new MeshModifier()
  //hoverRayTracer = new RayTracer(renderer, meshHandler)
  //clickRayTracer = new RayTracer(renderer, meshHandler)
  combinedRayTracer = new RayTracer(renderer, meshHandler)

  //renderer.addResizeObserver(hoverRayTracer)
  //renderer.addResizeObserver(clickRayTracer)
  renderer.addResizeObserver(combinedRayTracer)
  renderer.animate()

  setupEventListeners()
})

// @TODO this needs to be in polys.js?
async function loadPertinentGeos(globe, context = 1, visible = true) {
  const loader = await new DataLoader(context)

  // @TODO this is asyncronous Ensure that the rest of your application can handle the case where this data is not yet available, especially if other components depend on it.
  //try {
  const data = await loader.loadData()

  if (!data || !data.geos) return // @TODO throw an error instead

  let meshes = []

  data.geos.forEach((geo) => {
    const result = globe.mapDataToSphere(
      geo,
      visible, // make it visible/hidden
      config
    )
    if (!result || !result.meshes) return

    meshes = meshes.concat(result.meshes)
  })

  // @TODO don't do this here
  //meshes.forEach((mesh) => renderer.scene.add(mesh))

  return meshes
  // } catch (error) {
  //   console.error('Error loading globe data:', error)
  //   throw error // rethrow the error for caller to handle
  // }
}

// This function will recursively load all child geos for the given mesh to the given depth or until there are no child geos
//async function loadPertinentGeosToDepth(globe, startRegionMesh = null, startRegionId = 0, targetDepth = 1, targetChildren = []) {

// load the children of the startRegionId

// check if we reached the depth limit and if so stop

// check if we have the smallest child and if so stop

//

//}

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
  window.removeEventListener('mousemove', combinedRayTracer.handleRayEvent)
  window.removeEventListener('click', combinedRayTracer.handleRayEvent)
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
  window.addEventListener(
    'mousemove',
    (event) =>
      combinedRayTracer.handleRayEvent(event, (hoveredRegion) => {
        // @TODO a new one?
        let threePolysStore = useThreePolysStore()

        // @TODO is passing all these meshes around less efficient?

        // update the hovered one
        if (
          hoveredRegion?.regionId &&
          (!threePolysStore?.hoveredMesh?.regionId ||
            hoveredRegion.regionId !== threePolysStore.hoveredMesh.regionId)
        ) {
          if (
            threePolysStore?.selectedMesh?.regionId &&
            hoveredRegion?.regionId &&
            hoveredRegion.regionId == threePolysStore.selectedMesh.regionId
          ) {
            meshHandler.setColour(hoveredRegion, 'selectedEventColour') // @TODO revisit this design of passing attribute names..
          } else {
            meshHandler.setColour(hoveredRegion, 'eventColour')
          }
        }

        // reset the no-longer-hovered one
        if (
          threePolysStore?.hoveredMesh?.regionId &&
          (!hoveredRegion?.regionId ||
            hoveredRegion.regionId !== threePolysStore.hoveredMesh.regionId)
        ) {
          if (
            threePolysStore?.selectedMesh?.regionId &&
            threePolysStore.hoveredMesh.regionId == threePolysStore.selectedMesh.regionId
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
      combinedRayTracer.handleRayEvent(event, (clickedRegion) => {
        if (!clickedRegion || !clickedRegion.regionId) {
          return false // do nothing
        }

        // @TODO a new one?
        let threePolysStore = useThreePolysStore()
        // @TODO combine these or reduce the need for both?
        //threePolysStore.setHoveredMesh(clickedRegion)
        // @TODO don't do this here?
        meshHandler.setColour(clickedRegion, 'selectedEventColour')

        // reset the no-longer-selected one
        if (
          threePolysStore?.selectedMesh?.regionId &&
          (!clickedRegion?.regionId ||
            clickedRegion.regionId !== threePolysStore.selectedMesh.regionId)
        ) {
          meshHandler.setColour(threePolysStore.selectedMesh, 'defaultColour')
        }

        // @TODO play a reel while loading
        // load the selected region's content

        // @TODO maybe they don't want to close the others?
        // only do this if the selected region is not a direct parent or a direct child of the previously selected region
        threePolysStore.drillTo(threePolysStore.selectedMesh.regionId || 0, clickedRegion.regionId)

        // @TODO if it's a direct parent, drillUp to the selected region

        // if it's a direct child, drillDown to the selected region
        // @TODO this is slightly more performative but only works if the clicked region is a direct child
        //threePolysStore.drillDown(clickedRegion.regionId)

        // @TODO confused concerns here? The store class is modifying the meshes
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
