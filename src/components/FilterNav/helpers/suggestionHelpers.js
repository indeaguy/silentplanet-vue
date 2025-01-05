/**
 * Helper functions for working with suggestions
 */

/**
 * Gets the key for a suggestion object or string
 * @param {Object|string} suggestion - The suggestion to get the key for
 * @returns {string} The suggestion key
 */
export const getSuggestionKey = (suggestion) => {
  return typeof suggestion === 'string' ? suggestion : suggestion.text
}

/**
 * Gets the display text for a suggestion object or string
 * @param {Object|string} suggestion - The suggestion to get the text for
 * @returns {string} The suggestion text
 */
export const getSuggestionText = (suggestion) => {
  return typeof suggestion === 'string' ? suggestion : suggestion.text
}

/**
 * Checks if a suggestion is a custom suggestion
 * @param {Object|string} suggestion - The suggestion to check
 * @returns {boolean} True if suggestion is custom
 */
export const isCustomSuggestion = (suggestion) => {
  return typeof suggestion === 'object' && suggestion.isCustom
} 