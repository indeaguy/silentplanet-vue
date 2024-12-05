<script setup>
/**
 * FilterNav Component Requirements:
 * 
 * Input Field:
 * - Allows multiple-word combinations based on configured sequence
 * - Each word must be from its corresponding list in wordLists.lists
 * - Word sequence is defined by wordLists.sequence
 * 
 * Suggestion Behavior:
 * 1. Word Selection:
 *    - Shows suggestions based on cursor position relative to phrase boundaries
 *    - Shows suggestions whenever a word is clicked
 *    - After selecting a word:
 *      a) If next word isn't set, show next word suggestions
 *      b) If next word is set, don't show any suggestions automatically
 *    - When changing a word with subsequent words present:
 *      - Preserves subsequent words
 *      - Updates only the current word
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
 *    - Cursor position determines which word's suggestions are shown based on phrase boundaries
 * 
 * 3. Cursor Position:
 *    - Uses phraseHistory.phrases to determine word boundaries
 *    - Each phrase object contains:
 *      - phrase: The actual word
 *      - start: Starting cursor position
 *      - end: Ending cursor position
 *    - Updates suggestions based on which phrase boundary contains cursor
 *    - Supports arrow key navigation within input text
 *    - Maintains cursor position after selecting a word
 * 
 * Visual Feedback:
 * - Highlights currently selected suggestion
 * - Shows appropriate suggestions filtered by current input
 * - Maintains proper spacing between words
 * 
 * Configuration:
 * - Uses wordLists object containing:
 *   - sequence: Array defining the order of word types
 *   - lists: Object containing named arrays of valid words for each type
 * 
 * State Management:
 * - Integrates with userStore to maintain phrase history
 * - phraseHistory.phrases stores word positions and boundaries
 * - Uses phrase boundaries instead of spaces for word detection
 */

import { inject, defineEmits, ref, watch, computed, nextTick } from 'vue'
import { useUserStore } from '../stores/user'

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

// Replace the wordLists and wordSequence with a single configuration object
const wordLists = {
  sequence: ['adjectives', 'contentTypes', 'preposition'],
  lists: {
    adjectives: ['best', 'new', 'random', 'most undisliked'],
    contentTypes: ['music', 'art', 'poem', 'post', 'ad'],
    preposition: ['in', 'from'],
    // Add more lists as needed
  },
  addSpaceAfter: ['adjectives', 'contentTypes'] // Words that should automatically add a space
}

const showSuggestions = ref(false)

const cursorPosition = ref(0)

// Replace currentWordIndex computed property
const currentWordIndex = computed(() => {
  const phrases = userStore.phraseHistory.phrases
  if (!phrases || Object.keys(phrases).length === 0) return 0
  
  for (const [index, phraseData] of Object.entries(phrases)) {
    if (cursorPosition.value >= phraseData.start && cursorPosition.value <= phraseData.end) {
      return parseInt(index)
    }
  }
  
  // If cursor is after the last word, return next index
  const lastPhrase = phrases[Object.keys(phrases).length - 1]
  return cursorPosition.value > lastPhrase?.end ? Object.keys(phrases).length : 0
})

// Update filteredSuggestions computed property
const filteredSuggestions = computed(() => {
  const phrases = userStore.phraseHistory.phrases
  const currentPhrase = phrases[currentWordIndex.value]?.phrase || ''
  const currentListType = wordLists.sequence[currentWordIndex.value] || wordLists.sequence[wordLists.sequence.length - 1]
  const suggestions = wordLists.lists[currentListType] || []
  
  if (showSuggestions.value && suggestions.includes(currentPhrase)) {
    return suggestions
  }
  
  if (!currentPhrase) return suggestions
  return suggestions.filter(s => 
    s.toLowerCase().startsWith(currentPhrase.toLowerCase())
  )
})

const updateSuggestionState = (position) => {
  cursorPosition.value = position
  const phrases = userStore.phraseHistory.phrases
  showSuggestions.value = Object.keys(phrases).length <= wordLists.sequence.length
}

const handleClick = (event) => {
  updateSuggestionState(event.target.selectionStart)
}

const handleInput = (event) => {
  updateSuggestionState(event.target.selectionStart)
  
  const phrases = userStore.phraseHistory.phrases
  const inputText = event.target.value
  const phrasesToDelete = []

  // Check all phrases that might be affected by the deletion
  for (const [index, phraseData] of Object.entries(phrases)) {
    const { start, end } = phraseData
    // Check if any part of the phrase was in the deleted region
    const phraseText = inputText.substring(start, end).trim()
    if (!phraseText) {
      phrasesToDelete.push(index)
    }
  }

  // If any phrases need to be deleted
  if (phrasesToDelete.length > 0) {
    const updatedPhrases = { ...phrases }
    phrasesToDelete.forEach(index => {
      delete updatedPhrases[index]
    })

    // Update the store with the remaining phrases
    userStore.$patch((state) => {
      state.phraseHistory.phrases = updatedPhrases
    })

    // If all phrases were deleted, just set searchQuery to empty
    if (Object.keys(updatedPhrases).length === 0) {
      searchQuery.value = ''
    }
  }
}

