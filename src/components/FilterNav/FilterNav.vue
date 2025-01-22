<script setup>
/* --------------------------------------------------------------------------
 * Imports
 * ------------------------------------------------------------------------*/
import { inject, defineEmits, ref, watch, computed, nextTick, onMounted } from 'vue'
import { useNavStore } from '../../stores/nav'
import { buildFullString } from './helpers/buildFullString'
import { getSuggestionKey, getSuggestionText, isCustomSuggestion } from './helpers/suggestionHelpers'
import { useSuggestions } from './composables/useSuggestions'
import { handlePhraseDeletionLogic } from './helpers/phraseDeleteHelpers'
import { usePhraseHandling } from './composables/usePhraseHandling'


/* --------------------------------------------------------------------------
 * REGION STUFF - TEMPORARY
 * ------------------------------------------------------------------------*/
const emit = defineEmits(['update-region-id'])
const selectedRegion = inject('selectedRegion')

/**
 * We create a local copy of the selectedRegion value. 
 * Any updates to 'selectedValue' are emitted via 'update-region-id'.
 */
const selectedValue = ref(selectedRegion)
watch(selectedValue, (newValue) => {
  emit('update-region-id', newValue)
})


/* --------------------------------------------------------------------------
 * Stores
 * ------------------------------------------------------------------------*/
const navStore = useNavStore()


/* --------------------------------------------------------------------------
 * Refs
 * ------------------------------------------------------------------------*/
const searchQuery = ref('')
const cursorPosition = ref(0)
const inputElement = ref(null)


/* --------------------------------------------------------------------------
 * Computed
 * ------------------------------------------------------------------------*/
/**
 * currentWordIndex returns:
 *  - the index of navStore.selectedPhrase, OR
 *  - the number of phrases currently in the store if none is selected
 */
const currentWordIndex = computed(() => {
  const selectedPhrase = navStore.selectedPhrase
  if (selectedPhrase) {
    return selectedPhrase.index
  }
  const phrases = navStore.phraseHistory.phrases
  return Object.keys(phrases).length
})

const currentList = computed(() => {
  const currentListType = navStore.wordLists.sequence[currentWordIndex.value]
  return navStore.wordLists.lists[currentListType] || []
})

/**
 * Use the custom useSuggestions composable
 */
const {
  showAllSuggestions,
  showingAllSuggestionsForIndex,
  showSuggestions,
  highlightedPhraseSuggestionIndex,
  filteredSuggestions,
  resetSuggestionState,
  updateSuggestionState,
  selectSuggestion
} = useSuggestions(navStore, currentWordIndex, searchQuery, cursorPosition, currentList)

/**
 * Computed property to determine the suggestions class based on the current list type
 */
const getSuggestionsClass = computed(() => {
  const currentListType = navStore.wordLists.sequence[currentWordIndex.value]
  const customListClass = navStore.wordLists.lists[currentListType]?.customListClass
  return customListClass ? `suggestions-${customListClass}` : ''
})

/**
 * Computed property to determine if we should show the cursor tab
 */
const showCursorTab = computed(() => {
  return showSuggestions.value && filteredSuggestions.value.length > 0
})

/**
 * Computed property to calculate the cursor tab position
 */
const cursorTabPosition = computed(() => {
  if (!inputElement.value) {
    return 0
  }
  
  // If there's a selected phrase, use its start position
  if (navStore.selectedPhrase) {
    const textUpToCursor = searchQuery.value.substring(0, navStore.selectedPhrase.start)
    const span = document.createElement('span')
    span.style.font = window.getComputedStyle(inputElement.value).font
    span.style.visibility = 'hidden'
    span.style.position = 'absolute'
    span.textContent = textUpToCursor
    document.body.appendChild(span)
    const width = span.offsetWidth
    document.body.removeChild(span)
    const inputPadding = parseInt(window.getComputedStyle(inputElement.value).paddingLeft)
    return width + inputPadding
  }
  
  // If no selected phrase, find the end of the last phrase
  const phrases = navStore.phraseHistory.phrases
  const phraseKeys = Object.keys(phrases).map(Number).sort((a, b) => a - b)
  
  if (phraseKeys.length > 0) {
    const lastPhrase = phrases[phraseKeys[phraseKeys.length - 1]]
    const textUpToCursor = searchQuery.value.substring(0, lastPhrase.end + 1) // +1 for space after phrase
    const span = document.createElement('span')
    span.style.font = window.getComputedStyle(inputElement.value).font
    span.style.visibility = 'hidden'
    span.style.position = 'absolute'
    span.textContent = textUpToCursor
    document.body.appendChild(span)
    const width = span.offsetWidth
    document.body.removeChild(span)
    const inputPadding = parseInt(window.getComputedStyle(inputElement.value).paddingLeft)
    return width + inputPadding
  }
  
  // If no phrases at all, return the initial padding
  return parseInt(window.getComputedStyle(inputElement.value).paddingLeft)
})

