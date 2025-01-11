<script setup>
/* --------------------------------------------------------------------------
 * Imports
 * ------------------------------------------------------------------------*/
import { inject, defineEmits, ref, watch, computed, nextTick } from 'vue'
import { useNavStore } from '../../stores/nav'
import { buildFullString } from './helpers/buildFullString'
import { getSuggestionKey, getSuggestionText, isCustomSuggestion } from './helpers/suggestionHelpers'
import { useSuggestions } from './composables/useSuggestions'
import { handlePhraseDeletionLogic } from './helpers/phraseDeleteHelpers'


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
} = useSuggestions(navStore, currentWordIndex, searchQuery, cursorPosition)


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
      const noSuggestionsShown = !showAllSuggestions.value 
        || (!filteredSuggestions.value?.length && !showSuggestions.value)

      if (noSuggestionsShown) {
        // First ArrowDown press - show all suggestions
        showAllSuggestions.value = true
        showSuggestions.value = true
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
  if (event.key === 'Enter' && highlightedPhraseSuggestionIndex.value >= 0) {
    event.preventDefault()
    const selectedSuggestion = filteredSuggestions.value[highlightedPhraseSuggestionIndex.value]
    if (selectedSuggestion) {
      await selectSuggestion(selectedSuggestion)

      // Hide suggestions if no trailing space
      if (!searchQuery.value.endsWith(' ')) {
        showSuggestions.value = false
      }
    }
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
          sequence: navStore.wordLists.sequence,
          addSpaceAfter: navStore.wordLists.addSpaceAfter,
          currentIndex: currentWordIndex.value
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
    const currentListType = navStore.wordLists.sequence[currentWordIndex.value]
    const suggestions = navStore.wordLists.lists[currentListType] || []
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
    if (typedInput) {
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

watch(
  () => navStore.phraseHistory.currentInput,
  (newInput) => {
    if (!newInput || !navStore.selectedPhrase) return

    const selectedPhrase = navStore.selectedPhrase
    const phrases = { ...navStore.phraseHistory.phrases }

    // Rebuild the full string with updated positions
    let newString = ''
    let currentPosition = 0
    Object.keys(phrases)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .forEach(index => {
        const numericIndex = parseInt(index)
        const phrase = phrases[numericIndex]

        // Add space if needed between phrases
        if (currentPosition > 0) {
          newString += ' '
          currentPosition++
        }

        if (numericIndex === selectedPhrase.index) {
          // Insert the updated currentInput
          newString += newInput
          phrases[numericIndex] = {
            ...phrase,
            phrase: newInput,
            start: currentPosition,
            end: currentPosition + newInput.length - 1
          }
          currentPosition += newInput.length
        } else {
          // Keep existing phrase
          newString += phrase.phrase
          phrases[numericIndex] = {
            ...phrase,
            start: currentPosition,
            end: currentPosition + phrase.phrase.length - 1
          }
          currentPosition += phrase.phrase.length
        }
      })

    // Update the store
    navStore.$patch((state) => {
      state.phraseHistory.phrases = phrases
    })

    // Update the input value
    searchQuery.value = newString

    // Position cursor at the end of the current input
    const newCursorPosition = phrases[selectedPhrase.index].end + 1
    nextTick(() => {
      const input = document.querySelector('.terminal-input')
      if (input) {
        input.setSelectionRange(newCursorPosition, newCursorPosition)
        cursorPosition.value = newCursorPosition
        navStore.updateCursorPosition(newCursorPosition)
      }
    })
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
</script>

<template>
  <div
    id="filter-nav"
    @focusout="handleFocusOut"
    @mousedown.stop
    @click.stop
    @mousemove.stop
  >
    <p class="content-message">
      Filter Nav region: {{ selectedRegion.name }}
    </p>

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
      />

      <!-- Suggestions list -->
      <div
        v-if="showSuggestions && filteredSuggestions.length > 0"
        class="suggestions"
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
</style>