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
    adjectives: ['best', 'new', 'new cheese', 'random', 'most undisliked', 'most cheese flavored'],
    contentTypes: ['music', 'art', 'poem', 'post', 'ad'],
    preposition: ['in', 'from'],
    location: ['Canada', 'Lower Sackville', 'New York', 'Paris'],
    // Add more lists as needed
  },
  addSpaceAfter: ['adjectives', 'contentTypes', 'preposition'] // Words that should automatically add a space
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

// Update selectSuggestion function
const selectSuggestion = async (suggestion, customListType = null) => {
  const phrases = userStore.phraseHistory.phrases
  const phraseArray = []
  let fullString = ''
  
  // If suggestion is an object, get its text
  const suggestionText = typeof suggestion === 'object' ? suggestion.text : suggestion
  
  // Get current list type, defaulting to last sequence type if beyond bounds
  const currentListType = wordLists.sequence[currentWordIndex.value] || 
    wordLists.sequence[wordLists.sequence.length - 1]
  
  // Build the new phrase array and string
  for (let i = 0; i < wordLists.sequence.length; i++) {
    if (i === currentWordIndex.value) {
      phraseArray[i] = suggestionText
    } else if (phrases[i]) {
      phraseArray[i] = phrases[i].phrase
    }
  }
  
  fullString = phraseArray.filter(p => p).join(' ')
  
  // Determine if this is a custom phrase - handle case where we're beyond sequence bounds
  const isCustom = currentListType ? 
    !wordLists.lists[currentListType].includes(suggestionText) : 
    true
  
  if (isCustom) {
    customListType = customListType || currentListType
  }
  
  // Add space if needed - modified to always add space for custom phrases
  if (wordLists.addSpaceAfter.includes(currentListType) || 
      isCustom || 
      currentWordIndex.value < wordLists.sequence.length - 1) {
    fullString += ' '
  }
  
  // Update the store first
  await userStore.addPhraseEntry(fullString, phraseArray, currentWordIndex.value, customListType)
  
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
  await nextTick()
  updateSuggestionState(cursorPosition.value)
}

