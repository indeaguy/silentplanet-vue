import { usePhraseHandling } from '../composables/usePhraseHandling'

/**
 * Builds a full string from an array of phrases based on word list sequence
 * 
 * @param {Object} phrases - Object containing existing phrases
 * @param {string|null} newPhrase - Optional text to insert at current index
 * @param {Object} options - Configuration options
 * @param {number} options.currentIndex - Current index in the sequence
 * @param {Object} options.navStore - Navigation store
 * @param {Array} options.currentList - Current list of valid values
 * @returns {Object} Object containing the full string and phrase array
 */
export const buildFullString = (phrases, newPhrase, options) => {
  const { currentIndex, navStore, currentList } = options
  let fullString = ''

  // Get the length of existing phrases
  const existingPhrasesLength = Object.keys(phrases).length

  // Create a mock selected phrase object for updatePhrasePositions
  const selectedPhrase = {
    index: currentIndex,
    phrase: phrases[currentIndex]?.phrase || ''
  }

  // Convert newPhrase to string if it's an object
  const newPhraseText = typeof newPhrase === 'string' ? newPhrase : newPhrase?.label || ''

  // Use updatePhrasePositions directly from the composable
  const { newString, phrases: updatedPhrases } = usePhraseHandling({ navStore }).updatePhrasePositions(selectedPhrase, newPhraseText)

  fullString = newString

  // Extract phrases into array form
  const phraseArray = Object.keys(updatedPhrases)
  .sort((a, b) => parseInt(a) - parseInt(b))
  .map(index => updatedPhrases[index].phrase)

  // it's the first word
  if ((phraseArray.length === 0) || (currentIndex + 1 > existingPhrasesLength)) {
    phraseArray[currentIndex] = newPhraseText
  }

  if (existingPhrasesLength <= currentIndex && newString) { // it's a new word
    fullString = fullString + ' ' + newPhraseText
  } else if (!newString) { // it's the first word
    fullString = newPhraseText
  }

  // Add trailing space based on the last phrase's list type if it exists, otherwise use current list
  //fullString += (lastPhraseListType ? lastListAddSpace : shouldAddSpace) ? ' ' : ''


  if (currentIndex + 1 > existingPhrasesLength && currentList?.addSpaceAfter) {
    fullString += ' '
  }

  //@TODO bad code smell, jst return fullString
  return { fullString, phraseArray }
} 