const handleFocusOut = (event) => {
  // Check if the related target is within our suggestions
  if (!event.currentTarget.contains(event.relatedTarget)) {
    showSuggestions.value = false
  }
}

// Add store initialization after other refs
const userStore = useUserStore()

// Update selectSuggestion function
const selectSuggestion = async (suggestion) => {
  const phrases = userStore.phraseHistory.phrases
  const phraseArray = []
  let fullString = ''
  
  // Build the new phrase array and string
  for (let i = 0; i < wordLists.sequence.length; i++) {
    if (i === currentWordIndex.value) {
      phraseArray[i] = suggestion
    } else if (phrases[i]) {
      phraseArray[i] = phrases[i].phrase
    } else {
      phraseArray[i] = ''
    }
  }
  
  fullString = phraseArray.filter(p => p).join(' ')
  // Add space if current word type is in addSpaceAfter list AND next word isn't set
  const currentWordType = wordLists.sequence[currentWordIndex.value]
  const nextWordIndex = currentWordIndex.value + 1
  const hasNextWord = phraseArray[nextWordIndex] !== undefined && phraseArray[nextWordIndex] !== ''
  
  if (wordLists.addSpaceAfter.includes(currentWordType) && !hasNextWord) {
    fullString += ' '
  } else if (currentWordIndex.value < wordLists.sequence.length - 1) {
    // Keep existing behavior for last word check
    //fullString += ' '
  }
  
  searchQuery.value = fullString
  await userStore.addPhraseEntry(fullString, phraseArray, currentWordIndex.value)
  
  showSuggestions.value = currentWordIndex.value < wordLists.sequence.length - 1
  cursorPosition.value = fullString.length
}

// Add new ref for tracking selected suggestion
const selectedSuggestionIndex = ref(-1)

// Modify handleKeydown to handle arrow navigation and selection
const handleKeydown = (event) => {
  if (event.key === 'Backspace') {
    const phrases = userStore.phraseHistory.phrases
    const cursorPos = event.target.selectionStart
    
    // Find which phrase we're in or at the end of
    let targetPhraseIndex = null
    Object.entries(phrases).forEach(([index, phrase]) => {
      if (cursorPos > phrase.start && cursorPos <= phrase.end + 1) {
        targetPhraseIndex = parseInt(index)
      }
    })
    
    console.log('Target phrase index:', targetPhraseIndex)
    
    if (targetPhraseIndex !== null) {
      event.preventDefault()
      
      // Create new phrases object without current phrase
      const updatedPhrases = { ...phrases }
      delete updatedPhrases[targetPhraseIndex]
      
      // Update store
      userStore.$patch((state) => {
        state.phraseHistory.phrases = updatedPhrases
      })
      
      // Rebuild search query without the deleted phrase
      const phraseArray = []
      Object.entries(updatedPhrases).forEach(([index, data]) => {
        phraseArray[index] = data.phrase
      })
      searchQuery.value = phraseArray.filter(p => p).join(' ')
      
      // Move cursor to end of previous word or start
      const prevPhrase = phrases[targetPhraseIndex - 1]
      if (prevPhrase) {
        cursorPosition.value = prevPhrase.end + 1
        nextTick(() => {
          event.target.setSelectionRange(prevPhrase.end + 1, prevPhrase.end + 1)
        })
      } else {
        cursorPosition.value = 0
        nextTick(() => {
          event.target.setSelectionRange(0, 0)
        })
      }
      return
    }
  }

  // Update cursor position immediately for arrow keys
  if (['ArrowLeft', 'ArrowRight'].includes(event.key)) {
    // Immediately update cursor position
    cursorPosition.value = event.target.selectionStart + (event.key === 'ArrowRight' ? 1 : -1)
    
    // Show suggestions when cursor moves to valid position
    const phrases = userStore.phraseHistory.phrases
    if (Object.keys(phrases).length <= wordLists.sequence.length) {
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

  // Handle escape key to restore the last deleted phrase
  if (event.key === 'Escape') {
    const lastEntry = userStore.phraseHistory.entries.slice(-1)[0]
    if (lastEntry) {
      searchQuery.value = lastEntry.fullString
      userStore.$patch((state) => {
        state.phraseHistory.phrases = lastEntry.phraseArray.reduce((acc, phrase, index) => {
          if (phrase) {
            acc[index] = {
              phrase,
              start: acc[index - 1] ? acc[index - 1].end + 1 : 0,
              end: (acc[index - 1] ? acc[index - 1].end + 1 : 0) + phrase.length
            }
          }
          return acc
        }, {})
      })
    }
  }
}
</script>

<template>
  <div id="filter-nav" 
    @focusout="handleFocusOut"
    @mousedown.stop
    @click.stop
    @mousemove.stop>
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
        autocomplete="off"
        name="filter-search"
        spellcheck="false"
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