/**
 * Computed property to get the current list's display label
 */
const getCurrentListLabel = computed(() => {
  const currentListType = navStore.wordLists.sequence[currentWordIndex.value]
  const list = navStore.wordLists.lists[currentListType]
  return list?.id || currentListType
})


/* --------------------------------------------------------------------------
 * Methods
 * ------------------------------------------------------------------------*/

/**
 * When the input is clicked, reset cursor and suggestions.
 */
const handleClick = async (event) => {
  await nextTick()
  const clickPosition = event.target.selectionStart
  await navStore.updateCursorPosition(clickPosition)
  await updateSuggestionState(clickPosition)
}

/**
 * Handle user input in the text field.
 */
const handleInput = async (event) => {
  resetSuggestionState()
  const inputPosition = event.target.selectionStart
  const selectedPhrase = navStore.selectedPhrase ? { ...navStore.selectedPhrase } : null

  if (selectedPhrase) {
    // Maintain a plain object for the selected phrase
    const currentSelectedPhrase = { ...selectedPhrase }

    // Update currentInput based on typed character
    if (!navStore.phraseHistory.currentInput) {
      navStore.updateCurrentInput(event.data)
    } else if (event.data) {
      const newInput = navStore.phraseHistory.currentInput + event.data
      navStore.updateCurrentInput(newInput)
    }

    // Force the store to keep the original selected phrase
    navStore.$patch((state) => {
      state.phraseHistory.selectedPhrase = currentSelectedPhrase
    })
  } else {
    // Original handleInput behavior
    const phrases = navStore.phraseHistory.phrases
    let startPos = 0
    Object.values(phrases).forEach(phrase => {
      if (phrase.end < inputPosition) {
        startPos = Math.max(startPos, phrase.end + 1)
      }
    })

    let endPos = searchQuery.value.length
    Object.values(phrases).forEach(phrase => {
      if (phrase.start > inputPosition) {
        endPos = Math.min(endPos, phrase.start)
      }
    })

    const currentInput = searchQuery.value.slice(startPos, endPos).trim()
    navStore.updateCurrentInput(currentInput || null)
  }

  await navStore.updateCursorPosition(inputPosition)
  await updateSuggestionState(inputPosition)
}

/**
 * Hide suggestions if the user clicks or tabs outside.
 */
const handleFocusOut = (event) => {
  if (!event.currentTarget.contains(event.relatedTarget)) {
    showSuggestions.value = false
  }
}

/**
 * Clears all phrases and resets the UI/position.
 */
const handleClearAll = (event) => {
  event.preventDefault()
  navStore.$patch((state) => {
    state.phraseHistory.phrases = {}
    state.phraseHistory.selectedPhrase = null
  })
  searchQuery.value = ''
  cursorPosition.value = 0
  navStore.updateCursorPosition(0)
}

/**
 * Keydown handler for navigation, deletion, suggestion selection, etc.
 */
