import { ref, computed } from 'vue'
import { buildFullString } from '../helpers/buildFullString'

export function useSuggestions(navStore, currentWordIndex, searchQuery, cursorPosition, currentList) {
  // ------------------------------------------------------------------------------
  // Reactive state
  // ------------------------------------------------------------------------------
  const showAllSuggestions = ref(false)
  const showingAllSuggestionsForIndex = ref(null)
  const showSuggestions = ref(false)
  const highlightedPhraseSuggestionIndex = ref(-1)
  const previousSuggestionIndex = ref(null)

  // ------------------------------------------------------------------------------
  // Helper: Mark suggestions with `isCustom` if they exist in customPhrases
  // ------------------------------------------------------------------------------
  function markCustomSuggestions(suggestions, listType) {
    return suggestions.map(suggestion => {
      const isCustom = navStore.phraseHistory.customPhrases[listType]?.has(suggestion)
      return isCustom
        ? { text: suggestion, isCustom: true }
        : suggestion
    })
  }

  // ------------------------------------------------------------------------------
  // Computed: filter and return the correct suggestions based on the current state
  // ------------------------------------------------------------------------------
  const filteredSuggestions = computed(() => {
    // If suggestions are not currently shown, return nothing
    if (!showSuggestions.value) {
      return []
    }

    // Local references for convenience
    const existingPhrases = navStore.phraseHistory.phrases
    
    // Use the dynamic sequence function to determine the current list type
    const listType = navStore.getNextListInSequence(currentWordIndex.value)
    
    // If no next list is available, return empty array
    if (!listType) {
      return []
    }
    
    const allSuggestions = currentList.value?.values || []
    const selectedPhrase = navStore.selectedPhrase
    const currentInput = navStore.phraseHistory.currentInput

    // --------------------------------------------------------------------------
    // 1) Show all suggestions if the user requested "show all" and has a phrase selected
    // --------------------------------------------------------------------------
    if (selectedPhrase && showAllSuggestions.value) {
      return markCustomSuggestions(allSuggestions, listType)
    }

    // --------------------------------------------------------------------------
    // 2) If there is a phrase selected and we have an active input, filter suggestions
    // --------------------------------------------------------------------------
    if (selectedPhrase && currentInput) {
      const searchTerm = currentInput.toLowerCase()

      const filtered = allSuggestions.filter(s => {
        const text = typeof s === 'object' ? s.label : s
        return text.toLowerCase().includes(searchTerm)
      })

      // Check if the exact searchTerm already exists
      const hasExactMatch = allSuggestions.some(
        s => {
          const text = typeof s === 'object' ? s.label : s
          return text.toLowerCase() === searchTerm
        }
      )

      // If no exact match, add the custom (user-typed) suggestion
      if (searchTerm && !hasExactMatch) {
        filtered.push({
          text: currentInput,
          isCustom: true,
        })
      }

      return filtered
    }

    // --------------------------------------------------------------------------
    // 3) If we've already chosen enough phrases to fill the sequence, do not show suggestions
    // --------------------------------------------------------------------------
    // This check is no longer needed as getNextListInSequence will return null when no more lists are available
    // Instead, we'll check if we have a valid listType
    if (!listType) {
      return []
    }

    // --------------------------------------------------------------------------
    // 4) If no phrase is selected, figure out the "current input" by slicing the query
    // --------------------------------------------------------------------------
    let localCurrentInput = ''
    if (selectedPhrase) {
      // If we do have a selected phrase, use that directly
      localCurrentInput = selectedPhrase.phrase
    } else {
      const cursorPos = cursorPosition.value
      let startPos = 0
      let endPos = searchQuery.value.length

      // Calculate start position based on existing phrases
      Object.values(existingPhrases).forEach(phrase => {
        if (phrase.end < cursorPos) {
          startPos = Math.max(startPos, phrase.end + 1)
        }
      })

      // Calculate end position based on existing phrases
      Object.values(existingPhrases).forEach(phrase => {
        if (phrase.start > cursorPos) {
          endPos = Math.min(endPos, phrase.start)
        }
      })

      // Extract potential user input between existing phrases
      localCurrentInput = searchQuery.value.slice(startPos, endPos).trim()
    }

    // If there is no input at all at this word boundary, show the full list
    if (!localCurrentInput) {
      return allSuggestions
    }

    // --------------------------------------------------------------------------
    // 5) Otherwise, filter suggestions based on the localCurrentInput
    // --------------------------------------------------------------------------
    const searchTerm = localCurrentInput.toLowerCase()
    const customMarkedSuggestions = markCustomSuggestions(allSuggestions, listType)

    // Filter down to suggestions that match the typed input
    let matching = customMarkedSuggestions.filter(item => {
      const text = typeof item === 'object' ? item.label : item
      return text.toLowerCase().includes(searchTerm)
    })

    // Detect if an exact match already exists
    const hasExactMatch = allSuggestions.some(
      s => {
        const text = typeof s === 'object' ? s.label : s
        return text.toLowerCase() === searchTerm
      }
    )

    // Also check whether the currently selected phrase matches the typed input
    const isSelectedPhrase = existingPhrases[currentWordIndex.value]?.phrase.toLowerCase() === searchTerm

    // If there's no exact match and it's not the selected phrase, allow a custom suggestion
    if (searchTerm && !hasExactMatch && !isSelectedPhrase) {
      matching.push({
        text: localCurrentInput,
        isCustom: true,
      })
    }

    return matching
  })

  // ------------------------------------------------------------------------------
  // Methods
  // ------------------------------------------------------------------------------

  /**
   * Reset all suggestion UI states.
   */
  const resetSuggestionState = () => {
    showAllSuggestions.value = false
    highlightedPhraseSuggestionIndex.value = -1
    showingAllSuggestionsForIndex.value = null
  }

  /**
   * Update suggestion state based on the current cursor position in the input.
   * This will decide whether or not suggestions should be shown.
   */
  const updateSuggestionState = async (position) => {
    // Update the cursor position
    cursorPosition.value = position

    const existingPhrases = navStore.phraseHistory.phrases
    const currentIndex = navStore.selectedPhrase
      ? navStore.selectedPhrase.index
      : Object.keys(existingPhrases).length

    // If we switched to a different index, reset the UI state
    if (previousSuggestionIndex.value !== currentIndex) {
      resetSuggestionState()
    }
    previousSuggestionIndex.value = currentIndex

    // Get the next list type using our dynamic function
    const listType = navStore.getNextListInSequence(currentIndex)
    
    // If there's no next list available, don't show suggestions
    if (!listType) {
      showSuggestions.value = false
      return
    }
    
    // Get the suggestions for this list type
    const allSuggestions = navStore.wordLists.lists[listType]?.values || []
    
    // Basic state checks
    const isStartingFresh = Object.keys(existingPhrases).length === 0
    const isValidPhrase = !navStore.selectedPhrase || allSuggestions.some(s => {
      const text = typeof s === 'object' ? s.label : s
      return text === navStore.selectedPhrase.phrase
    })
    const isExactMatch = navStore.selectedPhrase && 
      existingPhrases[currentIndex]?.phrase === navStore.selectedPhrase.phrase

    // Check if we have a space before the cursor
    const hasLeadingSpace =
      position === 0 ||
      searchQuery.value[position - 1] === ' ' ||
      (navStore.selectedPhrase && position === navStore.selectedPhrase.end + 1)

    // Force showing suggestions if we have a selected phrase and current input
    const forceShowSuggestions = navStore.selectedPhrase && 
      navStore.phraseHistory.currentInput !== null

    // Determine if we should show suggestions
    const shouldShowSuggestions = forceShowSuggestions || (
      (isStartingFresh || (hasLeadingSpace && !isExactMatch) || (isValidPhrase && !isExactMatch)) &&
      listType !== null // Make sure we have a valid list type
    )

    // Update the reactive state
    if (showSuggestions.value !== shouldShowSuggestions) {
      showSuggestions.value = shouldShowSuggestions
    }

    // If we are going to show suggestions, highlight the first one by default
    if (shouldShowSuggestions && allSuggestions.length > 0) {
      highlightedPhraseSuggestionIndex.value = 0
    }
  }

  /**
   * Select a suggestion and insert it into the overall phrase.
   */
  const selectSuggestion = async (suggestion, explicitListType = null) => {
    const suggestionText = typeof suggestion === 'object' ? suggestion.text : suggestion

    // Use explicitListType if provided, otherwise use dynamic sequence function
    const currentListType = explicitListType || navStore.getNextListInSequence(currentWordIndex.value)
    
    // If no list type is available and no explicit type provided, do nothing
    if (!currentListType) {
      return
    }

    const { fullString, phraseArray } = buildFullString(
      navStore.phraseHistory.phrases, 
      suggestionText,
      {
        currentIndex: currentWordIndex.value,
        navStore,
        currentList: currentList.value
      }
    )

    // Only check for custom if we're not using an explicit type
    const isCustom = !explicitListType && currentListType 
      ? !navStore.wordLists.lists[currentListType].values.some(value => {
          const valueText = typeof value === 'object' ? value.label : value
          return valueText === suggestionText
        })
      : false

    await navStore.addPhraseEntry(
      fullString, 
      phraseArray, 
      currentWordIndex.value, 
      isCustom ? currentListType : null,  // Only pass customListType if it's actually custom
      currentListType
    )

    searchQuery.value = fullString
    const newPosition = fullString.length
    cursorPosition.value = newPosition
    await navStore.updateCursorPosition(newPosition)

    showAllSuggestions.value = false
    highlightedPhraseSuggestionIndex.value = -1

    await updateSuggestionState(newPosition)

    navStore.updateCurrentInput(null)
  }

  // ------------------------------------------------------------------------------
  // Return the reactive data, computed props, and methods
  // ------------------------------------------------------------------------------
  return {
    // State
    showAllSuggestions,
    showingAllSuggestionsForIndex,
    showSuggestions,
    highlightedPhraseSuggestionIndex,

    // Computed
    filteredSuggestions,

    // Methods
    resetSuggestionState,
    updateSuggestionState,
    selectSuggestion,
  }
}