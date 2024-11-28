<script setup>
import { inject, defineEmits, ref, watch, computed } from 'vue'

// Selected Region Id
const selectedRegion = inject('selectedRegion')
//const regionOptions = inject('regionOptions')
const emit = defineEmits(['update-region-id'])
// @TODO bad code smell? value being copied?
const selectedValue = ref(selectedRegion) // Initialize with the injected value
// Watch for changes in the selection and emit an event

// @TODO Don't need this watch, it's being handled by the reference
watch(selectedValue, (newValue) => {
  emit('update-region-id', newValue)
})

// @TODO add validation for the existence of selectedRegion.name

const searchQuery = ref('')
const firstWordSuggestions = ['Best', 'Worst']
const secondWordSuggestions = ['music', 'ad']
const showSuggestions = ref(false)

const currentWordIndex = computed(() => {
  const cursorPos = document.activeElement?.selectionStart || 0
  const words = searchQuery.value.split(' ').filter(word => word.length > 0)
  
  console.log('Cursor position:', cursorPos)
  console.log('Current search query:', searchQuery.value)
  console.log('Words:', words)
  
  // If first word is complete and a space, and cursor is after it,
  // we're working with the second word
  if (words.length === 1 && 
      firstWordSuggestions.includes(words[0]) && 
      searchQuery.value.endsWith(' ')) {
    return 1
  }
  
  // Track position through the string to find which word the cursor is near
  let charCount = 0
  for (let i = 0; i < words.length; i++) {
    const wordStart = charCount
    const wordEnd = charCount + words[i].length
    
    console.log('Word ${i}:', words[i], 'Start:', wordStart, 'End:', wordEnd, 'Cursor:', cursorPos)
    
    if (cursorPos >= wordStart && cursorPos <= wordEnd + 1) { // +1 to include space after word
      return i
    }
    charCount += words[i].length + 1 // +1 for space
  }
  
  // If cursor is beyond last word and we have a first word
  if (words.length === 1 && firstWordSuggestions.includes(words[0])) {
    return 1
  }
  
  return 0
})

const filteredSuggestions = computed(() => {
  const words = searchQuery.value.split(' ').filter(word => word.length > 0)
  const currentWord = words[currentWordIndex.value] || ''
  const suggestions = currentWordIndex.value === 0 ? firstWordSuggestions : secondWordSuggestions
  
  // If word is complete and clicked, show all suggestions for current word type
  if (showSuggestions.value && 
      ((currentWordIndex.value === 0 && firstWordSuggestions.includes(currentWord)) ||
       (currentWordIndex.value === 1 && secondWordSuggestions.includes(currentWord)))) {
    return suggestions
  }
  
  // Otherwise filter based on input
  if (!currentWord) return suggestions
  return suggestions.filter(s => 
    s.toLowerCase().startsWith(currentWord.toLowerCase())
  )
})

const handleClick = (event) => {
  // Get the position of the click in the input
  const cursorPosition = event.target.selectionStart
  console.log('🖱️ Click handler - Cursor position:', cursorPosition)
  console.log('🖱️ Click handler - Current word index:', currentWordIndex.value)
  showSuggestions.value = true
}

const handleInput = (event) => {
  // Get current cursor position from the event target
  const cursorPosition = event.target.selectionStart
  console.log('⌨️ Input handler - Cursor position:', cursorPosition)
  console.log('⌨️ Input handler - Current word index:', currentWordIndex.value)
  
  const words = searchQuery.value.split(' ').filter(word => word.length > 0)
  if (words.length <= 2) {
    showSuggestions.value = true
  } else {
    showSuggestions.value = false
  }
}

const handleFocusOut = (event) => {
  // Check if the related target is within our suggestions
  if (!event.currentTarget.contains(event.relatedTarget)) {
    showSuggestions.value = false
  }
}

const selectSuggestion = (suggestion) => {
  console.log('Current word index:', currentWordIndex.value)
  console.log('Current search query:', searchQuery.value)
  console.log('Words:', searchQuery.value.split(' ').filter(word => word.length > 0))
  
  const words = searchQuery.value.split(' ').filter(word => word.length > 0)
  const firstWord = words[0] || ''
  
  // Always preserve first word when selecting second word
  if (firstWordSuggestions.includes(firstWord)) {
    if (currentWordIndex.value === 0) {
      searchQuery.value = suggestion + ' '
      showSuggestions.value = true
    } else {
      searchQuery.value = `${firstWord} ${suggestion}`
      showSuggestions.value = false
    }
  } else {
    // If no valid first word, just set the first word
    searchQuery.value = suggestion + ' '
    showSuggestions.value = true
  }
}
</script>

<template>
  <div id="filter-nav" @focusout="handleFocusOut">
    <p class="content-message">Filter Nav region: {{ selectedRegion.name }}</p>

    <div class="terminal-input-container">
      <input 
        type="text"
        v-model="searchQuery"
        class="terminal-input"
        :placeholder="currentWordIndex === 0 ? 'Best/Worst...' : 'Best music/ad...'"
        @input="handleInput"
        @click="handleClick"
        @focus="handleInput"
      >
      <div v-if="showSuggestions && filteredSuggestions.length" class="suggestions">
        <div 
          v-for="suggestion in filteredSuggestions" 
          :key="suggestion"
          class="suggestion-item"
          @mousedown.prevent="selectSuggestion(suggestion)"
          tabindex="0"
        >
          {{ suggestion }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.content-message {
  color: white;
}

.terminal-input-container {
  margin-top: 1rem;
  position: relative;
}

.terminal-input {
  width: 100%;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(0, 255, 0, 0.2);
  color: #00ff00;
  font-family: monospace;
  padding: 0.5rem;
  font-size: 14px;
  outline: none;
  border-radius: 2px;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.terminal-input::placeholder {
  color: rgba(0, 255, 0, 0.5);
}

/* Blinking cursor effect */
.terminal-input {
  caret-color: #00ff00;
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  50% {
    caret-color: transparent;
  }
}

/* Optional hover effect to match DataDisplay */
.terminal-input:hover {
  border-color: rgba(0, 255, 0, 0.4);
  box-shadow: 0 0 5px rgba(0, 255, 0, 0.2);
}

.terminal-input:focus {
  border-color: rgba(0, 255, 0, 0.6);
  box-shadow: 0 0 8px rgba(0, 255, 0, 0.3);
}

.suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(0, 255, 0, 0.2);
  border-top: none;
  border-radius: 0 0 2px 2px;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 1000;
}

.suggestion-item {
  padding: 0.5rem;
  color: #00ff00;
  cursor: pointer;
  font-family: monospace;
}

.suggestion-item:hover {
  background: rgba(0, 255, 0, 0.2);
}

/* Optional: highlight the first word differently */
.terminal-input::first-line {
  color: #00ff00;
}
</style>
