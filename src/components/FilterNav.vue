<script setup>
/**
 * FilterNav Component Requirements:
 * 
 * Input Field:
 * - Allows two-word combinations (e.g., "Best music", "Worst ad")
 * - First word must be from firstWordSuggestions list
 * - Second word must be from secondWordSuggestions list
 * 
 * Suggestion Behavior:
 * 1. Word Selection:
 *    - Shows suggestions based on cursor position in input
 *    - Shows suggestions whenever a word is clicked
 *    - After selecting first word:
 *      a) If second word isn't set, show second word suggestions
 *      b) If second word is set, don't show any suggestions automatically
 *    - When changing first word with second word present:
 *      - Preserves the second word
 *      - Updates only the first word
 *      - Maintains cursor position
 *      - Doesn't show suggestions automatically
 * 
 * 2. Keyboard Navigation:
 *    - Up/Down arrows navigate through suggestions when suggestions are visible
 *    - Down arrow shows suggestions for current word position when suggestions are hidden
 *    - Enter key selects highlighted suggestion
 *    - Navigating up past first suggestion clears selection
 *    - Shift+Up moves cursor to start of input
 *    - Shift+Down moves cursor to end of input
 *    - Left/Right arrows update suggestions based on cursor position
 *    - Cursor position determines which word's suggestions are shown
 * 
 * 3. Cursor Position:
 *    - Tracks cursor position to determine active word
 *    - Updates suggestions based on which word is being edited
 *    - Supports arrow key navigation within input text
 *    - Maintains cursor position after selecting a word (doesn't jump to end)
 *    - Shows correct word suggestions based on cursor position relative to space character
 * 
 * Visual Feedback:
 * - Highlights currently selected suggestion
 * - Shows appropriate suggestions filtered by current input
 * - Maintains proper spacing between words
 */

import { inject, defineEmits, ref, watch, computed, nextTick } from 'vue'

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
const firstWordSuggestions = ['best', 'new', 'random', 'most undisliked']
const secondWordSuggestions = ['music','art', 'poem', 'post', 'ad']
const showSuggestions = ref(false)

const cursorPosition = ref(0)

const currentWordIndex = computed(() => {
  const fullText = searchQuery.value
  if (!fullText) return 0
  
  const spaceIndex = fullText.indexOf(' ')
  if (spaceIndex === -1) return 0 // No space found, editing first word
  
  // If cursor is before or at the space, we're editing first word
  if (cursorPosition.value <= spaceIndex) return 0
  
  // If cursor is after the space, we're editing second word
  return 1
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
  cursorPosition.value = event.target.selectionStart
  console.log('🖱️ Click handler - New cursor position:', cursorPosition.value)
  
  // Always show suggestions and reset selection
  showSuggestions.value = true
  selectedSuggestionIndex.value = -1
}

const handleInput = (event) => {
  cursorPosition.value = event.target.selectionStart
  console.log('⌨️ Input handler - New cursor position:', cursorPosition.value)
  
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
  const words = searchQuery.value.split(' ').filter(word => word.length > 0)
  
  if (currentWordIndex.value === 0) {
    // When selecting first word, preserve second word if it exists
    const secondWord = words[1] || ''
    searchQuery.value = suggestion + (secondWord ? ` ${secondWord}` : ' ')
    
    // Only show suggestions if second word isn't set yet
    showSuggestions.value = !secondWord
    cursorPosition.value = searchQuery.value.length
  } else {
    // When selecting second word, preserve first word
    const firstWord = words[0] || ''
    searchQuery.value = firstWord ? `${firstWord} ${suggestion}` : `${suggestion}`
    showSuggestions.value = false
    cursorPosition.value = searchQuery.value.length
  }
}

// Add new ref for tracking selected suggestion
const selectedSuggestionIndex = ref(-1)

// Modify handleKeydown to handle arrow navigation and selection
const handleKeydown = (event) => {
  // Update cursor position immediately for arrow keys
  if (['ArrowLeft', 'ArrowRight'].includes(event.key)) {
    // Immediately update cursor position
    cursorPosition.value = event.target.selectionStart + (event.key === 'ArrowRight' ? 1 : -1)
    
    // Show suggestions when cursor moves to valid position
    const words = searchQuery.value.split(' ').filter(word => word.length > 0)
    if (words.length <= 2) {
      showSuggestions.value = true
    }
  }

  // Handle cursor movement with shift key
  if (event.shiftKey) {
    if (event.key === 'ArrowUp') {
      cursorPosition.value = 0
      event.target.setSelectionRange(0, 0)
      return
    }
    if (event.key === 'ArrowDown') {
      const length = searchQuery.value.length
      cursorPosition.value = length
      event.target.setSelectionRange(length, length)
      return
    }
  }

  // Handle suggestion navigation
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    if (!showSuggestions.value) {
      // Show suggestions when pressing down arrow
      showSuggestions.value = true
      selectedSuggestionIndex.value = -1
    } else {
      selectedSuggestionIndex.value = Math.min(
        selectedSuggestionIndex.value + 1,
        filteredSuggestions.value.length - 1
      )
    }
  } else if (event.key === 'ArrowUp' && showSuggestions.value) {
    event.preventDefault()
    selectedSuggestionIndex.value = Math.max(selectedSuggestionIndex.value - 1, -1)
  } else if (event.key === 'Enter' && selectedSuggestionIndex.value >= 0) {
    event.preventDefault()
    selectSuggestion(filteredSuggestions.value[selectedSuggestionIndex.value])
    selectedSuggestionIndex.value = -1
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
        :placeholder="currentWordIndex === 0 ? 'best...' : '...'"
        @input="handleInput"
        @click="handleClick"
        @keydown="handleKeydown"
        @focus="handleInput"
      >
      <div v-if="showSuggestions && filteredSuggestions.length" class="suggestions">
        <div 
          v-for="(suggestion, index) in filteredSuggestions" 
          :key="suggestion"
          class="suggestion-item"
          :class="{ 'suggestion-selected': index === selectedSuggestionIndex }"
          @mousedown.prevent="selectSuggestion(suggestion)"
          @mouseover="selectedSuggestionIndex = index"
          @mouseout="selectedSuggestionIndex = -1"
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

.suggestion-selected {
  background: rgba(0, 255, 0, 0.2);
}

/* Optional: Add a subtle transition */
.suggestion-item {
  transition: background-color 0.1s ease;
}
</style>
