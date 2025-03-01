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
    const listType = navStore.wordLists.sequence[currentWordIndex.value]
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
    if (Object.keys(existingPhrases).length >= navStore.wordLists.sequence.length) {
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

    // Local references
    const listType = navStore.wordLists.sequence[currentIndex]
    const allSuggestions = navStore.wordLists.lists[listType]?.values || []
    const isStartingFresh = Object.keys(existingPhrases).length === 0
    const isValidPhrase = !navStore.selectedPhrase || allSuggestions.includes(navStore.selectedPhrase.phrase)
    const isExactMatch = navStore.selectedPhrase && existingPhrases[currentIndex]?.phrase === navStore.selectedPhrase.phrase

    // Check the characters before the position to see if we have a space
    const hasLeadingSpace =
      position === 0 ||
      searchQuery.value[position - 1] === ' ' ||
      (navStore.selectedPhrase && position === navStore.selectedPhrase.end + 1)

    // @TODO bad code smell
    const forceShowSuggestions = navStore.selectedPhrase && navStore.phraseHistory.currentInput !== null

    const shouldShowSuggestions = forceShowSuggestions || (
      (isStartingFresh || (hasLeadingSpace && !isExactMatch) || (isValidPhrase && !isExactMatch)) &&
      (
        // If we haven't filled out all placeholders
        Object.keys(existingPhrases).length < navStore.wordLists.sequence.length
        // Or we have something typed but also a selected phrase
        || (
          navStore.phraseHistory.currentInput !== null
          && navStore.selectedPhrase !== null
        )
      )
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
  const selectSuggestion = async (suggestion, customListType = null) => {
    const suggestionText = typeof suggestion === 'object' ? suggestion.text : suggestion
    const currentListType = navStore.wordLists.sequence[currentWordIndex.value]
      || navStore.wordLists.sequence[navStore.wordLists.sequence.length - 1]

    // Add space after if:
    // 1. This list type has addSpaceAfter = true
    // 2. We're not editing an existing phrase
    const listConfig = navStore.wordLists.lists[currentListType]
    const isEditing = navStore.phraseHistory.phrases[currentWordIndex.value]
    let finalText = suggestionText
    // if (listConfig?.addSpaceAfter && !isEditing) {
    //   finalText += ' '
    // }

    const { fullString, phraseArray } = buildFullString(
      navStore.phraseHistory.phrases, 
      finalText,
      {
        currentIndex: currentWordIndex.value,
        navStore,
        currentList: currentList.value
      }
    )

    // Determine if this is a custom phrase by checking if it exists in the current list type's values
    // If currentListType exists, check if suggestionText matches any value in that list
    // If no match found or no currentListType, treat as custom phrase
    // For custom phrases, use provided customListType or fall back to currentListType
    // some() returns true if any array element matches the condition, false otherwise
    const isCustom = currentListType 
      ? !navStore.wordLists.lists[currentListType].values.some(value => {
          const valueText = typeof value === 'object' ? value.label : value
          return valueText === suggestionText
        })
      : true
    if (isCustom) {
      customListType = customListType || currentListType
    }

    await navStore.addPhraseEntry(
      fullString, 
      phraseArray, 
      currentWordIndex.value, 
      customListType, 
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