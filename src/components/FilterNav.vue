<script setup>
/**
 * FilterNav Component Requirements:
 * 
 * Input Field:
 * - Allows multiple-word combinations based on configured sequence
 * - Each word must be from its corresponding list in wordLists.lists
 * - Word sequence is defined by wordLists.sequence
 * - Maintains proper spacing between phrases:
 *   a) Adds space after phrases in wordLists.addSpaceAfter
 *   b) Adds space after any phrase that has subsequent positions available
 *   c) Preserves trailing spaces when deleting phrases
 *   d) Preserves trailing spaces when filtering suggestions
 *   e) Custom phrases follow same spacing rules as regular phrases based on addSpaceAfter
 *   f) @TODO When backspacing at a space between phrases, should clear the phrase 
 *      to the right of the cursor instead of removing the space
 * 
 * Suggestion Behavior:
 * 1. Word Selection:
 *    - Shows suggestions based on cursor position relative to phrase boundaries
 *    - Shows suggestions whenever a word is clicked
 *    - Filters suggestions to include matches anywhere in the word (not just prefix matches)
 *    - After selecting a word:
 *      a) If next word isn't set, show next word suggestions
 *      b) If next word is set, don't show any suggestions automatically
 *    - When changing a word with subsequent words present:
 *      - Preserves subsequent words
 *      - Updates only the current word
 *      - Maintains cursor position
 *      - Doesn't show suggestions automatically
 *    - Stops showing suggestions when:
 *      a) All available phrases in the sequence are filled
 *      b) Previous words are not valid phrases
 *      c) Maximum number of phrases is reached
 *    - Allows suggestions when:
 *      a) Starting fresh with no phrases
 *      b) Current phrase is valid
 *    - Space key behavior:
 *      a) Only commits phrase on exact match when no longer matches exist
 *      b) Preserves partial matches for multi-word phrases (e.g., "new cheese")
 *      c) Allows continued typing for partial matches
 *    - Special Down Arrow Behavior:
 *      When cursor is on an existing selected phrase with:
 *      a) No leading space before cursor position AND
 *      b) Currently selected phrase matches the one in store
 *      Then:
 *      1. First down arrow press:
 *         - Show ALL available options for that phrase type
 *         - Select first option
 *      2. Subsequent down arrow presses:
 *         - Navigate through all available options
 *      3. If user starts typing:
 *         - Clear the current phrase
 *         - Return to normal filtered suggestion behavior
 *      4. If user hits escape:
 *         - Restore previous phrase state
 *      5. If input loses focus:
 *         - Reset to normal suggestion behavior
 * 
 * 2. Custom Phrases:
 *    - Allows adding custom phrases when no exact match exists
 *    - Custom phrases are stored per word type in customPhrases
 *    - Custom phrases are properly removed when:
 *      a) Backspacing over the phrase
 *      b) Manually deleting the phrase
 *      c) Replacing with a different phrase
 *    - Shows "+" icon next to custom phrase suggestions
 *    - Maintains spaces within multi-word custom phrases
 *    - Allows freely adding spaces to custom phrases without requiring matches
 *    - Prevents duplicate custom phrases
 *    - Only offers custom phrase option when no partial matches exist
 * 
 * 3. Keyboard Navigation:
 *    - Up/Down arrows navigate through suggestions when suggestions are visible
 *    - Down arrow shows suggestions for current word position when suggestions are hidden
 *    - Enter key selects highlighted suggestion
 *    - Space key selects exact matching suggestion for current word
 *    - Navigating up past first suggestion clears selection
 *    - Shift+Up moves cursor to start of input
 *    - Shift+Down moves cursor to end of input
 *    - Left/Right arrows update suggestions based on cursor position
 *    - Cursor position determines which word's suggestions are shown based on phrase boundaries
 *    - Backspace removes entire phrases when cursor is within phrase boundaries
 * 
 * 4. Cursor Position:
 *    - Uses phraseHistory.phrases to determine word boundaries
 *    - Each phrase object contains:
 *      - phrase: The actual word
 *      - start: Starting cursor position
 *      - end: Ending cursor position
 *      - isCustom: Whether this is a custom phrase
 *    - Updates suggestions based on which phrase boundary contains cursor
 *    - Supports arrow key navigation within input text
 *    - Maintains cursor position after selecting a word
 * 
 * Visual Feedback:
 * - Highlights currently selected suggestion
 * - Shows appropriate suggestions filtered by current input
 * - Maintains proper spacing between words
 * - Indicates custom phrases with "+" icon
 * 
 * Configuration:
 * - Uses wordLists object containing:
 *   - sequence: Array defining the order of word types
 *   - lists: Object containing named arrays of valid words for each type
 *   - addSpaceAfter: Array of word types that should auto-add spaces
 * 
 * State Management:
 * - Integrates with userStore to maintain phrase history
 * - phraseHistory.phrases stores word positions and boundaries
 * - phraseHistory.customPhrases tracks custom phrases by list type
 * - Uses phrase boundaries instead of spaces for word detection
 * - Maintains last used timestamps for phrase suggestions
 * - When adding/updating phrases:
 *   a) Preserves existing phrase metadata for untouched phrases
 *   b) Updates character positions sequentially to maintain proper boundaries
 *   c) Only modifies isCustom flag for the current word being changed
 *   d) Maintains proper spacing and positioning for the entire sequence
 * 
 * 5. Selected Phrase Tracking:
 *    - Maintains selectedPhrase in userStore with:
 *      - index: Position in sequence
 *      - phrase: The actual text
 *      - start: Starting cursor position
 *      - end: Ending cursor position
 *      - isCustom: Whether it's a custom phrase
 *    - Updates selectedPhrase when:
 *      a) Cursor moves within phrase boundaries
 *      b) New phrase is selected
 *      c) Phrase is deleted
 *    - Clears selectedPhrase when:
 *      a) Cursor moves outside phrase boundaries
 *      b) Input is cleared
 *    - Uses selectedPhrase for:
 *      a) Determining current phrase under cursor
 *      b) Validating phrase boundaries
 *      c) Supporting special down arrow behavior
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
  sequence: ['adjectives', 'contentTypes', 'preposition', 'location'],
  lists: {
    adjectives: ['most popular', 'newest', 'fastest rising', 'random', 'most undisliked', 'most disliked'],
    contentTypes: ['music', 'art', 'poem', 'post', 'ad'],
    preposition: ['in', 'from', 'today', 'this week', 'created', 'created between'],
    location: ['Canada', 'Lower Sackville', 'New York', 'Paris'],
    // Add more lists as needed
  },
  addSpaceAfter: ['adjectives', 'preposition'] // Words that should automatically add a space
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

// Add this debug helper
const debugState = computed(() => ({
  currentWordIndex: currentWordIndex.value,
  phrases: userStore.phraseHistory.phrases,
  typedWord: searchQuery.value,
  cursorPosition: cursorPosition.value
}))

// Helper function to get current input at cursor
const getCurrentInputAtCursor = () => {
  const phrases = userStore.phraseHistory.phrases
  // Instead of splitting by spaces, we'll work with the raw string
  const lastPhraseIndex = currentWordIndex.value - 1
  const lastPhrase = phrases[lastPhraseIndex]
  
  if (lastPhrase) {
    // Get text after the last complete phrase, preserving spaces
    const startPos = lastPhrase.end + 1
    return searchQuery.value.substring(startPos)
  }
  
  // If no previous phrase, return the entire input
  return searchQuery.value
}

// Updated utility function
const buildFullString = (existingPhrases, suggestionText = null) => {
  const phraseArray = []
  
  // Build the phrase array
  for (let i = 0; i < wordLists.sequence.length; i++) {
    if (i === currentWordIndex.value && suggestionText !== null) {
      phraseArray[i] = suggestionText
    } else if (existingPhrases[i]) {
      phraseArray[i] = existingPhrases[i].phrase
    }
  }

  // Build and return the full string
  let fullString = phraseArray.filter(p => p).join(' ')
  
  // Add space if needed based on current list type
  const currentListType = wordLists.sequence[currentWordIndex.value] || 
    wordLists.sequence[wordLists.sequence.length - 1]
  if (wordLists.addSpaceAfter.includes(currentListType)) {
    fullString += ' '
  }

  return { fullString, phraseArray }
}

// Modified selectSuggestion to pass phrases
const selectSuggestion = async (suggestion, customListType = null) => {
  const suggestionText = typeof suggestion === 'object' ? suggestion.text : suggestion
  const currentListType = wordLists.sequence[currentWordIndex.value] || 
    wordLists.sequence[wordLists.sequence.length - 1]
  
  // Pass phrases from store to buildFullString
  const { fullString, phraseArray } = buildFullString(userStore.phraseHistory.phrases, suggestionText)
  
  // Rest of the existing selectSuggestion function...
  const isCustom = currentListType ? 
    !wordLists.lists[currentListType].includes(suggestionText) : 
    true
  
  if (isCustom) {
    customListType = customListType || currentListType
  }
  
  // Update the store first
  await userStore.addPhraseEntry(fullString, phraseArray, currentWordIndex.value, customListType, currentListType)
  
  // Then update the UI
  searchQuery.value = fullString
  cursorPosition.value = fullString.length
  
  // Always show suggestions for next phrase unless we're at the end
  const shouldShowSuggestions = currentWordIndex.value < wordLists.sequence.length - 1
  
  // Force suggestions to close and reopen if needed
  showSuggestions.value = false
  await nextTick()
  showSuggestions.value = shouldShowSuggestions
  
  // Reset selection
  selectedSuggestionIndex.value = -1
  
  // Add this: Force update suggestion state after selection
  // @TODO bad code smell?
  await nextTick()
  updateSuggestionState(cursorPosition.value)
}

// Add a new ref to track when we want to show all suggestions
const showAllSuggestions = ref(false)

// Add new ref to track which phrase we're showing all suggestions for
const showingAllSuggestionsForIndex = ref(null)

// Update resetSuggestionState
const resetSuggestionState = () => {
  showAllSuggestions.value = false
  showSuggestions.value = false
  selectedSuggestionIndex.value = -1
  showingAllSuggestionsForIndex.value = null
}

// Update filteredSuggestions computed property
const filteredSuggestions = computed(() => {
  const phrases = userStore.phraseHistory.phrases
  const currentListType = wordLists.sequence[currentWordIndex.value]
  const suggestions = wordLists.lists[currentListType] || []
  
  // Debug logs
  console.log('Filtered Suggestions State:', {
    showSuggestions: showSuggestions.value,
    showAllSuggestions: showAllSuggestions.value,
    currentListType,
    phrasesLength: Object.keys(phrases).length,
    sequenceLength: wordLists.sequence.length
  })

  if (!showSuggestions.value) {
    return []
  }

  // If showAllSuggestions is true, return ALL suggestions for current type
  if (showAllSuggestions.value && currentListType) {
    console.log('Showing all suggestions for:', currentListType)
    return suggestions
  }
  
  // Don't show suggestions if we've reached the maximum phrases
  if (Object.keys(phrases).length >= wordLists.sequence.length) {
    return []
  }

  const currentInput = getCurrentInputAtCursor()
  
  // Check if we're at a word boundary
  const previousWord = phrases[currentWordIndex.value - 1]
  const isAtWordBoundary = previousWord && 
    cursorPosition.value === previousWord.end + 1

  if (isAtWordBoundary) {
    return suggestions
  }
  
  if (currentInput) {
    // Use trimEnd() only for the comparison, not for determining if input exists
    const searchTerm = currentInput.trimEnd().toLowerCase()
    const matchingSuggestions = suggestions.filter(s => 
      s.toLowerCase().includes(searchTerm)
    )
    
    const hasExactMatch = suggestions.some(s => 
      s.toLowerCase() === searchTerm
    )
    const isSelectedPhrase = phrases[currentWordIndex.value]?.phrase === searchTerm
    
    if (searchTerm && !hasExactMatch && !isSelectedPhrase) {
      matchingSuggestions.push({
        text: searchTerm,
        isCustom: true
      })
    }
    
    return matchingSuggestions
  }
  
  return suggestions
})

// Update updateSuggestionState function
const updateSuggestionState = async (position) => {
  const previousIndex = currentWordIndex.value
  cursorPosition.value = position
  
  // If we moved to a different phrase, reset suggestion state
  if (previousIndex !== currentWordIndex.value) {
    resetSuggestionState()
  }
  
  const phrases = userStore.phraseHistory.phrases
  const currentPhrase = phrases[currentWordIndex.value]
  const currentListType = wordLists.sequence[currentWordIndex.value]
  
  // Update the selected phrase in the store
  if (currentPhrase) {
    await userStore.updateSelectedPhrase(
      currentWordIndex.value,
      currentPhrase.phrase,
      currentPhrase.start,
      currentPhrase.end,
      currentPhrase.isCustom,
      currentListType
    )
  } else {
    // Clear selected phrase if cursor is not within any phrase
    await userStore.updateSelectedPhrase(null, null, null, null, false, null)
  }

  // Rest of the function remains the same...
  const suggestions = wordLists.lists[currentListType] || []
  
  const isStartingFresh = Object.keys(phrases).length === 0
  const isValidPhrase = !currentPhrase || suggestions.includes(currentPhrase.phrase)
  
  const hasLeadingSpace = position === 0 || searchQuery.value[position - 1] === ' '
  const isExactMatch = currentPhrase && phrases[currentWordIndex.value]?.phrase === currentPhrase.phrase
  
  const shouldShowSuggestions = (
    isStartingFresh || 
    (hasLeadingSpace && !isExactMatch) ||
    (isValidPhrase && !isExactMatch)
  ) && Object.keys(phrases).length < wordLists.sequence.length

  if (showSuggestions.value !== shouldShowSuggestions) {
    showSuggestions.value = shouldShowSuggestions
  }

  if (shouldShowSuggestions && suggestions.length > 0) {
    selectedSuggestionIndex.value = 0
  }
}

const handleClick = async (event) => {
  // Wait for the browser to update the selection
  await nextTick()
  const clickPosition = event.target.selectionStart
  await updateSuggestionState(clickPosition)
}

// Update handleInput to reset state when typing
const handleInput = async (event) => {
  resetSuggestionState() // Reset state when user starts typing
  const inputPosition = event.target.selectionStart
  await updateSuggestionState(inputPosition)
}

const handleFocusOut = (event) => {
  // Check if the related target is within our suggestions
  if (!event.currentTarget.contains(event.relatedTarget)) {
    showSuggestions.value = false
  }
}

// Add store initialization after other refs
const userStore = useUserStore()

// Add new ref for tracking selected suggestion
const selectedSuggestionIndex = ref(-1)

// Update the watcher to be more aggressive about selecting the first option
watch([showSuggestions, filteredSuggestions], ([show, suggestions]) => {
  if (show && suggestions.length > 0) {
    selectedSuggestionIndex.value = 0
  } else {
    selectedSuggestionIndex.value = -1
  }
}, { immediate: true })

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
    
    if (targetPhraseIndex !== null) {
      event.preventDefault()
      
      // Get the phrase being deleted and its list type
      const deletedPhrase = phrases[targetPhraseIndex]
      const listType = wordLists.sequence[targetPhraseIndex]
      
      // Store the position where we'll put the cursor after deletion
      const newCursorPosition = deletedPhrase.start
      
      // If it was a custom phrase, remove it from customPhrases
      if (deletedPhrase.isCustom && userStore.phraseHistory.customPhrases[listType]) {
        userStore.$patch((state) => {
          state.phraseHistory.customPhrases[listType].delete(deletedPhrase.phrase)
        })
      }
      
      // Create new phrases object without current phrase
      const updatedPhrases = { ...phrases }
      delete updatedPhrases[targetPhraseIndex]
      
      // Update store
      userStore.$patch((state) => {
        state.phraseHistory.phrases = updatedPhrases
      })
      
      // Rebuild search query
      const phraseArray = []
      Object.entries(updatedPhrases).forEach(([index, data]) => {
        phraseArray[index] = data.phrase
        if (wordLists.addSpaceAfter.includes(wordLists.sequence[index]) || 
            parseInt(index) < wordLists.sequence.length - 1) {
          phraseArray[index] += ' '
        }
      })
      searchQuery.value = phraseArray.filter(p => p).join('')
      
      // Show suggestions for the deleted position
      showSuggestions.value = true
      cursorPosition.value = newCursorPosition
      
      // Set cursor position to start of deleted phrase
      nextTick(() => {
        event.target.setSelectionRange(newCursorPosition, newCursorPosition)
      })
      
      return
    }
  }

  // Update cursor position immediately for arrow keys
  if (['ArrowLeft', 'ArrowRight'].includes(event.key)) {
    // Wait for the browser to update the selection
    nextTick(() => {
      const newPosition = event.target.selectionStart
      cursorPosition.value = newPosition
      updateSuggestionState(newPosition)
    })
    return
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
    const phrases = userStore.phraseHistory.phrases
    const position = event.target.selectionStart
    
    // Determine which phrase we're in based on cursor position
    let currentPhrase = null
    let phraseIndex = null
    
    Object.entries(phrases).forEach(([index, phrase]) => {
      if (position >= phrase.start && position <= phrase.end) {
        currentPhrase = phrase
        phraseIndex = parseInt(index)
      }
    })

    // Check if cursor is within a phrase
    if (currentPhrase) {
      console.log('Cursor in phrase:', currentPhrase, 'at index:', phraseIndex)
      
      // If we're showing all suggestions for a different phrase, reset
      if (showingAllSuggestionsForIndex.value !== null && 
          showingAllSuggestionsForIndex.value !== phraseIndex) {
        resetSuggestionState()
      }
      
      if (!showAllSuggestions.value) {
        // First down arrow press - show all suggestions
        showAllSuggestions.value = true
        showSuggestions.value = true
        selectedSuggestionIndex.value = 0
        showingAllSuggestionsForIndex.value = phraseIndex
        console.log('Showing all suggestions for index:', phraseIndex)
        
        // Add one-time event listener to reset state when input loses focus
        const resetState = () => {
          resetSuggestionState()
          event.target.removeEventListener('blur', resetState)
        }
        event.target.addEventListener('blur', resetState, { once: true })
      } else {
        // Subsequent down arrow presses - navigate through suggestions
        selectedSuggestionIndex.value = Math.min(
          selectedSuggestionIndex.value + 1,
          filteredSuggestions.value.length - 1
        )
      }
      return
    }

    // Regular suggestion behavior
    if (!showSuggestions.value) {
      showSuggestions.value = true
    } else {
      selectedSuggestionIndex.value = Math.min(
        selectedSuggestionIndex.value + 1,
        filteredSuggestions.value.length - 1
      )
    }
  } else if (event.key === 'ArrowUp' && showSuggestions.value) {
    event.preventDefault()
    if (selectedSuggestionIndex.value <= 0) {
      selectedSuggestionIndex.value = -1  // Clear selection
    } else {
      selectedSuggestionIndex.value = Math.max(selectedSuggestionIndex.value - 1, -1)
    }
  } else if (event.key === 'Enter' && selectedSuggestionIndex.value >= 0) {
    event.preventDefault()
    selectSuggestion(filteredSuggestions.value[selectedSuggestionIndex.value])
    selectedSuggestionIndex.value = -1
  }

  // Handle escape key to restore the last deleted phrase
  if (event.key === 'Escape') {
    const lastEntry = userStore.phraseHistory.entries.slice(-1)[0]
    if (lastEntry?.phrases) {
      
      // Reconstruct the phrase array and update the store
      searchQuery.value = { fullString } = buildFullString(lastEntry.phrases)
      userStore.$patch((state) => {
        state.phraseHistory.phrases = lastEntry.phrases
      })
    }
    
    // Reset suggestion state after restoring
    showSuggestions.value = false
    selectedSuggestionIndex.value = -1
  }

  // Add space key handling before other key checks
  if (event.key === ' ') {
    const phrases = userStore.phraseHistory.phrases
    const currentListType = wordLists.sequence[currentWordIndex.value]
    const suggestions = wordLists.lists[currentListType] || []
    
    // Check if we're at the end of a valid phrase
    const currentPhrase = phrases[currentWordIndex.value]
    const isAtPhraseEnd = currentPhrase && 
      cursorPosition.value === currentPhrase.end + 1

    // If we're at the end of a valid phrase, allow the space
    if (isAtPhraseEnd) {
      return // Allow the space by not preventing default
    }
    
    // Get the current word being typed (only if not at a phrase end)
    const currentInput = getCurrentInputAtCursor().trim()
    
    if (currentInput) {
      // Find exact matches
      const exactMatch = suggestions.find(s => 
        s.toLowerCase() === currentInput.toLowerCase()
      )

      // Only prevent default and select if it's an exact match
      if (exactMatch) {
        selectSuggestion(exactMatch)
        return
      }
    }
    
    // Allow the space in all other cases
    return
  }

  // Reset showAllSuggestions when user starts typing
  if (event.key.length === 1 || event.key === 'Backspace') {
    showAllSuggestions.value = false
  }
}

// Add these helper functions
const getSuggestionKey = (suggestion) => {
  return typeof suggestion === 'string' ? suggestion : suggestion.text
}

const getSuggestionText = (suggestion) => {
  return typeof suggestion === 'string' ? suggestion : suggestion.text
}

const isCustomSuggestion = (suggestion) => {
  return typeof suggestion === 'object' && suggestion.isCustom
}

// Also add a watch for showAllSuggestions changes
watch(showAllSuggestions, (newValue) => {
  console.log('showAllSuggestions changed:', newValue) // Debug log
})

// Add debug watch
watch([showAllSuggestions, showingAllSuggestionsForIndex], ([showAll, forIndex]) => {
  console.log('State changed:', { showAll, forIndex, currentIndex: currentWordIndex.value })
})
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
        :placeholder="currentWordIndex === 0 ? 'most popular post' : '...'"
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
          :key="getSuggestionKey(suggestion)"
          class="suggestion-item"
          :class="{
            'suggestion-selected': index === selectedSuggestionIndex,
            'custom-suggestion': isCustomSuggestion(suggestion)
          }"
          @mousedown.prevent="selectSuggestion(getSuggestionText(suggestion))"
          @mouseover="selectedSuggestionIndex = index"
          @mouseout="selectedSuggestionIndex = -1"
          tabindex="0"
        >
          <span v-if="isCustomSuggestion(suggestion)" class="custom-icon">+</span>
          {{ getSuggestionText(suggestion) }}
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
