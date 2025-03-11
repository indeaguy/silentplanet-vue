/**
 * Handles deletion of selected text that overlaps with phrases
 * @param {number} selStart - Selection start position
 * @param {number} selEnd - Selection end position
 * @param {Object} phrases - Current phrases object
 * @returns {Object} Deletion result object
 */
export const handleSelectedTextDeletion = (selStart, selEnd, phrases) => {
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
    return {
      shouldHandle: true,
      newCursorPosition: phrases[firstAffectedIndex].start,
      firstAffectedIndex
    }
  }

  return { shouldHandle: false }
}

/**
 * Handles deletion when cursor is at the start of a phrase
 * @param {number} cursorPos - Current cursor position
 * @param {Object} phrases - Current phrases object
 * @returns {Object} Deletion result object
 */
export const handlePhraseStartDeletion = (cursorPos, phrases) => {
  for (const [index, phrase] of Object.entries(phrases)) {
    // Check if cursor is right at the start of a phrase
    // The -1 accounts for the space character before the phrase
    if (cursorPos === phrase.start || cursorPos - 1 === phrase.start) {
      return {
        shouldHandle: true,
        newCursorPosition: phrase.start,
        firstAffectedIndex: parseInt(index)
      }
    }
  }
  return { shouldHandle: false }
}

/**
 * Handles deletion when cursor is within a phrase
 * @param {number} cursorPos - Current cursor position
 * @param {Object} phrases - Current phrases object
 * @returns {Object} Deletion result object
 */
export const handlePhraseDeletion = (cursorPos, phrases) => {
  let targetPhraseIndex = null
  
  // Find a phrase that contains the cursor position
  // The +1 accounts for the cursor being right after the phrase
  Object.entries(phrases).forEach(([index, phrase]) => {
    if (cursorPos >= phrase.start && cursorPos <= phrase.end + 1) {
      targetPhraseIndex = parseInt(index)
    }
  })

  if (targetPhraseIndex !== null) {
    const deletedPhrase = phrases[targetPhraseIndex]
    return {
      shouldHandle: true,
      newCursorPosition: deletedPhrase.start,
      firstAffectedIndex: targetPhraseIndex
    }
  }

  return { shouldHandle: false }
}

/**
 * Handles backspace when typing a new phrase (no selected phrase)
 * @param {number} cursorPos - Current cursor position
 * @param {Object} context - The context object containing required dependencies
 * @returns {boolean} - Whether the backspace was handled
 */
export const handleNewPhraseBackspace = (cursorPos, context) => {
  const { navStore, searchQuery } = context
  
  // Only handle if we're not editing an existing phrase
  if (navStore.selectedPhrase) {
    return false
  }
  
  // Check if we're in a position to start a new phrase (after the last phrase)
  const phrases = navStore.phraseHistory.phrases
  const phraseKeys = Object.keys(phrases).map(Number).sort((a, b) => a - b)
  
  // If there are no phrases or we're not at the end of the last phrase + space, don't handle
  if (phraseKeys.length === 0) {
    // If we're at the beginning of the input, don't handle
    if (cursorPos === 0) {
      return false
    }
    
    // If we're in the middle of typing the first phrase
    if (searchQuery.value.length > 0 && cursorPos > 0) {
      searchQuery.value = searchQuery.value.substring(0, cursorPos - 1) + 
                          searchQuery.value.substring(cursorPos)
      return true
    }
    
    return false
  }
  
  const lastPhrase = phrases[phraseKeys[phraseKeys.length - 1]]
  const isAfterLastPhrase = cursorPos > lastPhrase.end + 1
  
  // If we're not after the last phrase, don't handle
  if (!isAfterLastPhrase) {
    return false
  }
  
  // If we're right after the last phrase + space and there's no currentInput
  if (cursorPos === lastPhrase.end + 2 && !navStore.phraseHistory.currentInput) {
    // Don't update searchQuery here - let the regular backspace handler work
    return false
  }
  
  // If we're typing a new phrase after the last one, update searchQuery
  if (cursorPos > 0 && searchQuery.value.length > 0) {
    searchQuery.value = searchQuery.value.substring(0, cursorPos - 1) + 
                        searchQuery.value.substring(cursorPos)
    return true
  }
  
  return false
}

/**
 * Handles the common logic for applying deletion results
 * @param {Object} result - The deletion result object
 * @param {Object} context - The context object containing required dependencies
 * @returns {boolean} - Whether the deletion was handled
 */
export const applyDeletionResult = (result, context) => {
  const {
    event,
    navStore,
    searchQuery,
    cursorPosition,
    showSuggestions,
    nextTick
  } = context

  if (!result.shouldHandle) {
    return false
  }

  event.preventDefault()
  navStore.clearSubsequentPhrases(result.firstAffectedIndex)
  searchQuery.value = searchQuery.value.substring(0, result.newCursorPosition)
  
  // Only set showSuggestions if it exists in context
  if (showSuggestions) {
    showSuggestions.value = true
  }
  
  cursorPosition.value = result.newCursorPosition
  navStore.updateCursorPosition(result.newCursorPosition)
  
  nextTick(() => {
    event.target.setSelectionRange(result.newCursorPosition, result.newCursorPosition)
  })

  return true
}

/**
 * Handles phrase deletion logic by trying different deletion strategies
 * @param {Object} params - Parameters for deletion handling
 * @returns {boolean} - Whether the deletion was handled
 */
export const handlePhraseDeletionLogic = ({
  selStart,
  selEnd,
  context
}) => {
  const { navStore } = context
  const phrases = navStore.phraseHistory.phrases
  
  // First, try to handle backspace for new phrase input
  if (selStart === selEnd && handleNewPhraseBackspace(selStart, context)) {
    return true
  }
  
  // Try each deletion handler in sequence
  if (selStart !== selEnd) {
    // Case 1: Text is selected
    const result = handleSelectedTextDeletion(selStart, selEnd, phrases)
    if (applyDeletionResult(result, context)) {
      return true
    }
  }

  // Case 2: Cursor is at the start of a phrase
  const startResult = handlePhraseStartDeletion(selStart, phrases)
  if (applyDeletionResult(startResult, context)) {
    return true
  }

  // Case 3: Cursor is within a phrase
  const phraseResult = handlePhraseDeletion(selStart, phrases)
  return applyDeletionResult(phraseResult, context)
} 