// Update filteredSuggestions computed property
const filteredSuggestions = computed(() => {
  const phrases = userStore.phraseHistory.phrases
  const currentListType = wordLists.sequence[currentWordIndex.value]
  const suggestions = wordLists.lists[currentListType] || []
  
  if (!showSuggestions.value || Object.keys(phrases).length >= wordLists.sequence.length) {
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

const updateSuggestionState = (position) => {
  cursorPosition.value = position
  const phrases = userStore.phraseHistory.phrases
  
  // Don't show suggestions if we've filled all available phrases
  if (Object.keys(phrases).length >= wordLists.sequence.length) {
    showSuggestions.value = false
    return
  }
  
  const currentPhrase = phrases[currentWordIndex.value]?.phrase || ''
  const currentListType = wordLists.sequence[currentWordIndex.value] || wordLists.sequence[wordLists.sequence.length - 1]
  const suggestions = wordLists.lists[currentListType] || []
  
  const isStartingFresh = Object.keys(phrases).length === 0
  const isValidPhrase = !currentPhrase || suggestions.includes(currentPhrase)
  
  // Set showSuggestions first
  const shouldShowSuggestions = (isStartingFresh || isValidPhrase) && 
    Object.keys(phrases).length < wordLists.sequence.length

  // Only update if the value is changing to avoid triggering the watcher unnecessarily
  if (showSuggestions.value !== shouldShowSuggestions) {
    showSuggestions.value = shouldShowSuggestions
  }

  // If showing suggestions, ensure first option is selected
  if (shouldShowSuggestions && suggestions.length > 0) {
    selectedSuggestionIndex.value = 0
  }
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
    const phraseText = inputText.substring(start, end).trim()
    if (!phraseText) {
      phrasesToDelete.push(index)
      
      // If it's a custom phrase, remove it from customPhrases
      if (phraseData.isCustom) {
        const listType = wordLists.sequence[index]
        if (userStore.phraseHistory.customPhrases[listType]) {
          userStore.phraseHistory.customPhrases[listType].delete(phraseData.phrase)
          
          // If the Set is empty, remove the entire list type entry
          if (userStore.phraseHistory.customPhrases[listType].size === 0) {
            delete userStore.phraseHistory.customPhrases[listType]
          }
        }
      }
    }
  }

  if (phrasesToDelete.length > 0) {
    const updatedPhrases = { ...phrases }
    phrasesToDelete.forEach(index => {
      delete updatedPhrases[index]
    })

    userStore.$patch((state) => {
      state.phraseHistory.phrases = updatedPhrases
      // Also update the customPhrases in the same patch
      state.phraseHistory.customPhrases = { ...userStore.phraseHistory.customPhrases }
    })

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
      
      // Create new phrases object without current phrase
      const updatedPhrases = { ...phrases }
      delete updatedPhrases[targetPhraseIndex]
      
      // Update store
      userStore.$patch((state) => {
        state.phraseHistory.phrases = updatedPhrases
      })
      
      // Rebuild search query, adding spaces after each phrase that:
      // 1. Is in addSpaceAfter list OR
      // 2. Has a subsequent phrase position available
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
      cursorPosition.value = searchQuery.value.length
      nextTick(() => {
        event.target.setSelectionRange(searchQuery.value.length, searchQuery.value.length)
      })
      
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
      showSuggestions.value = true
      // The watcher will handle selecting the first suggestion
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

  // Add space key handling before other key checks
  if (event.key === ' ') {
    const phrases = userStore.phraseHistory.phrases
    const currentListType = wordLists.sequence[currentWordIndex.value]
    const suggestions = wordLists.lists[currentListType] || []
    
    // Get the current word being typed
    const words = searchQuery.value.split(' ')
    let typedWord = ''
    let charCount = 0
    
    for (let i = 0; i < words.length; i++) {
      const wordStart = charCount
      const wordEnd = charCount + words[i].length
      
      if (cursorPosition.value >= wordStart && cursorPosition.value <= wordEnd) {
        typedWord = words[i]
        break
      }
      charCount += words[i].length + 1
    }
    
    if (typedWord) {
      // Find any matching suggestions (including partial matches)
      const matchingSuggestions = suggestions.filter(s => 
        s.toLowerCase().includes(typedWord.toLowerCase())
      )

      // Only prevent default and handle if:
      // 1. There's an exact match OR
      // 2. There are no matching suggestions at all (allowing custom phrase)
      if (matchingSuggestions.length === 0 || 
          matchingSuggestions.some(s => s.toLowerCase() === typedWord.toLowerCase())) {
        event.preventDefault()
        
        const exactMatch = suggestions.find(s => 
          s.toLowerCase() === typedWord.toLowerCase()
        )
        
        if (exactMatch) {
          selectSuggestion(exactMatch)
        } else if (matchingSuggestions.length === 0) {
          // Only handle custom phrases if there are no matching suggestions
          const prevIndex = currentWordIndex.value - 1
          const prevPhrase = phrases[prevIndex]
          
          if (prevPhrase?.isCustom && !suggestions.some(s => 
            s.toLowerCase() === typedWord.toLowerCase()
          )) {
            // Append to previous custom phrase
            const combinedPhrase = `${prevPhrase.phrase} ${typedWord}`
            const prevListType = wordLists.sequence[prevIndex]
            
            // Remove the current word from the input
            const updatedPhrases = { ...phrases }
            delete updatedPhrases[currentWordIndex.value]
            
            // Update the previous phrase
            updatedPhrases[prevIndex] = {
              ...prevPhrase,
              phrase: combinedPhrase,
              end: prevPhrase.start + combinedPhrase.length
            }
            
            // Update store
            userStore.$patch((state) => {
              state.phraseHistory.phrases = updatedPhrases
            })
            
            // Update custom phrases
            if (!userStore.phraseHistory.customPhrases[prevListType]) {
              userStore.phraseHistory.customPhrases[prevListType] = new Set()
            }
            userStore.phraseHistory.customPhrases[prevListType].delete(prevPhrase.phrase)
            userStore.phraseHistory.customPhrases[prevListType].add(combinedPhrase)
            
            // Update search query
            const phraseArray = []
            Object.entries(updatedPhrases).forEach(([index, data]) => {
              phraseArray[index] = data.phrase
            })
            searchQuery.value = phraseArray.filter(p => p).join(' ') + ' '
            cursorPosition.value = searchQuery.value.length
          } else {
            selectSuggestion(typedWord, currentListType)
          }
        }
      }
    }
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
