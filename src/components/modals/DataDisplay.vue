<template>
  <div v-if="showDisplay" :style="computedStyles" class="data-display-container">
    <button 
      class="copy-button" 
      @click="copyToClipboard"
      :class="{ 'copied': copied }"
    >
      {{ copied ? '✓' : '📋' }}
    </button>
    <pre>{{ formattedJson }}</pre>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  dataSource: {
    type: Function,
    required: true
  },
  updateInterval: {
    type: Number,
    default: 1000 / 30
  },
  useMatrixStyle: {
    type: Boolean,
    default: false
  },
  customStyles: {
    type: Object,
    default: () => ({})
  }
})

const data = ref(null)
const showDisplay = ref(true)
let updateIntervalId = null
const copied = ref(false)

const formattedJson = computed(() => 
  JSON.stringify(data.value, null, 2)
)

const matrixStyles = computed(() => ({
  position: 'fixed',
  bottom: '8px',
  right: '8px',
  color: '#00ff00',
  fontFamily: 'monospace',
  whiteSpace: 'pre',
  textShadow: '0 0 3px #00ff00',
  background: 'rgba(0, 0, 0, 0.5)',
  padding: '2px 4px',
  borderRadius: '2px',
  backdropFilter: 'blur(4px)',
  webkitBackdropFilter: 'blur(4px)',
  border: '1px solid rgba(0, 255, 0, 0.2)',
  zIndex: 1000,
  pointerEvents: 'auto',
  userSelect: 'text',
  minWidth: '120px',
  fontSize: '9px',
  lineHeight: '1.1',
  transition: 'all 0.2s ease-out',
  transformOrigin: 'bottom right'
}))

const computedStyles = computed(() => 
  props.useMatrixStyle 
    ? { ...matrixStyles.value, ...props.customStyles }
    : props.customStyles
)

const updateData = () => {
  data.value = props.dataSource()
}

const startUpdating = () => {
  updateIntervalId = setInterval(updateData, props.updateInterval)
}

const stopUpdating = () => {
  if (updateIntervalId) {
    clearInterval(updateIntervalId)
  }
}

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(formattedJson.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy text:', err)
  }
}

onMounted(() => {
  startUpdating()
})

onBeforeUnmount(() => {
  stopUpdating()
})
</script>

<style scoped>
.data-display-container {
  position: relative;
  transition: all 0.2s ease-out;
}

.data-display-container:hover {
  transform: scale(1.5);
  z-index: 1001;
}

.copy-button {
  position: absolute;
  top: 2px;
  right: 2px;
  padding: 0px 2px;
  background: rgba(0, 255, 0, 0.1);
  border: 1px solid rgba(0, 255, 0, 0.2);
  border-radius: 2px;
  color: #00ff00;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s, background-color 0.2s;
  font-size: 8px;
  line-height: 1.2;
}

.data-display-container:hover .copy-button {
  opacity: 1;
}

.copy-button:hover {
  background: rgba(0, 255, 0, 0.2);
}

.copy-button.copied {
  background: rgba(0, 255, 0, 0.3);
}

pre {
  margin: 0;
}
</style> 