const handleKeydown = async (event) => {
  // --------------------------------------------------------------------------
  // Undo/History
  // --------------------------------------------------------------------------
  if ((event.metaKey || event.ctrlKey) && event.key === 'z') {
    event.preventDefault()
    const newValue = navStore.navigateHistory(-1)
    if (newValue !== false) {
      searchQuery.value = newValue
    }
    return
  }

  if (event.key === 'ArrowUp' && !showSuggestions.value) {
    event.preventDefault()
    const newValue = navStore.navigateHistory(-1)
    if (newValue !== false) {
      searchQuery.value = newValue
    }
    return
  }

  // --------------------------------------------------------------------------
  // Arrow keys to move cursor
  // --------------------------------------------------------------------------
  if (['ArrowLeft', 'ArrowRight'].includes(event.key)) {
    const currentPos = event.target.selectionEnd
    const newPosition = event.key === 'ArrowLeft'
      ? Math.max(0, currentPos - 1)
      : Math.min(searchQuery.value.length, currentPos + 1)

    navStore.updateCursorPosition(newPosition)
    cursorPosition.value = newPosition
    resetSuggestionState()
    updateSuggestionState(newPosition)
    return
  }

  // --------------------------------------------------------------------------
  // Backspace handling: Clear all or handle phrase deletion
  // --------------------------------------------------------------------------
  if (event.key === 'Backspace') {
    if (navStore.phraseHistory.currentInput !== null) {
      const newInput = navStore.phraseHistory.currentInput.slice(0, -1)
      navStore.updateCurrentInput(newInput || null)
      return
    }

    const isAllSelected = (
      event.target.selectionStart === 0 && 
      event.target.selectionEnd === searchQuery.value.length
    )
    const isAtStart = (
      event.target.selectionStart === 0 && 
      event.target.selectionEnd === 0
    )

    if (isAllSelected || isAtStart) {
      handleClearAll(event)
      return
    }

    const selStart = event.target.selectionStart
    const selEnd = event.target.selectionEnd
    const context = {
      event,
      navStore,
      searchQuery,
      cursorPosition,
      showSuggestions,
      nextTick
    }

    const handled = handlePhraseDeletionLogic({ selStart, selEnd, context })
    if (handled) {
      return
    }
  }

  // --------------------------------------------------------------------------
  // Suggestion navigation: ArrowDown / ArrowUp / Enter
  // --------------------------------------------------------------------------
  if (event.key === 'ArrowDown') {
    event.preventDefault()

    // If the cursor is within a phrase
    if (navStore.selectedPhrase) {
      const shouldShowAllSuggestions = (
        !showAllSuggestions.value 
        || (!filteredSuggestions.value?.length && !showSuggestions.value)
      ) && !navStore.phraseHistory.currentInput

      if (shouldShowAllSuggestions) {
        // First ArrowDown press - show all suggestions
        showSuggestions.value = true
        showAllSuggestions.value = true
        highlightedPhraseSuggestionIndex.value = 0
        showingAllSuggestionsForIndex.value = navStore.selectedPhrase.index
      } else {
        // Navigate through the list
        highlightedPhraseSuggestionIndex.value = Math.min(
          highlightedPhraseSuggestionIndex.value + 1,
          filteredSuggestions.value.length - 1
        )
      }
      return
    }

    // Regular suggestion behavior
    if (!showSuggestions.value) {
      showSuggestions.value = true
      highlightedPhraseSuggestionIndex.value = 0
    } else {
      highlightedPhraseSuggestionIndex.value = Math.min(
        highlightedPhraseSuggestionIndex.value + 1,
        filteredSuggestions.value.length - 1
      )
    }
  }

  if (event.key === 'ArrowUp' && showSuggestions.value) {
    event.preventDefault()
    if (highlightedPhraseSuggestionIndex.value <= 0) {
      highlightedPhraseSuggestionIndex.value = -1  // Clear selection
      showSuggestions.value = false
    } else {
      highlightedPhraseSuggestionIndex.value = Math.max(
        highlightedPhraseSuggestionIndex.value - 1, 
        0
      )
    }
  }

  // Selecting a suggestion with Enter
  if (event.key === 'Enter') {
    if (highlightedPhraseSuggestionIndex.value >= 0) {
      event.preventDefault()
      const selectedSuggestion = filteredSuggestions.value[highlightedPhraseSuggestionIndex.value]
      if (selectedSuggestion) {
        await selectSuggestion(selectedSuggestion)
      }
    } else if (showSuggestions.value) {
      // If suggestions are shown but none are highlighted, hide them
      // @TODO: add a use-case here to not hide suggestions when a subquery is expecting a parameter
      showSuggestions.value = false
    }
    return
  }

  // --------------------------------------------------------------------------
  // Escape key to restore the last deleted phrase
  // --------------------------------------------------------------------------
  if (event.key === 'Escape') {
    const lastEntry = navStore.phraseHistory.entries.slice(-1)[0]
    if (lastEntry?.phrases) {
      const { fullString } = buildFullString(
        lastEntry.phrases,
        null,
        {
          currentIndex: currentWordIndex.value,
          navStore
        }
      )
      searchQuery.value = fullString
      navStore.$patch((state) => {
        state.phraseHistory.phrases = lastEntry.phrases
      })
    }
    highlightedPhraseSuggestionIndex.value = -1
  }

  // --------------------------------------------------------------------------
  // Reset showAllSuggestions when user types or backspaces
  // --------------------------------------------------------------------------
  if (event.key.length === 1 || event.key === 'Backspace') {
    showAllSuggestions.value = false
  }

  // --------------------------------------------------------------------------
  // Space key handling
  // --------------------------------------------------------------------------
  if (event.key === ' ') {
    const { phrases, currentInput } = navStore.phraseHistory
    const suggestions = currentList.value
    const currentPhrase = phrases[currentWordIndex.value]
    const isAtPhraseEnd = currentPhrase && (cursorPosition.value === currentPhrase.end + 1)

    // If at the end of a valid phrase, allow space
    if (isAtPhraseEnd) {
      return
    }

    // Get the current word typed so far
    const typedInput = navStore.selectedPhrase 
      ? navStore.selectedPhrase.phrase
      : searchQuery.value.slice(0, cursorPosition.value).split(' ').pop()

    // If there's an exact match, select it and prevent the space
    if (typedInput && suggestions.length > 0) {
      const exactMatch = suggestions.find(s => s.toLowerCase() === typedInput.toLowerCase())
      if (exactMatch) {
        selectSuggestion(exactMatch)
        return
      }
    }

    // Otherwise, allow space
    return
  }
}


