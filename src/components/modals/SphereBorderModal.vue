<template>
  <div v-if="isOpen" 
       class="modal-overlay" 
       @click="closeModal">
    <div class="modal-content" 
         @click.stop>
      <button class="close-button" @click="closeModal">&times;</button>
      <h3>Sphere Border</h3>
      <p>A square border is now visible around the sphere!</p>
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as THREE from 'three'
import { createMeshBasicMaterial } from '../../silentplanet-three-app/make-these-libs/three-helpers'

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

const emit = defineEmits(['close'])
const borderMesh = ref(null)

const createBorderMesh = () => {
  if (borderMesh.value) return

  // Create a plane geometry for the border
  const geometry = new THREE.PlaneGeometry(4, 4) // Increased size from 1 to 4
  const material = createMeshBasicMaterial({
    color: 0x87cefa,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
    depthTest: false
  })
  
  borderMesh.value = new THREE.Mesh(geometry, material)
  borderMesh.value.position.set(0, 0, -2) // Position it behind the sphere
  borderMesh.value.renderOrder = 0 // Render it behind other objects
  borderMesh.value.frustumCulled = false
  
  if (props.worldStage && typeof props.worldStage.addUIMesh === 'function') {
    props.worldStage.addUIMesh(borderMesh.value)
  }
}

const cleanupMesh = () => {
  if (borderMesh.value && props.worldStage) {
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