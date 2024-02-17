<script setup>
// @TODO 6490556acd192949fea5d02297b4594c574c5079

/** 
    Component Cleanup and Memory Management:
        Ensure all event listeners and Three.js objects are properly disposed of in onBeforeUnmount. This is crucial to prevent memory leaks.
        Consider creating a cleanup function for Three.js objects. This function should dispose of geometries, materials, textures, and anything else that consumes memory.

    Asynchronous Data Loading:
        Handle the asynchronous nature of data loading more robustly. Consider using Vue's reactive system to update the globe when the data is ready.
        You might want to show a loading indicator while the data is being fetched and processed.

    Separation of Concerns:
        The component is doing a lot. Consider breaking it down into smaller, more focused components or use Vue's Composition API to organize code into composable functions.
        For instance, data loading, event handling, and Three.js rendering logic could be separated.

    Vue-specific Enhancements:
        Instead of directly manipulating the DOM (like adding event listeners to window), consider using Vue's built-in directives and lifecycle hooks.
        For the ResizeObserver, you can use Vue's reactivity system to react to changes in the size of the element.

    Type Safety and Code Cleanliness:
        If you're using TypeScript, ensure your functions and variables are properly typed.
        Regularly refactor your code to keep it clean and maintainable. Commented TODOs are good, but they should be addressed as soon as possible.

    Accessibility:
        You mentioned rendering an accessible non-Three.js alternative. This is important for users who rely on screen readers or can't interact with a canvas element. Consider providing a textual representation of the data.

    Styling and Responsiveness:
        Your CSS ensures the globe takes the full height of the viewport, which is good. Make sure it also responds well to different screen sizes and orientations.

    Error Handling:
        Improve error handling, especially for the data loading part. Consider how errors should be communicated to the user.

    Performance Optimization:
        Monitor the performance, especially if you're handling complex geometries or large datasets. Use tools like Chrome's Performance tab to identify bottlenecks.

    Documentation:
        Enhance your code comments to explain why certain things are done, not just what is being done. This is especially helpful for complex sections of your code.

    Event Handling:
        Refine your event handling logic. For instance, the click handler could be more integrated with Vue's reactivity system.

By addressing these points, your BaseGlobe component will be more efficient, maintainable, and robust. Remember, web development best practices evolve, so it's always good to stay updated with the latest Vue and JavaScript features and conventions.

use debounce with clicks?

ex. <template>
  <div @click="debouncedGlobeClick" id="base-globe"></div>
</template>
import { debounce } from 'lodash';

// Inside your setup function or script setup
const debouncedGlobeClick = debounce(() => {
  // ... your logic
}, 250);


Component Cleanup and Memory Management

    Implement a cleanup function in onBeforeUnmount that disposes of Three.js objects such as geometries, materials, textures, etc. This is critical to prevent memory leaks.

Asynchronous Data Loading

    Utilize Vue's reactivity system to handle the asynchronous nature of data loading. This would allow the globe to update reactively when the data is ready.
    Consider showing a loading indicator while data is being fetched and processed.

Separation of Concerns

    The component is indeed handling multiple responsibilities. You should consider breaking it down into smaller components or using Vue's Composition API to organize the code into composable functions.
    Specifically, separate the data loading, event handling, and Three.js rendering logic.

Vue-specific Enhancements

    Replace direct DOM manipulations with Vue's built-in directives and lifecycle hooks.
    For handling resize events, leverage Vue's reactivity system instead of directly using ResizeObserver.

Type Safety and Code Cleanliness

    If using TypeScript, ensure proper typing for functions and variables.
    Address TODO comments regularly to keep the codebase clean and maintainable.

Accessibility

    Providing a non-Three.js alternative for accessibility is important. Consider a textual representation of the data for screen reader users.

Styling and Responsiveness

    Ensure responsive design for different screen sizes and orientations, in addition to the existing viewport height management.

Error Handling

    Improve error handling in data loading and communicate errors effectively to the user.

Performance Optimization

    Regularly monitor performance, especially for handling complex geometries or large datasets. Tools like Chrome's Performance tab can be useful for identifying bottlenecks.

Documentation

    Enhance comments to explain the reasoning behind code decisions, especially in complex sections.

Event Handling

    Integrate event handling more with Vue's reactivity system. For instance, debouncing click events can be beneficial, as suggested in the comment.

Specific Code Suggestions

    In setupEventListeners, consider using Vue's event handling system instead of adding event listeners to the window object.
    In loadPertinentGeos, refactor to handle errors more gracefully and consider using Vue's reactive properties to update the component state.
    Consider using Vue's watch or computed properties to reactively handle changes in data or state, such as selectedRegion.
    Refactor the code to reduce direct manipulation of DOM elements, relying more on Vue's reactive data binding.

*/

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

        if (selectedRegion && selectedRegion.name) {
          console.log(selectedRegion.name + ' is selected')
        }
        
        if (selectedRegion && selectedRegion.regionId) {
          console.log(selectedRegion.regionId + ' is selected')
        }

        if (selectedRegion && selectedRegion.hasChild) {
          console.log(selectedRegion.name + ' ha children')
          
        } else {
          console.log(' has no children')
        }
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
