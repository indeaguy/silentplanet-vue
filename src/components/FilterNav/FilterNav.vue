<script setup>
import { inject, defineEmits, ref, watch, computed, nextTick } from 'vue'
import { useNavStore } from '../../stores/nav'
import { buildFullString } from './helpers/buildFullString'
import { getSuggestionKey, getSuggestionText, isCustomSuggestion } from './helpers/suggestionHelpers'

// placeholder for region stuff

//const regionOptions = inject('regionOptions')
const emit = defineEmits(['update-region-id'])
// @TODO bad code smell? value being copied?
// Selected Region Id
const selectedRegion = inject('selectedRegion')
const selectedValue = ref(selectedRegion) // Initialize with the injected value
// Watch for changes in the selection and emit an event
// @TODO Don't need this watch, it's being handled by the reference
watch(selectedValue, (newValue) => {
  emit('update-region-id', newValue)
})


/**
 * Stores involved
 */

const navStore = useNavStore()


/**
 * Vue reactive values
 */

// reactive references

// Add a new ref to track when we want to show all suggestions
const showAllSuggestions = ref(false)
// Add new ref to track which phrase we're showing all suggestions for
const showingAllSuggestionsForIndex = ref(null)
const searchQuery = ref('')

const showSuggestions = ref(false)
const cursorPosition = ref(0)

// Add this with the other refs
const previousSuggestionIndex = ref(null)

// Add new ref for tracking which phrase suggestion the user currently has highlighted with the up/down arrows
const highlightedPhraseSuggestionIndex = ref(-1)


// computed properties

// Replace currentWordIndex computed property with simpler version
const currentWordIndex = computed(() => {
  const selectedPhrase = navStore.selectedPhrase
  if (selectedPhrase) {
    return selectedPhrase.index
  }
  
  const phrases = navStore.phraseHistory.phrases
  return Object.keys(phrases).length
})



// suggestions for new phrases for the current phrase in the sequence
const filteredSuggestions = computed(() => {
  const phrases = navStore.phraseHistory.phrases
  const currentListType = navStore.wordLists.sequence[currentWordIndex.value]
  const suggestions = navStore.wordLists.lists[currentListType] || []
  
  if (!showSuggestions.value) {
    return []
  }

  // If we have a selected phrase and showAllSuggestions is true, return all suggestions
  if (navStore.selectedPhrase && showAllSuggestions.value) {
    return suggestions
  }

  // If we have a selected phrase and currentInput, filter suggestions
  if (navStore.selectedPhrase && navStore.phraseHistory.currentInput) {
    const searchTerm = navStore.phraseHistory.currentInput.toLowerCase()
    const filteredSuggestions = suggestions.filter(s => 
      s.toLowerCase().includes(searchTerm)
    )
    return filteredSuggestions
  }

  if (Object.keys(phrases).length >= navStore.wordLists.sequence.length) {
    return []
  }

  // Rest of the existing logic...
  const selectedPhrase = navStore.selectedPhrase
  let currentInput = ''
  
  if (selectedPhrase) {
    currentInput = selectedPhrase.phrase
  } else {
    const cursorPos = cursorPosition.value
    let startPos = 0
    Object.values(phrases).forEach(phrase => {
      if (phrase.end < cursorPos) {
        startPos = Math.max(startPos, phrase.end + 1)
      }
    })
    
    let endPos = searchQuery.value.length
    Object.values(phrases).forEach(phrase => {
      if (phrase.start > cursorPos) {
        endPos = Math.min(endPos, phrase.start)
      }
    })
    
    currentInput = searchQuery.value.slice(startPos, endPos).trim()
  }

  const isAtWordBoundary = !currentInput
  if (isAtWordBoundary) {
    return suggestions
  }
  
  if (currentInput) {
    const searchTerm = currentInput.toLowerCase()
    const matchingSuggestions = suggestions.filter(s => 
      s.toLowerCase().includes(searchTerm)
    )
    
    const hasExactMatch = suggestions.some(s => 
      s.toLowerCase() === searchTerm
    )
    const isSelectedPhrase = phrases[currentWordIndex.value]?.phrase.toLowerCase() === searchTerm

    if (searchTerm && 
        !hasExactMatch && 
        !isSelectedPhrase && 
        (matchingSuggestions.length === 0 || currentListType === 'location')) {
      matchingSuggestions.push({
        text: currentInput,
        isCustom: true
      })
    }
    
    return matchingSuggestions
  }
  
  return suggestions
})