/* --------------------------------------------------------------------------
 * Observers
 * ------------------------------------------------------------------------*/
watch(cursorPosition, async (newPosition) => {
  if (navStore.selectedPhrase && navStore.phraseHistory.currentInput === null) {
    showSuggestions.value = true
    showAllSuggestions.value = true
    highlightedPhraseSuggestionIndex.value = 0
  } else {
    showAllSuggestions.value = false
  }
})

/**
 * Initialize phrase handling composable with required dependencies
 * Used to manage phrase positions and updates in the search input
 */
const phraseHandling = usePhraseHandling({
  navStore,
  searchQuery,
  cursorPosition
})

/**
 * Watch for changes to the current input text
 * When a phrase is being edited, this updates:
 * - The positions of all phrases
 * - The complete search string
 * - The cursor position
 */
watch(
  () => navStore.phraseHistory.currentInput,
  (newInput) => {
    // Only process if we have both input and a selected phrase
    if (!newInput || !navStore.selectedPhrase) return

    // Get updated positions and text from phrase handler
    const { newString, phrases, newCursorPosition } = phraseHandling.updatePhrasePositions(
      navStore.selectedPhrase,
      newInput
    )

    // Update the store with new phrase positions
    navStore.$patch((state) => {
      state.phraseHistory.phrases = phrases
    })

    // Update the visible search input text
    searchQuery.value = newString

    // Move cursor to end of edited phrase
    navStore.updateCursorPosition(newCursorPosition)
  }
)

watch(
  [showSuggestions, filteredSuggestions],
  ([show, suggestions]) => {
    if (show && suggestions.length > 0) {
      highlightedPhraseSuggestionIndex.value = 0
    } else {
      highlightedPhraseSuggestionIndex.value = -1
    }
  },
  { immediate: true }
)

watch(
  () => navStore.phraseHistory.cursorPosition,
  (newPosition) => {
    nextTick(() => {
      const input = document.querySelector('.terminal-input')
      if (input) {
        input.setSelectionRange(newPosition, newPosition)
        cursorPosition.value = newPosition
      }
    })
  }
)

// Update template ref when component mounts
onMounted(() => {
  inputElement.value = document.querySelector('.terminal-input')
})
</script>

