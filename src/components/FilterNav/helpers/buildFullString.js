/**
 * Builds a full string from an array of phrases based on word list sequence
 * 
 * @param {Object} phrases - Object containing existing phrases
 * @param {string|null} newPhrase - Optional text to insert at current index
 * @param {Object} options - Configuration options
 * @param {number} options.currentIndex - Current index in the sequence
 * @param {Object} options.navStore - Navigation store
 * @returns {Object} Object containing the full string and phrase array
 */
export const buildFullString = (phrases, newPhrase, options) => {
  const { currentIndex, navStore } = options
  let phraseArray = []
  let fullString = ''
  let replace = false

  // Get current list type from sequence and check if it should add space
  const currentListType = navStore.wordLists.sequence[currentIndex]
  const shouldAddSpace = navStore.wordLists.lists[currentListType]?.addSpaceAfter

  // Get sorted indices to maintain order
  const indices = Object.keys(phrases)
    .map(Number)
    .sort((a, b) => a - b)

  indices.forEach((index) => {
    const currentPhrase = phrases[index]
    
    // Add the current phrase
    if (index === currentIndex && newPhrase) {
      replace = true
      phraseArray[index] = newPhrase
      fullString += newPhrase
    } else if (currentPhrase.phrase) {
      phraseArray[index] = currentPhrase.phrase
      fullString += currentPhrase.phrase
    }

    fullString += ' '
  })
  if (!replace) {
    fullString += newPhrase
    phraseArray[currentIndex] = newPhrase
  }

  if (shouldAddSpace) {
    fullString += ' '
  }

  return { fullString, phraseArray }
} 