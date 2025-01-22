/**
 * Helper functions for working with suggestions
 */

/**
 * Gets the key for a suggestion object or string
 * @param {Object|string} suggestion - The suggestion to get the key for
 * @returns {string} The suggestion key
 */
export const getSuggestionKey = (suggestion) => {
  if (typeof suggestion === 'string') return suggestion
  return suggestion.isCustom ? suggestion.text : suggestion.label
}

/**
 * Gets the display text for a suggestion object or string
 * @param {Object|string} suggestion - The suggestion to get the text for
 * @returns {string} The suggestion text
 */
export const getSuggestionText = (suggestion) => {
  if (typeof suggestion === 'string') return suggestion
  return suggestion.isCustom ? suggestion.text : suggestion.label
}

/**
 * Checks if a suggestion is a custom suggestion
 * @param {Object|string} suggestion - The suggestion to check
 * @returns {boolean} True if suggestion is custom
 */
export const isCustomSuggestion = (suggestion) => {
  return typeof suggestion === 'object' && suggestion.isCustom
} 