// Modified selectSuggestion to pass phrases
const selectSuggestion = async (suggestion, customListType = null) => {
  const suggestionText = typeof suggestion === 'object' ? suggestion.text : suggestion
  const currentListType = navStore.wordLists.sequence[currentWordIndex.value] || 
    navStore.wordLists.sequence[navStore.wordLists.sequence.length - 1]
  
  // Build the full string with the new suggestion using the helper
  const { fullString, phraseArray } = buildFullString(
    navStore.phraseHistory.phrases, 
    suggestionText,
    {
      sequence: navStore.wordLists.sequence,
      addSpaceAfter: navStore.wordLists.addSpaceAfter,
      currentIndex: currentWordIndex.value
    }
  )
  
  // Check if this is a custom phrase
  const isCustom = currentListType ? 
    !navStore.wordLists.lists[currentListType].includes(suggestionText) : 
    true
  
  if (isCustom) {
    customListType = customListType || currentListType
  }
  
  // Update the store first
  await navStore.addPhraseEntry(fullString, phraseArray, currentWordIndex.value, customListType, currentListType)
  
  // Update the UI and cursor position
  searchQuery.value = fullString
  const newPosition = fullString.length
  cursorPosition.value = newPosition
  await navStore.updateCursorPosition(newPosition)
  
  // Reset suggestion state
  showAllSuggestions.value = false
  highlightedPhraseSuggestionIndex.value = -1
  
  // Don't reset showSuggestions here - let updateSuggestionState handle it
  await updateSuggestionState(newPosition)
  
  // Clear the current input after selecting a suggestion
  navStore.updateCurrentInput(null)
}


// Update resetSuggestionState
const resetSuggestionState = () => {
  showAllSuggestions.value = false;
  highlightedPhraseSuggestionIndex.value = -1;
  showingAllSuggestionsForIndex.value = null;
  // Do not reset showSuggestions here
};


const updateSuggestionState = async (position) => {
  // Update cursor position first
  cursorPosition.value = position;

  // Get currentIndex directly without IIFE
  const currentIndex = navStore.selectedPhrase ? 
    navStore.selectedPhrase.index : 
    Object.keys(navStore.phraseHistory.phrases).length;

  // Compare with the previous index using ref
  if (previousSuggestionIndex.value !== currentIndex) {
    resetSuggestionState();
  }

  // Update previousIndex ref for the next call
  previousSuggestionIndex.value = currentIndex;

  const phrases = navStore.phraseHistory.phrases;
  const currentListType = navStore.wordLists.sequence[currentIndex];
  const suggestions = navStore.wordLists.lists[currentListType] || [];

  const isStartingFresh = Object.keys(phrases).length === 0;
  const isValidPhrase = !navStore.selectedPhrase || suggestions.includes(navStore.selectedPhrase.phrase);

  const hasLeadingSpace =
    position === 0 ||
    searchQuery.value[position - 1] === ' ' ||
    (navStore.selectedPhrase && position === navStore.selectedPhrase.end + 1);

  const isExactMatch =
    navStore.selectedPhrase &&
    phrases[currentIndex]?.phrase === navStore.selectedPhrase.phrase;

  const shouldShowSuggestions =
    (
      isStartingFresh ||
      (hasLeadingSpace && !isExactMatch) ||
      (isValidPhrase && !isExactMatch)
    ) &&
    (Object.keys(phrases).length < navStore.wordLists.sequence.length ||
      (navStore.phraseHistory.currentInput !== null && navStore.selectedPhrase !== null));

  // Update showSuggestions based on the computed flag
  // Only set showSuggestions if it changes; avoid unnecessary updates
  if (showSuggestions.value !== shouldShowSuggestions) {
    showSuggestions.value = shouldShowSuggestions;
  }

  if (shouldShowSuggestions && suggestions.length > 0) {
    highlightedPhraseSuggestionIndex.value = 0;
  }
}


