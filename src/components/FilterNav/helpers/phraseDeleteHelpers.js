/**
 * Handles deletion of selected text that overlaps with phrases
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
 */
export const handlePhraseStartDeletion = (cursorPos, phrases) => {
  for (const [index, phrase] of Object.entries(phrases)) {
    // @TODO bad code smell -1 why
    if (cursorPos -1 === phrase.start) {
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
 */
export const handlePhraseDeletion = (cursorPos, phrases) => {
  let targetPhraseIndex = null
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
 * Handles phrase deletion logic
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
  
  // Try each deletion handler in sequence
  if (selStart !== selEnd) {
    const result = handleSelectedTextDeletion(selStart, selEnd, phrases)
    if (applyDeletionResult(result, context)) {
      console.log('delete case 1');
      return true
    }
  }

  const startResult = handlePhraseStartDeletion(selStart, phrases)
  if (applyDeletionResult(startResult, context)) {
    console.log('delete case 2');
    return true
  }

  const phraseResult = handlePhraseDeletion(selStart, phrases)
  console.log('delete case 3');
  return applyDeletionResult(phraseResult, context)
} 