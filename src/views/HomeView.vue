<script setup>
import FilterNav from '../components/FilterNav.vue'
import RegionContent from '../components/RegionContent.vue'
import BaseGlobe from '../components/BaseGlobe.vue'
import BaseModal from '../components/BaseModal.vue'
import ClearModal from '../components/ClearModal.vue'
import MeshBorderModal from '../components/MeshBorderModal.vue'
import { useThreePolysStore } from '../stores/polys.js'
import { computed, provide, ref, onMounted, watch } from 'vue'

// Modal controls
const isModalOpen = ref(false)
const isClearModalOpen = ref(false)
const isPositionModalOpen = ref(false)
const isMeshBorderModalOpen = ref(false)
const isSphereBorderModalOpen = ref(false)

const toggleModal = () => {
  isModalOpen.value = !isModalOpen.value
}

const toggleClearModal = () => {
  isClearModalOpen.value = !isClearModalOpen.value
}

const togglePositionModal = () => {
  isPositionModalOpen.value = !isPositionModalOpen.value
}

const toggleMeshBorderModal = () => {
  isMeshBorderModalOpen.value = !isMeshBorderModalOpen.value
}

const toggleSphereBorderModal = () => {
  isSphereBorderModalOpen.value = !isSphereBorderModalOpen.value
}

// Handle position updates
const handlePositionUpdate = (position) => {
  // You can access position.screen.x, position.screen.y
  // and position.normalized.x, position.normalized.y
  // Pass this to your Three.js scene if needed
  // if (threePolysStore) {
  //   threePolysStore.updateModalPosition(position)
  // }
}

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
</script>

<template>
  <main>
    <RegionContent />
    <div id="world-container">
      <FilterNav />
      <BaseGlobe 
        ref="globeRef"
        @update-region-id="setSelectedRegion" />
      
      <!-- Modal buttons -->
      <div class="modal-buttons">
        <button class="modal-toggle-btn" @click="toggleModal">Dark Modal</button>
        <button class="modal-toggle-btn clear" @click="toggleClearModal">Clear Modal</button>
        <button class="modal-toggle-btn position" @click="togglePositionModal">Position Modal</button>
        <button class="modal-toggle-btn mesh-border" @click="toggleMeshBorderModal">Mesh Border Modal</button>
        <button class="modal-toggle-btn sphere-border" @click="toggleSphereBorderModal">Sphere Border</button>
      </div>
      
      <!-- Modals -->
      <BaseModal :is-open="isModalOpen" @close="toggleModal">
        <h2>Dark Modal</h2>
        <p>This modal has a dark overlay background.</p>
      </BaseModal>

      <ClearModal :is-open="isClearModalOpen" @close="toggleClearModal">
        <h2>Clear Modal</h2>
        <p>This modal has a transparent background.</p>
      </ClearModal>

      <MeshBorderModal 
        v-if="worldStage"
        :world-stage="worldStage"
        :is-open="isMeshBorderModalOpen" 
        @close="toggleMeshBorderModal"
        @position-update="handlePositionUpdate">
        <p>Move this modal to see the Three.js mesh border!</p>
      </MeshBorderModal>
    </div>
  </main>
</template>

<style scoped>
#world-container {
  color: white;
  position: relative;
}

.modal-buttons {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 10px;
  z-index: 100;
}

.modal-toggle-btn {
  padding: 0.5rem 1rem;
  background-color: hsla(160, 100%, 37%, 1);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.modal-toggle-btn.clear {
  background-color: hsla(200, 100%, 37%, 1);
}

.modal-toggle-btn:hover {
  background-color: hsla(160, 100%, 37%, 0.8);
}

.modal-toggle-btn.clear:hover {
  background-color: hsla(200, 100%, 37%, 0.8);
}

.modal-toggle-btn.position {
  background-color: hsla(300, 100%, 37%, 1);
}

.modal-toggle-btn.position:hover {
  background-color: hsla(300, 100%, 37%, 0.8);
}

.modal-toggle-btn.mesh-border {
  background-color: hsla(260, 100%, 37%, 1);
}

.modal-toggle-btn.mesh-border:hover {
  background-color: hsla(260, 100%, 37%, 0.8);
}

.modal-toggle-btn.sphere-border {
  background-color: hsla(220, 100%, 37%, 1);
}

.modal-toggle-btn.sphere-border:hover {
  background-color: hsla(220, 100%, 37%, 0.8);
}
</style>
