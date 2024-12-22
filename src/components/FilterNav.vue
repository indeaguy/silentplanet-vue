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
import { useNavStore } from '../stores/nav'
const navStore = useNavStore()

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

// Add a new ref to track when we want to show all suggestions
const showAllSuggestions = ref(false)

// Add new ref to track which phrase we're showing all suggestions for
const showingAllSuggestionsForIndex = ref(null)

// @TODO add validation for the existence of selectedRegion.name

const searchQuery = ref('')

const showSuggestions = ref(false)
const cursorPosition = ref(0)

// Replace currentWordIndex computed property with simpler version
const currentWordIndex = computed(() => {
  const selectedPhrase = navStore.selectedPhrase
  if (selectedPhrase) {
    return selectedPhrase.index
  }
  
  const phrases = navStore.phraseHistory.phrases
  return Object.keys(phrases).length
})

// Updated utility function
const buildFullString = (existingPhrases, suggestionText = null) => {
  const phraseArray = []
  
  // Build the phrase array
  for (let i = 0; i < navStore.wordLists.sequence.length; i++) {
    if (i === currentWordIndex.value && suggestionText !== null) {
      phraseArray[i] = suggestionText
    } else if (existingPhrases[i]) {
      phraseArray[i] = existingPhrases[i].phrase
    }
  }

  // Build and return the full string
  let fullString = phraseArray.filter(p => p).join(' ')
  
  // Add space if needed based on current list type
  const currentListType = navStore.wordLists.sequence[currentWordIndex.value] || 
    navStore.wordLists.sequence[navStore.wordLists.sequence.length - 1]
  if (navStore.wordLists.addSpaceAfter.includes(currentListType)) {
    fullString += ' '
  }

  return { fullString, phraseArray }
}

// Modified selectSuggestion to pass phrases
const selectSuggestion = async (suggestion, customListType = null) => {
  const suggestionText = typeof suggestion === 'object' ? suggestion.text : suggestion
  const currentListType = navStore.wordLists.sequence[currentWordIndex.value] || 
    navStore.wordLists.sequence[navStore.wordLists.sequence.length - 1]
  
  // Build the full string with the new suggestion
  const { fullString, phraseArray } = buildFullString(navStore.phraseHistory.phrases, suggestionText)
  
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
  selectedSuggestionIndex.value = -1
  
  // Don't reset showSuggestions here - let updateSuggestionState handle it
  await updateSuggestionState(newPosition)
}

// Update resetSuggestionState
const resetSuggestionState = () => {
  showAllSuggestions.value = false;
  selectedSuggestionIndex.value = -1;
  showingAllSuggestionsForIndex.value = null;
  // Do not reset showSuggestions here
};

// Add a watcher to track showSuggestions changes
watch(showSuggestions, (newVal, oldVal) => {
  console.error('showSuggestions changed:', {
    from: oldVal,
    to: newVal,
    trace: new Error().stack
  });
}, { deep: true, flush: 'sync' });

