export function usePhraseHandling(context) {
  const { navStore } = context

  /**
   * Updates the positions of all phrases when a phrase is modified
   * @param {Object} selectedPhrase - The currently selected phrase being edited
   * @param {string} newInput - The new text value for the selected phrase
   * @returns {Object} Object containing:
   *   - newString: The complete updated search string
   *   - phrases: Updated phrases object with new positions
   *   - newCursorPosition: Where cursor should be placed after update
   */
  const updatePhrasePositions = (selectedPhrase, newInput) => {
    // Create a copy of phrases to modify
    const phrases = { ...navStore.phraseHistory.phrases }
    let newString = ''
    let currentPosition = 0

    // Process phrases in order by index
    Object.keys(phrases)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .forEach(index => {
        const numericIndex = parseInt(index)
        const phrase = phrases[numericIndex]

        // Add spacing between phrases
        if (currentPosition > 0) {
          newString += ' '
          currentPosition++
        }

        if (numericIndex === selectedPhrase.index) {
          // This is the phrase being edited - insert the new input
          newString += newInput
          phrases[numericIndex] = {
            ...phrase,
            phrase: newInput,
            start: currentPosition,
            end: currentPosition + newInput.length - 1
          }
          currentPosition += newInput.length
        } else {
          // This is an unchanged phrase - maintain its text but update position
          newString += phrase.phrase
          phrases[numericIndex] = {
            ...phrase,
            start: currentPosition,
            end: currentPosition + phrase.phrase.length - 1
          }
          currentPosition += phrase.phrase.length
        }
      })

    // Place cursor at end of edited phrase or at end of string if phrase not found
    const newCursorPosition = phrases[selectedPhrase.index]?.end !== undefined 
      ? phrases[selectedPhrase.index].end + 1 
      : newString.length

    return { newString, phrases, newCursorPosition }
  }

  return {
    updatePhrasePositions
  }
} 