<template>
  <div id="filter-nav">
    <p class="content-message">
      Filter Nav region: {{ selectedRegion.name }}
    </p>

    <div class="terminal-input-container">
      <!-- Add debug info temporarily -->
      <!-- <div style="position: absolute; top: -40px; color: red; font-size: 10px;">
        Cursor: {{ cursorPosition }}, Tab: {{ cursorTabPosition }}
      </div> -->
      
      <div 
        v-if="showCursorTab"
        class="cursor-tab"
        :class="getSuggestionsClass"
        :style="{ left: cursorTabPosition + 'px' }"
      >
        {{ getCurrentListLabel }}
      </div>

      <input 
        ref="inputElement"
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
      />

      <!-- Suggestions list -->
      <div
        v-if="showSuggestions && filteredSuggestions.length > 0"
        class="suggestions"
        :class="getSuggestionsClass"
        :key="currentWordIndex"
      >
        <div
          v-for="(suggestion, index) in filteredSuggestions"
          :key="getSuggestionKey(suggestion)"
          class="suggestion-item"
          :class="{
            'suggestion-selected': index === highlightedPhraseSuggestionIndex,
            'custom-suggestion': isCustomSuggestion(suggestion)
          }"
          @mousedown.prevent="selectSuggestion(getSuggestionText(suggestion))"
          @mouseover="highlightedPhraseSuggestionIndex = index"
          @mouseout="highlightedPhraseSuggestionIndex = -1"
          tabindex="0"
        >
          <span
            v-if="isCustomSuggestion(suggestion)"
            class="custom-icon"
          >
            +
          </span>
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
  animation-duration: 1.5s;
  animation-timing-function: cubic-bezier(0.5, 0, 0.5, 1);
  animation-delay: 0.8s;
  animation-play-state: paused;
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

.terminal-input:hover {
  border-color: rgba(0, 255, 0, 0.4);
  box-shadow: 0 0 5px rgba(0, 255, 0, 0.2);
}

.terminal-input:focus {
  border-color: rgba(0, 255, 0, 0.6);
  box-shadow: 0 0 8px rgba(0, 255, 0, 0.3);
  animation-play-state: running;
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

/* Add new suggestion list type styles */
.suggestions.suggestions-SortFilter {
  background: rgba(0, 0, 0, 0.8);
  border-color: rgba(255, 165, 0, 0.4); /* Orange tint */
}

.suggestions.suggestions-ContentType {
  background: rgba(0, 0, 0, 0.8);
  border-color: rgba(186, 156, 255, 0.4); /* Bright purple border */
}

.suggestions.suggestions-Location {
  background: rgba(0, 0, 0, 0.8);
  border-color: rgba(0, 191, 255, 0.4); /* Blue tint */
}

/* Add matching hover effects for each type */
.suggestions.suggestions-SortFilter .suggestion-item:hover,
.suggestions.suggestions-SortFilter .suggestion-selected {
  background: rgba(255, 165, 0, 0.2);
}

.suggestions.suggestions-ContentType .suggestion-item:hover,
.suggestions.suggestions-ContentType .suggestion-selected {
  background: rgba(186, 156, 255, 0.2); /* Bright purple background */
}

.suggestions.suggestions-Location .suggestion-item:hover,
.suggestions.suggestions-Location .suggestion-selected {
  background: rgba(0, 191, 255, 0.2);
}

.suggestion-item {
  padding: 0.5rem;
  color: #00ff00;
  cursor: pointer;
  font-family: monospace;
  transition: background-color 0.1s ease;
}

.suggestion-item:hover {
  background: rgba(0, 255, 0, 0.2);
}

.suggestion-selected {
  background: rgba(0, 255, 0, 0.2);
}

.custom-icon {
  margin-right: 4px;
}

.cursor-tab {
  position: absolute;
  top: -22px;
  padding: 2px 12px;
  font-size: 11px;
  text-transform: capitalize;
  background: rgba(0, 0, 0, 0.8);
  color: rgba(0, 255, 0, 0.8);
  font-family: monospace;
  z-index: 1000;
  clip-path: polygon(
    5px 0%,          /* top-left */
    100% 0%,         /* top-right */
    calc(100% - 5px) 100%,  /* bottom-right */
    0% 100%          /* bottom-left */
  );
  border: 1px solid rgba(0, 255, 0, 0.2);
  border-bottom: none;
  white-space: nowrap;
  min-width: 40px;
  text-align: center;
}

/* Cursor tab color variants */
.cursor-tab.suggestions-SortFilter {
  border-color: rgba(255, 165, 0, 0.4);
  color: rgba(255, 165, 0, 0.8);
}

.cursor-tab.suggestions-ContentType {
  border-color: rgba(186, 156, 255, 0.4); /* Bright purple border */
  color: rgba(186, 156, 255, 0.8); /* Bright purple text */
}

.cursor-tab.suggestions-Location {
  border-color: rgba(0, 191, 255, 0.4);
  color: rgba(0, 191, 255, 0.8);
}

#filter-nav {
  position: relative;
}
</style>