<template>
  <div v-if="isOpen" 
       class="modal-overlay" 
       @click="closeModal"
       @mousemove="updatePosition">
    <div class="modal-content" 
         :style="modalStyle"
         ref="modalContent"
         @click.stop>
      <button class="close-button" @click="closeModal">&times;</button>
      <h3>Position Details with Mesh Border</h3>
      <div class="position-info">
        <p>Screen X: {{ position.x }}px</p>
        <p>Screen Y: {{ position.y }}px</p>
        <p>Normalized X: {{ normalized.x.toFixed(3) }}</p>
        <p>Normalized Y: {{ normalized.y.toFixed(3) }}</p>
      </div>
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import * as THREE from 'three'
import { createMeshBasicMaterial } from '../silentplanet-three-app/make-these-libs/three-helpers'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  worldStage: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'positionUpdate'])
const modalContent = ref(null)
const position = ref({ x: 0, y: 0 })
const normalized = ref({ x: 0, y: 0 })
const borderMesh = ref(null)

// Reusable arrays for vertices
const vertices = new Float32Array(36) // 12 vertices * 3 coordinates
const indices = new Uint16Array([
  0, 1,   // Top horizontal left
  2, 3,   // Top horizontal right
  4, 5,   // Bottom horizontal left
  6, 7,   // Bottom horizontal right
  8, 9,   // Left vertical
  10, 11  // Right vertical
])

const cleanupMesh = () => {
  if (borderMesh.value && props.worldStage) {
    console.log('Cleaning up mesh')
    props.worldStage.removeUIMesh(borderMesh.value)
    borderMesh.value.geometry.dispose()
    borderMesh.value.material.dispose()
    borderMesh.value = null
  }
}

const closeModal = () => {
  cleanupMesh()
  emit('close')
}

const modalStyle = computed(() => ({
  position: 'absolute',
  left: `${position.value.x}px`,
  top: `${position.value.y}px`,
  transform: 'translate(-50%, -50%)'
}))

const createBorderMesh = () => {
  if (borderMesh.value) return

  const geometry = new THREE.BufferGeometry()
  
  // Set up attributes
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
  geometry.setIndex(new THREE.BufferAttribute(indices, 1))
  
  // Create lines with proper material
  borderMesh.value = new THREE.LineSegments(
    geometry,
    new THREE.LineBasicMaterial({
      color: 0x87cefa,
      transparent: true,
      opacity: 0.5,
      depthTest: false,
      linewidth: 2
    })
  )
  
  borderMesh.value.renderOrder = 999999
  borderMesh.value.frustumCulled = false
  
  if (props.worldStage && typeof props.worldStage.addUIMesh === 'function') {
    props.worldStage.addUIMesh(borderMesh.value)
  }
}

const updateBorderMesh = () => {
  if (!borderMesh.value || !modalContent.value) return

  const rect = modalContent.value.getBoundingClientRect()
  const ndcLeft = (rect.left / window.innerWidth) * 2 - 1
  const ndcRight = (rect.right / window.innerWidth) * 2 - 1
  const ndcTop = -(rect.top / window.innerHeight) * 2 + 1
  const ndcBottom = -(rect.bottom / window.innerHeight) * 2 + 1

  // Update vertices for all lines
  // Top horizontal line
  vertices[0] = -1;      vertices[1] = ndcTop;    vertices[2] = -1  // Left edge
  vertices[3] = ndcLeft; vertices[4] = ndcTop;    vertices[5] = -1  // Modal left
  vertices[6] = ndcRight; vertices[7] = ndcTop;    vertices[8] = -1  // Modal right
  vertices[9] = 1;       vertices[10] = ndcTop;    vertices[11] = -1 // Right edge

  // Bottom horizontal line
  vertices[12] = -1;      vertices[13] = ndcBottom; vertices[14] = -1 // Left edge
  vertices[15] = ndcLeft; vertices[16] = ndcBottom; vertices[17] = -1 // Modal left
  vertices[18] = ndcRight; vertices[19] = ndcBottom; vertices[20] = -1 // Modal right
  vertices[21] = 1;       vertices[22] = ndcBottom; vertices[23] = -1 // Right edge

  // Left vertical line
  vertices[24] = ndcLeft; vertices[25] = 1;        vertices[26] = -1 // Top
  vertices[27] = ndcLeft; vertices[28] = -1;       vertices[29] = -1 // Bottom

  // Right vertical line
  vertices[30] = ndcRight; vertices[31] = 1;        vertices[32] = -1 // Top
  vertices[33] = ndcRight; vertices[34] = -1;       vertices[35] = -1 // Bottom

  // Update the geometry
  const positionAttribute = borderMesh.value.geometry.getAttribute('position')
  positionAttribute.needsUpdate = true

  // Update mesh orientation
  const camera = props.worldStage.worldStage.model.camera
  borderMesh.value.quaternion.copy(camera.quaternion)
}

const updatePosition = (event) => {
  position.value = {
    x: event.clientX,
    y: event.clientY
  }

  normalized.value = {
    x: (event.clientX / window.innerWidth) * 2 - 1,
    y: -(event.clientY / window.innerHeight) * 2 + 1
  }

  updateBorderMesh()

  emit('positionUpdate', {
    screen: position.value,
    normalized: normalized.value
  })
}

watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    createBorderMesh()
  } else {
    cleanupMesh()
  }
})

onMounted(() => {
  if (props.isOpen) {
    createBorderMesh()
  }
})

onBeforeUnmount(() => {
  cleanupMesh()
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: transparent;
  z-index: 1000;
  pointer-events: auto;
}

.modal-content {
  background-color: rgba(20, 20, 20, 0.3);
  color: white;
  padding: 2rem;
  border-radius: 4px;
  max-width: 300px;
  width: 90%;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  pointer-events: auto;
}

.position-info {
  margin: 1rem 0;
  font-family: monospace;
}

.position-info p {
  margin: 0.5rem 0;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  border: none;
  background: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  color: white;
}

.close-button:hover {
  color: hsla(160, 100%, 37%, 1);
}
</style> 