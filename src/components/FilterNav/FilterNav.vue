<script setup>
/* --------------------------------------------------------------------------
 * Imports
 * ------------------------------------------------------------------------*/
import { inject, defineEmits, ref, watch, computed, nextTick, onMounted } from 'vue'
import { useNavStore } from '../../stores/nav'
import { useThreePolysStore } from '../../stores/polys'
import { buildFullString } from './helpers/buildFullString'
import { getSuggestionKey, getSuggestionText, isCustomSuggestion } from './helpers/suggestionHelpers'
import { useSuggestions } from './composables/useSuggestions'
import { handlePhraseDeletionLogic, handleBackspaceKeydown } from './helpers/phraseDeleteHelpers'
import { usePhraseHandling } from './composables/usePhraseHandling'


/* --------------------------------------------------------------------------
 * REGION STUFF - TEMPORARY
 * ------------------------------------------------------------------------*/
const emit = defineEmits(['update-region-id'])
const threePolysStore = useThreePolysStore()
const selectedRegion = computed(() => threePolysStore.selectedMesh)

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

// Add new refs for date values
const dateValue = ref('')
const dateRangeStart = ref('')
const dateRangeEnd = ref('')

// Add new refs to track if date inputs should be visible
const showingDateInput = ref(false)
const showingDateRangeInput = ref(false)


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
  // Get the previous phrase to check for special sequences
  const prevPhraseIndex = currentWordIndex.value - 1
  const prevPhrase = navStore.phraseHistory.phrases[prevPhraseIndex]
  
  // If the previous phrase was a preposition, check its nextList property
  if (prevPhrase?.listType === 'preposition') {
    const prepositionValue = navStore.wordLists.lists.preposition.values
      .find(v => v.label === prevPhrase.phrase)
    
    // If the preposition defines a nextList, use that instead of the default sequence
    if (prepositionValue?.nextList) {
      return navStore.wordLists.lists[prepositionValue.nextList]
    }
  }
  
  // Default sequence handling
  const currentListType = navStore.wordLists.sequence[currentWordIndex.value]
  const list = navStore.wordLists.lists[currentListType]
  
  // Location visibility logic
  if (currentListType === 'location') {
    const prepositionPhrases = Object.values(navStore.phraseHistory.phrases)
      .filter(phrase => phrase.listType === 'preposition')
    
    const shouldShowLocation = prepositionPhrases.some(phrase => {
      const prepositionValue = navStore.wordLists.lists.preposition.values
        .find(v => v.label === phrase.phrase)
      return prepositionValue?.showLocation
    })
    
    return shouldShowLocation ? list : { ...list, values: [] }
  }
  
  return list || []
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
 * Computed property to determine if we should show the cursor tab
 */
const showCursorTab = computed(() => {
  // Original condition for suggestions
  const showForSuggestions = showSuggestions.value && filteredSuggestions.value.length > 0
  
  // Show for date inputs
  const showForDate = showDateInput.value || showDateRangeInput.value
  
  return showForSuggestions || showForDate
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
  const selectedPhrase = navStore.selectedPhrase
  
  // If we're showing a date input, show the appropriate label
  if (showDateInput.value) {
    return 'date'
  }
  if (showDateRangeInput.value) {
    return 'date range'
  }
  
  // Original logic for other types
  const currentListType = navStore.wordLists.sequence[currentWordIndex.value]
  const list = navStore.wordLists.lists[currentListType]
  return list?.id || currentListType
})

// Update the show computed properties to include the visibility refs
const showDateInput = computed(() => {
  const prevPhraseIndex = currentWordIndex.value - 1
  const prevPhrase = navStore.phraseHistory.phrases[prevPhraseIndex]
  
  if (prevPhrase?.listType === 'preposition') {
    const prepositionValue = navStore.wordLists.lists.preposition.values
      .find(v => v.label === prevPhrase.phrase)
    return prepositionValue?.nextList === 'date' && showingDateInput.value
  }
  return false
})

const showDateRangeInput = computed(() => {
  const prevPhraseIndex = currentWordIndex.value - 1
  const prevPhrase = navStore.phraseHistory.phrases[prevPhraseIndex]
  
  if (prevPhrase?.listType === 'preposition') {
    const prepositionValue = navStore.wordLists.lists.preposition.values
      .find(v => v.label === prevPhrase.phrase)
    return prepositionValue?.nextList === 'dateRange' && showingDateRangeInput.value
  }
  return false
})

