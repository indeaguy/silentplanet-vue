/**
 * Builds a full string from an array of phrases based on word list sequence
 * 
 * @param {Object} existingPhrases - Object containing existing phrases
 * @param {string|null} suggestionText - Optional text to insert at current index
 * @param {Object} options - Configuration options
 * @param {Array} options.sequence - Array defining the sequence of word types
 * @param {Array} options.addSpaceAfter - Array of word types that should have spaces after them
 * @param {number} options.currentIndex - Current index in the sequence
 * @returns {Object} Object containing the full string and phrase array
 */
export const buildFullString = (existingPhrases, suggestionText = null, options) => {
  const { sequence, addSpaceAfter, currentIndex } = options
  const phraseArray = []
  
  // Build the phrase array
  for (let i = 0; i < sequence.length; i++) {
    if (i === currentIndex && suggestionText !== null) {
      phraseArray[i] = suggestionText
    } else if (existingPhrases[i]) {
      phraseArray[i] = existingPhrases[i].phrase
    }
  }

  // Build and return the full string
  let fullString = phraseArray.filter(p => p).join(' ')
  
  // Add space if needed based on current list type
  const currentListType = sequence[currentIndex] || sequence[sequence.length - 1]
  if (addSpaceAfter.includes(currentListType)) {
    fullString += ' '
  }

  return { fullString, phraseArray }
} 