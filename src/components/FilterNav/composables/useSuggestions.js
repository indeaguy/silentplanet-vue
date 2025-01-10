import { ref, computed } from 'vue'

export function useSuggestions(navStore, currentWordIndex, searchQuery, cursorPosition) {
  // Reactive state
  const showAllSuggestions = ref(false)
  const showingAllSuggestionsForIndex = ref(null)
  const showSuggestions = ref(false)
  const highlightedPhraseSuggestionIndex = ref(-1)
  const previousSuggestionIndex = ref(null)

  // Computed properties
  const filteredSuggestions = computed(() => {
    const phrases = navStore.phraseHistory.phrases
    const currentListType = navStore.wordLists.sequence[currentWordIndex.value]
    const suggestions = navStore.wordLists.lists[currentListType] || []
    
    if (!showSuggestions.value) {
      return []
    }

    // If we have a selected phrase and showAllSuggestions is true, 
    // check for custom phrases in the list
    if (navStore.selectedPhrase && showAllSuggestions.value) {
      return suggestions.map(s => {
        const isCustom = navStore.phraseHistory.customPhrases[currentListType]?.has(s)
        return isCustom ? { text: s, isCustom: true } : s
      })
    }

    // If we have a selected phrase and currentInput, filter suggestions
    if (navStore.selectedPhrase && navStore.phraseHistory.currentInput) {
      const searchTerm = navStore.phraseHistory.currentInput.toLowerCase()
      const currentListType = navStore.wordLists.sequence[currentWordIndex.value]
      const filteredSuggestions = suggestions.filter(s => 
        s.toLowerCase().includes(searchTerm)
      )

      // Add custom suggestion if no exact match exists
      const hasExactMatch = suggestions.some(s => 
        s.toLowerCase() === searchTerm
      )
      
      if (searchTerm && !hasExactMatch) {
        filteredSuggestions.push({
          text: navStore.phraseHistory.currentInput,
          isCustom: true
        })
      }

      return filteredSuggestions
    }

    if (Object.keys(phrases).length >= navStore.wordLists.sequence.length) {
      return []
    }

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
      const matchingSuggestions = suggestions.map(s => {
        const isCustom = navStore.phraseHistory.customPhrases[currentListType]?.has(s)
        return isCustom ? { text: s, isCustom: true } : s
      }).filter(s => {
        const text = typeof s === 'object' ? s.text : s
        return text.toLowerCase().includes(searchTerm)
      })
      
      const hasExactMatch = suggestions.some(s => 
        s.toLowerCase() === searchTerm
      )
      const isSelectedPhrase = phrases[currentWordIndex.value]?.phrase.toLowerCase() === searchTerm

      if (searchTerm && 
          !hasExactMatch && 
          !isSelectedPhrase) {
        matchingSuggestions.push({
          text: currentInput,
          isCustom: true
        })
      }
      
      return matchingSuggestions
    }
    
    // Map suggestions to include custom status
    return suggestions.map(s => {
      const isCustom = navStore.phraseHistory.customPhrases[currentListType]?.has(s)
      return isCustom ? { text: s, isCustom: true } : s
    })
  })

  // Methods
  const resetSuggestionState = () => {
    showAllSuggestions.value = false
    highlightedPhraseSuggestionIndex.value = -1
    showingAllSuggestionsForIndex.value = null
  }

  const updateSuggestionState = async (position) => {
    cursorPosition.value = position

    const currentIndex = navStore.selectedPhrase ? 
      navStore.selectedPhrase.index : 
      Object.keys(navStore.phraseHistory.phrases).length

    if (previousSuggestionIndex.value !== currentIndex) {
      resetSuggestionState()
    }

    previousSuggestionIndex.value = currentIndex

    const phrases = navStore.phraseHistory.phrases
    const currentListType = navStore.wordLists.sequence[currentIndex]
    const suggestions = navStore.wordLists.lists[currentListType] || []

    const isStartingFresh = Object.keys(phrases).length === 0
    const isValidPhrase = !navStore.selectedPhrase || suggestions.includes(navStore.selectedPhrase.phrase)

    const hasLeadingSpace =
      position === 0 ||
      searchQuery.value[position - 1] === ' ' ||
      (navStore.selectedPhrase && position === navStore.selectedPhrase.end + 1)

    const isExactMatch =
      navStore.selectedPhrase &&
      phrases[currentIndex]?.phrase === navStore.selectedPhrase.phrase

    const shouldShowSuggestions =
      (
        isStartingFresh ||
        (hasLeadingSpace && !isExactMatch) ||
        (isValidPhrase && !isExactMatch)
      ) &&
      (Object.keys(phrases).length < navStore.wordLists.sequence.length ||
        (navStore.phraseHistory.currentInput !== null && navStore.selectedPhrase !== null))

    if (showSuggestions.value !== shouldShowSuggestions) {
      showSuggestions.value = shouldShowSuggestions
    }

    if (shouldShowSuggestions && suggestions.length > 0) {
      highlightedPhraseSuggestionIndex.value = 0
    }
  }

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
    updateSuggestionState
  }
} 