// Modify filteredSuggestions to be more resilient
const filteredSuggestions = computed(() => {
  const phrases = navStore.phraseHistory.phrases
  const currentListType = navStore.wordLists.sequence[currentWordIndex.value]
  const suggestions = navStore.wordLists.lists[currentListType] || []
  
  console.log('filteredSuggestions running:', {
    showSuggestions: showSuggestions.value,
    currentListType,
    suggestionsLength: suggestions.length,
    trace: new Error().stack
  })
  
  // Cache the value of showSuggestions to prevent reactivity issues
  const shouldShow = showSuggestions.value
  
  if (!shouldShow) {
    return []
  }

  if (showAllSuggestions.value && currentListType) {
    return suggestions
  }
  
  if (Object.keys(phrases).length >= navStore.wordLists.sequence.length) {
    return []
  }

  // Get current input from selected phrase or partial input
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

// Add this at the top with other refs
const previousIndex = ref(currentWordIndex.value);

const updateSuggestionState = async (position) => {
  // Update cursor position first
  cursorPosition.value = position;

  // Compute currentWordIndex once at the beginning
  const currentIndex = (() => {
    const selectedPhrase = navStore.selectedPhrase;
    if (selectedPhrase) {
      return selectedPhrase.index;
    }
    const phrases = navStore.phraseHistory.phrases;
    return Object.keys(phrases).length;a
  })();

  // Keep previousIndex within the function using a static variable
  updateSuggestionState.previousIndex = updateSuggestionState.previousIndex || currentIndex;

  // Compare with the previous index
  if (updateSuggestionState.previousIndex !== currentIndex) {
    resetSuggestionState();
  }

  // Update previousIndex for the next call
  updateSuggestionState.previousIndex = currentIndex;

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

  console.log('Suggestion State:', {
    currentWordIndex: currentIndex,
    position,
    hasLeadingSpace,
    isStartingFresh,
    isValidPhrase,
    isExactMatch,
    phraseCount: Object.keys(phrases).length,
    maxPhrases: navStore.wordLists.sequence.length,
    currentListType,
    selectedPhrase: navStore.selectedPhrase,
    searchQuery: searchQuery.value,
    shouldShowSuggestions: showSuggestions.value,
  });

  const shouldShowSuggestions =
    (
      isStartingFresh ||
      (hasLeadingSpace && !isExactMatch) ||
      (isValidPhrase && !isExactMatch)
    ) &&
    Object.keys(phrases).length < navStore.wordLists.sequence.length;

  console.log('Should show suggestions:', shouldShowSuggestions);

  // Update showSuggestions based on the computed flag
  // Only set showSuggestions if it changes; avoid unnecessary updates
  if (showSuggestions.value !== shouldShowSuggestions) {
    showSuggestions.value = shouldShowSuggestions;
    console.log('showSuggestions.value', showSuggestions.value);
  }

  if (shouldShowSuggestions && suggestions.length > 0) {
    selectedSuggestionIndex.value = 0;
  }
};

// Initialize previousIndex property
updateSuggestionState.previousIndex = null;

const handleClick = async (event) => {
  await nextTick()
  const clickPosition = event.target.selectionStart
  await navStore.updateCursorPosition(clickPosition)
  await updateSuggestionState(clickPosition)
}

// Update handleInput to include cursor position
const handleInput = async (event) => {
  resetSuggestionState()
  const inputPosition = event.target.selectionStart
  await navStore.updateCursorPosition(inputPosition)
  await updateSuggestionState(inputPosition)
}

const handleFocusOut = (event) => {
  // Check if the related target is within our suggestions
  if (!event.currentTarget.contains(event.relatedTarget)) {
    showSuggestions.value = false
  }
}

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

// Update handleKeydown to track cursor position for arrow keys
const handleKeydown = async (event) => {
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
    // Handle clear all cases first
    const isAllSelected = event.target.selectionStart === 0 && 
                         event.target.selectionEnd === searchQuery.value.length
    const isAtStart = event.target.selectionStart === 0 && 
                     event.target.selectionEnd === 0

    if (isAllSelected || isAtStart) {
      event.preventDefault()
      navStore.$patch((state) => {
        state.phraseHistory.phrases = {}
        state.phraseHistory.selectedPhrase = null
      })
      searchQuery.value = ''
      cursorPosition.value = 0
      navStore.updateCursorPosition(0)
      return
    }

    const phrases = navStore.phraseHistory.phrases
    const selStart = event.target.selectionStart
    const selEnd = event.target.selectionEnd
    const cursorPos = selStart

    // Handle text selection cases first
    if (selStart !== selEnd) {
      // Find all phrases that are fully or partially selected
      let firstAffectedIndex = null
      const affectedPhrases = []

      Object.entries(phrases).forEach(([index, phrase]) => {
        // Check if any part of the phrase is within selection
        const isPartiallySelected = (
          (selStart <= phrase.end && selStart >= phrase.start) || // Selection starts within phrase
          (selEnd <= phrase.end && selEnd >= phrase.start) || // Selection ends within phrase
          (selStart <= phrase.start && selEnd >= phrase.end) // Phrase is completely within selection
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

        // Get the position where we'll put the cursor after deletion
        const newCursorPosition = phrases[firstAffectedIndex].start

        // Clear all affected phrases and subsequent phrases
        const updatedPhrases = navStore.clearSubsequentPhrases(firstAffectedIndex)

        // Update the input value to remove cleared phrases
        searchQuery.value = searchQuery.value.substring(0, newCursorPosition)

        // Show suggestions for the first removed phrase type
        showSuggestions.value = true
        cursorPosition.value = newCursorPosition
        navStore.updateCursorPosition(newCursorPosition)

        // Set cursor position
        nextTick(() => {
          event.target.setSelectionRange(newCursorPosition, newCursorPosition)
        })

        return
      }
    }

    // Handle existing backspace logic for single phrases
    // Check if we're at a position right after a space that precedes a phrase
    for (const [index, phrase] of Object.entries(phrases)) {
      if (cursorPos === phrase.start) {
        event.preventDefault()
        
        // Clear this phrase and all subsequent phrases
        const updatedPhrases = navStore.clearSubsequentPhrases(parseInt(index))
        
        // Update input value to remove cleared phrases
        searchQuery.value = searchQuery.value.substring(0, phrase.start)
        cursorPosition.value = phrase.start
        
        // Update cursor position in store
        navStore.updateCursorPosition(cursorPosition.value)
        
        // Update cursor position in input
        nextTick(() => {
          event.target.setSelectionRange(cursorPosition.value, cursorPosition.value)
        })
        
        return
      }
    }

    // Find which phrase we're in or at the end of
    let targetPhraseIndex = null
    Object.entries(phrases).forEach(([index, phrase]) => {
      if (cursorPos >= phrase.start && cursorPos <= phrase.end + 1) {
        targetPhraseIndex = parseInt(index)
      }
    })

    if (targetPhraseIndex !== null) {
      event.preventDefault()

      // Get the phrase being deleted and its list type
      const deletedPhrase = phrases[targetPhraseIndex]
      const listType = navStore.wordLists.sequence[targetPhraseIndex]

      // Store the position where we'll put the cursor after deletion
      const newCursorPosition = deletedPhrase.start

      // Clear this phrase and all subsequent phrases
      const updatedPhrases = navStore.clearSubsequentPhrases(targetPhraseIndex)

      // Update the input value to remove cleared phrases
      searchQuery.value = searchQuery.value.substring(0, deletedPhrase.start)

      // Show suggestions for the deleted position
      showSuggestions.value = true
      cursorPosition.value = newCursorPosition
      navStore.updateCursorPosition(newCursorPosition)

      // Set cursor position to start of deleted phrase
      nextTick(() => {
        event.target.setSelectionRange(newCursorPosition, newCursorPosition)
      })

      return
    }
  }

  // Handle suggestion navigation
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    
    // Check if cursor is within a phrase
    if (navStore.selectedPhrase) {
      if (!showAllSuggestions.value) {
        // First down arrow press - show all suggestions
        showAllSuggestions.value = true
        showSuggestions.value = true
        selectedSuggestionIndex.value = 0
        showingAllSuggestionsForIndex.value = navStore.selectedPhrase.index
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
      selectedSuggestionIndex.value = 0
    } else {
      selectedSuggestionIndex.value = Math.min(
        selectedSuggestionIndex.value + 1,
        filteredSuggestions.value.length - 1
      )
    }
  }
  
  if (event.key === 'ArrowUp' && showSuggestions.value) {
    event.preventDefault()
    if (selectedSuggestionIndex.value <= 0) {
      selectedSuggestionIndex.value = -1  // Clear selection
      showSuggestions.value = false
    } else {
      selectedSuggestionIndex.value = Math.max(selectedSuggestionIndex.value - 1, 0)
    }
  }
  
  if (event.key === 'Enter' && selectedSuggestionIndex.value >= 0) {
    event.preventDefault()
    const selectedSuggestion = filteredSuggestions.value[selectedSuggestionIndex.value]
    if (selectedSuggestion) {
      await selectSuggestion(selectedSuggestion)
      //selectedSuggestionIndex.value = -1
      //showSuggestions.value = false
    }
  }

  // Handle escape key to restore the last deleted phrase
  if (event.key === 'Escape') {
    const lastEntry = navStore.phraseHistory.entries.slice(-1)[0]
    if (lastEntry?.phrases) {
      // Reconstruct the phrase array and update the store
      searchQuery.value = { fullString } = buildFullString(lastEntry.phrases)
      navStore.$patch((state) => {
        state.phraseHistory.phrases = lastEntry.phrases
      })
    }
    
    // Reset suggestion state after restoring
    //showSuggestions.value = false
    selectedSuggestionIndex.value = -1
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

// Update the cursor position watch
watch(cursorPosition, async (newPosition) => {
  if (navStore.selectedPhrase) {
    showSuggestions.value = true
    showAllSuggestions.value = true
    selectedSuggestionIndex.value = 0
  } else {
    showAllSuggestions.value = false
  }
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
      <div v-if="showSuggestions && filteredSuggestions.length > 0" 
           class="suggestions"
           :key="currentWordIndex">
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