/**
 * Update getSuggestionsClass to include date picker styles
 */
const getSuggestionsClass = computed(() => {
  // If showing date inputs, use their custom classes
  if (showDateInput.value) {
    return 'suggestions-DatePicker'
  }
  if (showDateRangeInput.value) {
    return 'suggestions-DateRangePicker'
  }
  
  // Original logic for other types
  const currentListType = navStore.wordLists.sequence[currentWordIndex.value]
  const customListClass = navStore.wordLists.lists[currentListType]?.customListClass
  return customListClass ? `suggestions-${customListClass}` : ''
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

  // Show date inputs if clicking on a date phrase
  const selectedPhrase = navStore.selectedPhrase
  if (selectedPhrase) {
    if (selectedPhrase.listType === 'date') {
      showingDateInput.value = true
    } else if (selectedPhrase.listType === 'dateRange') {
      showingDateRangeInput.value = true
    }
  }
}

/**
 * Handle user input in the text field.
 */
 const handleInput = async (event) => {
  resetSuggestionState()

  // event.data is `null` or an empty string for non-character keys (e.g. backspace, arrow, etc.)
  const typedChar = event.data
  if (!typedChar) {
    // If it wasn't a printable character, let handleKeydown handle it instead
    return
  }

  const inputPosition = event.target.selectionStart
  const selectedPhrase = navStore.selectedPhrase
  const phrases = navStore.phraseHistory.phrases

  // CASE 1: Space typed while a phrase is selected
  if (typedChar === ' ' && selectedPhrase) {
    // You had special "space handling" logic, so just re-compute the segment:
    const currentSegment = getCurrentSegment(searchQuery.value, phrases, inputPosition)
    navStore.updateCurrentInput(currentSegment || null)
  }
  // CASE 2: A non-space character typed while a phrase is selected
  else if (selectedPhrase) {
    const newInput = (navStore.phraseHistory.currentInput || '') + typedChar
    navStore.updateCurrentInput(newInput)
  }
  // CASE 3: No selected phrase -> just compute the new segment
  else {
    const currentSegment = getCurrentSegment(searchQuery.value, phrases, inputPosition)
    // Optionally append the typedChar directly if you want the user to see it right away, 
    // or just do the same logic as before:
    // e.g. const appendedSegment = currentSegment + typedChar
    // navStore.updateCurrentInput(appendedSegment || null)
    navStore.updateCurrentInput(currentSegment || null)
  }

  // Finally, update cursor pos & suggestions
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
    event.preventDefault();
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
    const context = {
      event,
      navStore,
      searchQuery,
      cursorPosition,
      showSuggestions,
      resetSuggestionState,
      updateSuggestionState,
      handleClearAll,
      nextTick
    };
    
    const handled = handleBackspaceKeydown({ event, context });
    if (handled) {
      event.preventDefault();
      return;
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
        // Handle both object and string suggestions
        const suggestionText = typeof selectedSuggestion === 'object' 
          ? (selectedSuggestion.label || selectedSuggestion.text) 
          : selectedSuggestion
        await selectSuggestion(suggestionText)
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
}

function getCurrentSegment(fullText, phrases, cursorPos) {
  let startPos = 0
  let endPos = fullText.length

  Object.values(phrases).forEach((phrase) => {
    if (phrase.end < cursorPos) {
      startPos = Math.max(startPos, phrase.end + 1)
    }
    if (phrase.start > cursorPos) {
      endPos = Math.min(endPos, phrase.start)
    }
  })

  return fullText.slice(startPos, endPos).trim()
}


/* --------------------------------------------------------------------------
 * Observers
 * ------------------------------------------------------------------------*/
// @TODO combine this with the nav store cursor position
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
// @TODO: we should be watching the searchQuery instead
watch(
  () => navStore.phraseHistory.currentInput,
  (newInput) => {
    // Only process if we have both input and a selected phrase
    if (!navStore.selectedPhrase) return

    // Get updated positions and text from phrase handler
    if (newInput === null) {
      return
    }

    // @TODO the issue is here...
    const { newString, phrases, newCursorPosition } = phraseHandling.updatePhrasePositions(
      navStore.selectedPhrase,
      newInput ?? ''  // Pass empty string if newInput is null
    )

    // Update the store with new phrase positions
    // @TODO don't do this here
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

// Update template ref when component mounts
onMounted(() => {
  inputElement.value = document.querySelector('.terminal-input')
})

// Update the date selection handlers to pass listType to selectSuggestion
const handleDateSelect = async (event) => {
  const formattedDate = new Date(event.target.value)
    .toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  await selectSuggestion(formattedDate, 'date')
  showingDateInput.value = false
}

const handleDateRangeSelect = async () => {
  if (dateRangeStart.value && dateRangeEnd.value) {
    const start = new Date(dateRangeStart.value)
      .toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    const end = new Date(dateRangeEnd.value)
      .toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    await selectSuggestion(`${start} and ${end}`, 'dateRange')
    showingDateRangeInput.value = false
  }
}

// Add a watcher for the currentWordIndex to show inputs when needed
watch(currentWordIndex, (newIndex) => {
  const prevPhrase = navStore.phraseHistory.phrases[newIndex - 1]
  
  if (prevPhrase?.listType === 'preposition') {
    const prepositionValue = navStore.wordLists.lists.preposition.values
      .find(v => v.label === prevPhrase.phrase)
    
    if (prepositionValue?.nextList === 'date') {
      showingDateInput.value = true
      showingDateRangeInput.value = false
    } else if (prepositionValue?.nextList === 'dateRange') {
      showingDateRangeInput.value = true
      showingDateInput.value = false
    }
  }
})

// Add cleanup when phrases are deleted
watch(() => navStore.phraseHistory.phrases, () => {
  // If no phrases contain date-related prepositions, hide the inputs
  const hasDatePreposition = Object.values(navStore.phraseHistory.phrases)
    .some(phrase => {
      if (phrase.listType === 'preposition') {
        const prepositionValue = navStore.wordLists.lists.preposition.values
          .find(v => v.label === phrase.phrase)
        return prepositionValue?.nextList === 'date' || prepositionValue?.nextList === 'dateRange'
      }
      return false
    })
  
  if (!hasDatePreposition) {
    showingDateInput.value = false
    showingDateRangeInput.value = false
  }
}, { deep: true })
</script>

<template>
  <div id="filter-nav">
    <p class="content-message">
      Filter Nav region: {{ selectedRegion.name }}
    </p>

    <div class="terminal-input-container">
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

      <!-- Add this after the existing suggestions list -->
      <div v-if="showDateInput" class="date-input-container">
        <input
          type="date"
          v-model="dateValue"
          class="date-input"
          @change="handleDateSelect"
        />
      </div>

      <div v-if="showDateRangeInput" class="date-range-container">
        <input
          type="date"
          v-model="dateRangeStart"
          class="date-input"
          @change="handleDateRangeSelect"
        />
        <span class="date-range-separator">and</span>
        <input
          type="date"
          v-model="dateRangeEnd"
          class="date-input"
          @change="handleDateRangeSelect"
        />
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

.date-input-container,
.date-range-container {
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
  padding: 0.5rem;
}

.date-range-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-input {
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(0, 255, 0, 0.2);
  color: #00ff00;
  font-family: monospace;
  padding: 0.25rem;
  font-size: 14px;
  outline: none;
  border-radius: 2px;
}

.date-range-separator {
  color: rgba(0, 255, 0, 0.8);
  font-family: monospace;
}

.date-input:hover {
  border-color: rgba(0, 255, 0, 0.4);
}

.date-input:focus {
  border-color: rgba(0, 255, 0, 0.6);
  box-shadow: 0 0 8px rgba(0, 255, 0, 0.3);
}

/* Add to your existing cursor tab variants */
.cursor-tab.suggestions-DatePicker {
  border-color: rgba(255, 105, 180, 0.4); /* Hot pink for dates */
  color: rgba(255, 105, 180, 0.8);
}

.cursor-tab.suggestions-DateRangePicker {
  border-color: rgba(255, 105, 180, 0.4);
  color: rgba(255, 105, 180, 0.8);
}
</style>