<script setup>
import { WorldStageController, createMeshModifier } from '../silentplanet-three-app/make-these-libs/three-world-stage';
import { Globe } from '../silentplanet-three-app/Globe.js';
import configInstance from '../silentplanet-three-app/Config.js';
import { getGeoJsonData } from '../silentplanet-three-app/services/silentplanet-rust-geo/GeosService.js'
import { useThreePolysStore } from '../stores/polys.js'
import { onMounted, onBeforeUnmount, ref } from 'vue'

import config from '../assets/globe-settings.json'

let worldStage, globe, grids, meshModifier, threePolysStore, sphere
const resizeObserver = ref(null)

onMounted(async () => {
  await configInstance.initialize().catch(
    (error) => {
      console.error('Error initializing config:', error);
      throw error;
    }
  );

  worldStage = new WorldStageController('base-globe', configInstance)
  threePolysStore = useThreePolysStore()
  
  globe = new Globe(worldStage.model)
  sphere = globe.createSphere()
  worldStage.model.scene.add(sphere)

  grids = globe.createGrids()

  Object.values(grids).forEach(gridArray => {
    gridArray.forEach(line => {
      worldStage.model.scene.add(line)
    })
  })

  // @TODO anything added here has to be removed in onBeforeUnmount?
  worldStage.model.renderables.push(globe)

  let initialMeshes = []
  // @TODO this is a bit of a hack
  let childMeshIds = []

  // @TODO remove this
  let boobyMesh = { regionId: 1, visible: true, childMeshIds: [2, 3], hasChild: true }
  threePolysStore.addMesh(boobyMesh)
  worldStage.model.scene.add(boobyMesh)

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

    if (mesh.hasChild && mesh.regionId) {
      const childMeshes = await loadPertinentGeos(globe, mesh.regionId, false)

      for (const childMesh of childMeshes) {
        // @TODO nested for loop bad code smell

        if (!childMesh.regionId) {
          continue
        }
        worldStage.model.scene.add(childMesh)
        threePolysStore.addMesh(childMesh)
        childMeshIds.push(childMesh.regionId)
      }

      mesh.childMeshIds = childMeshIds
    }

    worldStage.model.scene.add(mesh)
    threePolysStore.addVisibleMesh(mesh)
  }

  meshModifier = createMeshModifier()

  worldStage.animate()

  setupEventListeners()
})

// @TODO this needs to be in polys.js?
async function loadPertinentGeos(globe, context = 1, visible = true) {
  const data = await getGeoJsonData(context).catch((error) => {
    console.error('Error loading globe data:', error);
    throw error;
  })

  if (!data || !data.geos) return // @TODO throw an error instead

  let meshes = []

  data.geos.forEach((geo) => {
    const result = globe.mapDataToGlobe(
      geo,
      visible,
      config
    )
    if (!result || !result.meshes) return

    meshes = meshes.concat(result.meshes)
  })

  return meshes;
}

// @TODO prevent memory leaks!
onBeforeUnmount(() => {
  window.removeEventListener('resize', worldStage.onWindowResize)
  window.removeEventListener('mousemove', handleRayEvent)
  window.removeEventListener('click', handleRayEvent)
  if (resizeObserver.value) {
    resizeObserver.value.disconnect()
  }
})

// @TODO update so that anything added here automatically gets removed by onBeforeUnmount as well
// @TODO there is a vue way to do this...
function setupEventListeners() {
  window.addEventListener('resize', () => worldStage.onWindowResize(), false)
  window.addEventListener('mousemove', (event) => worldStage.handleRayEvent(event, handleHoverEvent), false)
  window.addEventListener('click', (event) => worldStage.handleRayEvent(event, handleClickEvent), false)

  // @TODO add observer?
  // @TODO use const for id
  const baseGlobeDiv = document.getElementById('base-globe')
  if (baseGlobeDiv) {
    resizeObserver.value = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.target === baseGlobeDiv) {
          worldStage.onWindowResize()
        }
      }
    })
    resizeObserver.value.observe(baseGlobeDiv)
  }
}

function handleHoverEvent(hoveredRegion) {
  let threePolysStore = useThreePolysStore()

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
      meshModifier.setColour(hoveredRegion, 'selectedEventColour')
    } else {
      meshModifier.setColour(hoveredRegion, 'eventColour')
    }
  }

  if (
    threePolysStore?.hoveredMesh?.regionId &&
    (!hoveredRegion?.regionId ||
      hoveredRegion.regionId !== threePolysStore.hoveredMesh.regionId)
  ) {
    if (
      threePolysStore?.selectedMesh?.regionId &&
      threePolysStore.hoveredMesh.regionId == threePolysStore.selectedMesh.regionId
    ) {
      meshModifier.setColour(threePolysStore.hoveredMesh, 'selectedColour')
    } else {
      meshModifier.setColour(threePolysStore.hoveredMesh, 'defaultColour')
    }
  }

  threePolysStore.setHoveredMesh(hoveredRegion, () => {
    // do nothing for now
  })
}

function handleClickEvent(clickedRegion) {
  if (!clickedRegion || !clickedRegion.regionId) {
    return false
  }

  let threePolysStore = useThreePolysStore()
  meshModifier.setColour(clickedRegion, 'selectedEventColour')

  if (
    threePolysStore?.selectedMesh?.regionId &&
    (!clickedRegion?.regionId ||
      clickedRegion.regionId !== threePolysStore.selectedMesh.regionId)
  ) {
    meshModifier.setColour(threePolysStore.selectedMesh, 'defaultColour')
  }

  threePolysStore.drillTo(threePolysStore.selectedMesh.regionId || 0, clickedRegion.regionId)
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
