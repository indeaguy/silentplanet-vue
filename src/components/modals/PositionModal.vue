<template>
  <div v-if="isOpen" 
       class="modal-overlay" 
       @click="closeModal"
       @mousemove="updatePosition">
    <div class="modal-content" 
         :style="modalStyle"
         @click.stop>
      <button class="close-button" @click="closeModal">&times;</button>
      <h3>Position Details</h3>
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
import { ref, computed } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close', 'positionUpdate'])

const position = ref({ x: 0, y: 0 })
const normalized = ref({ x: 0, y: 0 })

const modalStyle = computed(() => ({
  position: 'absolute',
  left: `${position.value.x}px`,
  top: `${position.value.y}px`,
  transform: 'translate(-50%, -50%)'
}))

const updatePosition = (event) => {
  // Get viewport dimensions
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  // Update raw position
  position.value = {
    x: event.clientX,
    y: event.clientY
  }

  // Calculate normalized coordinates (-1 to 1)
  normalized.value = {
    x: (event.clientX / viewportWidth) * 2 - 1,
    y: -(event.clientY / viewportHeight) * 2 + 1
  }

  // Emit position update for Three.js scene
  emit('positionUpdate', {
    screen: position.value,
    normalized: normalized.value
  })
}

const closeModal = () => {
  emit('close')
}
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