const handleClick = async (event) => {
  await nextTick()
  const clickPosition = event.target.selectionStart
  await navStore.updateCursorPosition(clickPosition)
  await updateSuggestionState(clickPosition)
}


// Update handleInput to manage selectedPhrase during typing
const handleInput = async (event) => {
  resetSuggestionState()
  const inputPosition = event.target.selectionStart
  const selectedPhrase = navStore.selectedPhrase ? { ...navStore.selectedPhrase } : null
  
  if (selectedPhrase) {
    // Always work with a plain object copy
    const currentSelectedPhrase = { ...selectedPhrase }
    
    // Update currentInput based on whether this is the first character or not
    if (!navStore.phraseHistory.currentInput) {
      navStore.updateCurrentInput(event.data)
    } else if (event.data) {
      // Make sure we're getting the latest currentInput value
      const currentInput = navStore.phraseHistory.currentInput
      const newInput = currentInput + event.data
      console.log('Updating input:', { currentInput, newInput })
      navStore.updateCurrentInput(newInput)
    }
    
    // Force the selectedPhrase to stay on the original phrase
    navStore.$patch((state) => {
      state.phraseHistory.selectedPhrase = currentSelectedPhrase
    })
  } else {
    // Original handleInput behavior remains the same
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
  
  console.log('handleInput debug:', {
    inputPosition,
    selectedPhrase,
    currentInput: navStore.phraseHistory.currentInput,
    eventData: event.data,
    searchQuery: searchQuery.value,
    phrases: navStore.phraseHistory.phrases
  })

  await navStore.updateCursorPosition(inputPosition)
  await updateSuggestionState(inputPosition)
}


const handleFocusOut = (event) => {
  // Check if the related target is within our suggestions
  if (!event.currentTarget.contains(event.relatedTarget)) {
    showSuggestions.value = false
  }
}


// Add these new methods before handleKeydown
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


const handleSelectedTextDeletion = (event, selStart, selEnd, phrases) => {
  let firstAffectedIndex = null
  const affectedPhrases = []

  Object.entries(phrases).forEach(([index, phrase]) => {
    const isPartiallySelected = (
      (selStart <= phrase.end && selStart >= phrase.start) ||
      (selEnd <= phrase.end && selEnd >= phrase.start) ||
      (selStart <= phrase.start && selEnd >= phrase.end)
    )

    if (isPartiallySelected) {
      affectedPhrases.push(parseInt(index))
      if (firstAffectedIndex === null) {
        firstAffectedIndex = parseInt(index)
      }
    }
  })

  if (affectedPhrases.length > 0) {
    event.preventDefault()
    const newCursorPosition = phrases[firstAffectedIndex].start
    navStore.clearSubsequentPhrases(firstAffectedIndex)
    searchQuery.value = searchQuery.value.substring(0, newCursorPosition)
    showSuggestions.value = true
    cursorPosition.value = newCursorPosition
    navStore.updateCursorPosition(newCursorPosition)
    
    nextTick(() => {
      event.target.setSelectionRange(newCursorPosition, newCursorPosition)
    })
    return true
  }
  return false
}


const handlePhraseStartDeletion = (event, cursorPos, phrases) => {
  for (const [index, phrase] of Object.entries(phrases)) {
    if (cursorPos === phrase.start) {
      event.preventDefault()
      navStore.clearSubsequentPhrases(parseInt(index))
      searchQuery.value = searchQuery.value.substring(0, phrase.start)
      cursorPosition.value = phrase.start
      navStore.updateCursorPosition(cursorPosition.value)
      
      nextTick(() => {
        event.target.setSelectionRange(cursorPosition.value, cursorPosition.value)
      })
      return true
    }
  }
  return false
}


const handlePhraseDeletion = (event, cursorPos, phrases) => {
  let targetPhraseIndex = null
  Object.entries(phrases).forEach(([index, phrase]) => {
    if (cursorPos >= phrase.start && cursorPos <= phrase.end + 1) {
      targetPhraseIndex = parseInt(index)
    }
  })

  if (targetPhraseIndex !== null) {
    event.preventDefault()
    const deletedPhrase = phrases[targetPhraseIndex]
    const newCursorPosition = deletedPhrase.start
    navStore.clearSubsequentPhrases(targetPhraseIndex)
    searchQuery.value = searchQuery.value.substring(0, deletedPhrase.start)
    showSuggestions.value = true
    cursorPosition.value = newCursorPosition
    navStore.updateCursorPosition(newCursorPosition)
    
    nextTick(() => {
      event.target.setSelectionRange(newCursorPosition, newCursorPosition)
    })
    return true
  }
  return false
}



// Update the backspace section in handleKeydown
const handleKeydown = async (event) => {
  // Add undo/history navigation at the start
  if ((event.metaKey || event.ctrlKey) && event.key === 'z') {
    event.preventDefault();
    const newValue = navStore.navigateHistory(-1);
    if (newValue !== false) {
      searchQuery.value = newValue;
    }
    return;
  }

  if (event.key === 'ArrowUp' && !showSuggestions.value) {
    event.preventDefault();
    const newValue = navStore.navigateHistory(-1);
    if (newValue !== false) {
      searchQuery.value = newValue;
    }
    return;
  }

  // Add cursor position update for arrow keys at the start
  if (['ArrowLeft', 'ArrowRight'].includes(event.key)) {
    const currentPos = event.target.selectionEnd
    const newPosition = event.key === 'ArrowLeft' ? 
      Math.max(0, currentPos - 1) : 
      Math.min(searchQuery.value.length, currentPos + 1)
    
    navStore.updateCursorPosition(newPosition)
    cursorPosition.value = newPosition
    resetSuggestionState()
    updateSuggestionState(newPosition)
    return
  }

  if (event.key === 'Backspace') {
    // Add our new condition first
    if (navStore.phraseHistory.currentInput !== null) {
      const newInput = navStore.phraseHistory.currentInput.slice(0, -1)
      navStore.updateCurrentInput(newInput || null)
      return
    }

    const isAllSelected = event.target.selectionStart === 0 && 
                         event.target.selectionEnd === searchQuery.value.length
    const isAtStart = event.target.selectionStart === 0 && 
                     event.target.selectionEnd === 0

    if (isAllSelected || isAtStart) {
      handleClearAll(event)
      return
    }

    const phrases = navStore.phraseHistory.phrases
    const selStart = event.target.selectionStart
    const selEnd = event.target.selectionEnd
    const cursorPos = selStart

    // Try each deletion handler in sequence
    if (selStart !== selEnd) {
      if (handleSelectedTextDeletion(event, selStart, selEnd, phrases)) {
        return
      }
    }

    if (handlePhraseStartDeletion(event, cursorPos, phrases)) {
      return
    }

    if (handlePhraseDeletion(event, cursorPos, phrases)) {
      return
    }
  }

  // Handle suggestion navigation
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    
    // Check if cursor is within a phrase
    if (navStore.selectedPhrase) {
      if (!showAllSuggestions.value 
         || (!filteredSuggestions.value?.length && !showSuggestions.value)
      ) {
        // First down arrow press - show all suggestions
        showAllSuggestions.value = true
        showSuggestions.value = true
        highlightedPhraseSuggestionIndex.value = 0
        showingAllSuggestionsForIndex.value = navStore.selectedPhrase.index
      } else {
        // Subsequent down arrow presses - navigate through suggestions
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
      highlightedPhraseSuggestionIndex.value = Math.max(highlightedPhraseSuggestionIndex.value - 1, 0)
    }
  }
  
  if (event.key === 'Enter' && highlightedPhraseSuggestionIndex.value >= 0) {
    event.preventDefault()
    const selectedSuggestion = filteredSuggestions.value[highlightedPhraseSuggestionIndex.value]
    if (selectedSuggestion) {
      await selectSuggestion(selectedSuggestion)
      // highlightedPhraseSuggestionIndex.value = -1
      // showSuggestions.value = false
    }
  }

  // Handle escape key to restore the last deleted phrase
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
    
    // Reset suggestion state after restoring
    //showSuggestions.value = false
    highlightedPhraseSuggestionIndex.value = -1
  }

  // Reset showAllSuggestions when user starts typing
  if (event.key.length === 1 || event.key === 'Backspace') {
    showAllSuggestions.value = false
  }

  // Add space key handling
  if (event.key === ' ') {
    const phrases = navStore.phraseHistory.phrases
    const currentListType = navStore.wordLists.sequence[currentWordIndex.value]
    const suggestions = navStore.wordLists.lists[currentListType] || []
    
    // Check if we're at the end of a valid phrase
    const currentPhrase = phrases[currentWordIndex.value]
    const isAtPhraseEnd = currentPhrase && 
      cursorPosition.value === currentPhrase.end + 1

    // If we're at the end of a valid phrase, allow the space
    if (isAtPhraseEnd) {
      return // Allow the space by not preventing default
    }
    
    // Get the current word being typed
    const selectedPhrase = navStore.selectedPhrase
    const currentInput = selectedPhrase ? selectedPhrase.phrase : 
      searchQuery.value.slice(0, cursorPosition.value).split(' ').pop()
    
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
}



/**
 * Observers
 */

 watch(showSuggestions, (newVal, oldVal) => {
  console.error('showSuggestions changed:', {
    from: oldVal,
    to: newVal,
    trace: new Error().stack
  });
}, { deep: true, flush: 'sync' });


// Update the cursor position watch
watch(cursorPosition, async (newPosition) => {
  if (navStore.selectedPhrase && navStore.phraseHistory.currentInput === null) {
    showSuggestions.value = true
    showAllSuggestions.value = true
    highlightedPhraseSuggestionIndex.value = 0
  } else {
    showAllSuggestions.value = false
  }
})


// Update watcher to handle ongoing typing
watch(() => navStore.phraseHistory.currentInput, (newInput) => {
  if (!newInput || !navStore.selectedPhrase) return
  
  const selectedPhrase = navStore.selectedPhrase
  const phrases = { ...navStore.phraseHistory.phrases }
  const currentPhrase = phrases[selectedPhrase.index]
  
  // Rebuild the full string with updated positions
  let newString = ''
  let currentPosition = 0
  
  // Process phrases in order
  Object.keys(phrases)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .forEach(index => {
      index = parseInt(index)
      const phrase = phrases[index]
      
      // Add space if needed between phrases
      if (currentPosition > 0) {
        newString += ' '
        currentPosition++
      }
      
      if (index === selectedPhrase.index) {
        // Insert the current input instead of the selected phrase
        newString += newInput
        // Update phrase boundaries
        phrases[index] = {
          ...phrase,
          phrase: newInput,
          start: currentPosition,
          end: currentPosition + newInput.length - 1
        }
        currentPosition += newInput.length
      } else {
        // Keep existing phrase but update its position
        newString += phrase.phrase
        phrases[index] = {
          ...phrase,
          start: currentPosition,
          end: currentPosition + phrase.phrase.length - 1
        }
        currentPosition += phrase.phrase.length
      }
    })
  
  // Update the store with new phrase positions
  navStore.$patch((state) => {
    state.phraseHistory.phrases = phrases
  })
  
  // Update the input value
  searchQuery.value = newString
  
  // Calculate new cursor position at the end of the current input
  const newCursorPosition = phrases[selectedPhrase.index].end + 1
  
  // Restore cursor position after update
  nextTick(() => {
    const input = document.querySelector('.terminal-input')
    if (input) {
      input.setSelectionRange(newCursorPosition, newCursorPosition)
      cursorPosition.value = newCursorPosition
      navStore.updateCursorPosition(newCursorPosition)
    }
  })
})



// Update the watcher to be more aggressive about selecting the first option
watch([showSuggestions, filteredSuggestions], ([show, suggestions]) => {
  if (show && suggestions.length > 0) {
    highlightedPhraseSuggestionIndex.value = 0
  } else {
    highlightedPhraseSuggestionIndex.value = -1
  }
}, { immediate: true })









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
      <div v-if="showSuggestions && filteredSuggestions.length > 0" 
           class="suggestions"
           :key="currentWordIndex">
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

/* Optional hover effect to match DataDisplay */
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
