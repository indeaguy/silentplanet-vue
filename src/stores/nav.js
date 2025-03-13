import { defineStore } from 'pinia'

export const useNavStore = defineStore('nav', {
  state: () => ({
    phraseHistory: {
      entries: [], // Complete input strings
      phrases: {}, 
      lastUsed: {},
      customPhrases: {}, // Track custom phrases by list type
      selectedPhrase: {},
      cursorPosition: 0,
      currentInput: null,
      historyPosition: -1,
    },
    wordLists: {
      baseSequence: ['comparative', 'contentTypes', 'preposition'],
      usedPrepositions: new Set(),
      sequence: ['comparative', 'contentTypes', 'preposition', 'location'],
      lists: {
        comparative: {
          id: 'comparative',
          type: 'filter',
          values: [
            { label: 'most popular' },
            { label: 'newest' },
            { label: 'fastest rising' },
            { label: 'random' },
            { label: 'most undisliked' },
            { label: 'most controversial' },
            { label: 'least controversial' }
          ],
          customListClass: 'SortFilter',
          addSpaceAfter: true
        },
        contentTypes: {
          id: 'contentTypes',
          type: 'content',
          values: [
            { label: 'post' },
            { label: 'music' },
            { label: 'art' },
            { label: 'video' },
            { label: 'vine' },
            { label: 'poem' },
            { label: 'controvercy' },
            { label: 'ad' }
          ],
          customListClass: 'ContentType',
          subListId: 'contentSubTypes',
          addSpaceAfter: false
        },
        preposition: {
          id: 'preposition',
          type: 'connector',
          values: [
            { 
              label: 'in',
              showLocation: true,
              unique: true,
              addSpaceAfter: true,
              nextList: 'location'
            },
            { 
              label: 'from',
              showLocation: true,
              unique: true,
              addSpaceAfter: true,
              nextList: 'location'
            },
            { 
              label: 'today',
              unique: true,
              addSpaceAfter: false
            },
            { 
              label: 'this week',
              unique: true,
              addSpaceAfter: false
            },
            { 
              label: 'added on',
              unique: true,
              requiresDate: true,
              addSpaceAfter: true,
              nextList: 'date'
            },
            { 
              label: 'added between',
              unique: true,
              requiresDateRange: true,
              addSpaceAfter: true,
              nextList: 'dateRange'
            }
          ],
          customListClass: null,
          addSpaceAfter: true
        },
        location: {
          id: 'location',
          type: 'location',
          values: [
            { label: 'Canada' },
            { label: 'Lower Sackville' },
            { label: 'New York' },
            { label: 'Paris' }
          ],
          customListClass: 'Location',
          addSpaceAfter: false
        },
        date: {
          id: 'date',
          type: 'date',
          customListClass: 'DatePicker',
          addSpaceAfter: false,
          inputType: 'date' // Used to identify this needs a date input
        },
        dateRange: {
          id: 'dateRange',
          type: 'dateRange',
          customListClass: 'DateRangePicker',
          addSpaceAfter: false,
          inputType: 'dateRange' // Used to identify this needs a date range input
        }
      },
    }
  }),

  getters: {
    selectedPhrase: (state) => {

      if (state.phraseHistory.currentInput !== null && state.phraseHistory.currentInput !== " ") {
        return state.phraseHistory.selectedPhrase
      }

      const position = state.phraseHistory.cursorPosition
      const phrases = state.phraseHistory.phrases

      for (const [index, phrase] of Object.entries(phrases)) {
        const isWithinPhrase = position >= phrase.start && position <= phrase.end + 1

        if (isWithinPhrase) {
          const result = {
            index: parseInt(index),
            phrase: phrase.phrase,
            start: phrase.start,
            end: phrase.end,
            isCustom: phrase.isCustom,
            listType: phrase.listType
          }
          state.phraseHistory.selectedPhrase = result
          return result
        }
      }

      state.phraseHistory.selectedPhrase = null
      return null
    }
  },

  actions: {
    /**
     * Determines the next list in the sequence based on current context
     * @param {number} currentIndex - The current position in the sequence
     * @returns {string|null} - The ID of the next list or null if no more lists
     */
    getNextListInSequence(currentIndex) {
      const phrases = this.phraseHistory.phrases;
      
      // Base sequence: comparative -> contentTypes -> preposition
      if (currentIndex < this.wordLists.baseSequence.length) {
        return this.wordLists.baseSequence[currentIndex];
      }
      
      // Get all phrases that are prepositions
      const prepositionPhrases = Object.values(phrases)
        .filter(phrase => phrase.listType === 'preposition');
      
      // Get all preposition indices in order
      const prepositionIndices = prepositionPhrases
        .map(p => parseInt(p.listTypeIndex))
        .sort((a, b) => a - b);
      
      // If we don't have any prepositions yet, we can't continue
      if (prepositionIndices.length === 0) {
        return null;
      }
      
      // Check if the current index is immediately after a preposition
      const isAfterPreposition = prepositionIndices.includes(currentIndex - 1);
      
      if (isAfterPreposition) {
        // Get the preposition that comes right before the current index
        const prevPreposition = phrases[currentIndex - 1];
        const prepositionValue = this.wordLists.lists.preposition.values
          .find(v => v.label === prevPreposition.phrase);
        
        // If this preposition has a nextList, use it
        if (prepositionValue?.nextList) {
          return prepositionValue.nextList;
        }
      }
      
      // If we're not after a preposition with a nextList, or we've already processed that nextList,
      // check if we can add another preposition
      
      // Get all prepositions that have been used
      const usedPrepositionLabels = prepositionPhrases.map(p => p.phrase);
      
      // Filter out unique prepositions that have already been used
      const availablePrepositions = this.wordLists.lists.preposition.values.filter(prep => {
        // If not unique, it can be used multiple times
        if (!prep.unique) return true;
        
        // If unique and already used, it can't be used again
        if (usedPrepositionLabels.includes(prep.label)) return false;
        
        // Otherwise, it's available
        return true;
      });
      
      // If we have available prepositions, return 'preposition'
      if (availablePrepositions.length > 0) {
        return 'preposition';
      }
      
      // If we get here, there are no more valid options
      return null;
    },

    /**
     * Add a phrase entry
     * @param {string} fullString - The full input string
     * @param {array} phraseArray - The array of phrases
     * @param {number} currentWordIndex - The index of the current word
     * @param {string} customListType - The custom list type
     * @param {string} listType - The list type
     * @returns {object} the updated phrases
     */
    async addPhraseEntry(fullString, phraseArray, currentWordIndex, customListType = null, listType = null) {
      try {
        const updatedPhrases = { ...this.phraseHistory.phrases }
        let characterIndex = 0

        // Sort the phrases by index to ensure we process them in order
        const phraseIndices = Object.keys(updatedPhrases)
          .map(Number)
          .sort((a, b) => a - b)

        // Process each phrase in order
        for (let i = 0; i <= Math.max(...phraseIndices, currentWordIndex); i++) {
          // Add space if not at the start
          if (characterIndex > 0 && fullString[characterIndex] === ' ') {
            characterIndex++
          }

          // If this is the current word being updated OR a new phrase
          if (i === currentWordIndex || !updatedPhrases[i]) {
            const phrase = phraseArray[i]
            if (!phrase || !phrase.trim()) continue

            updatedPhrases[i] = {
              phrase,
              start: characterIndex,
              end: characterIndex + phrase.length - 1,
              isCustom: i === currentWordIndex ? customListType !== null : updatedPhrases[i]?.isCustom,
              listType: i === currentWordIndex ? listType : updatedPhrases[i]?.listType,
              listTypeIndex: i
            }
            
            this.phraseHistory.lastUsed[`${i}-${phrase}`] = Date.now()
            characterIndex = updatedPhrases[i].end + 1
          } else {
            // Update positions for existing phrases
            const existingPhrase = updatedPhrases[i]
            if (!existingPhrase) continue

            updatedPhrases[i] = {
              ...existingPhrase,
              start: characterIndex,
              end: characterIndex + existingPhrase.phrase.length - 1
            }
            characterIndex = updatedPhrases[i].end + 1
          }
        }

        // Handle custom phrases tracking
        if (customListType) {
          if (!this.phraseHistory.customPhrases[customListType]) {
            this.phraseHistory.customPhrases[customListType] = new Set()
          }
          this.phraseHistory.customPhrases[customListType].add(phraseArray[currentWordIndex])
        }

        // Update store state
        this.$patch((state) => {
          state.phraseHistory.phrases = updatedPhrases
          state.phraseHistory.historyPosition = state.phraseHistory.entries.length
        })

        // Add to history
        this.phraseHistory.entries.push({
          fullString,
          currentWordIndex,
          timestamp: Date.now(),
          listType,
          phrases: updatedPhrases
        })

        return updatedPhrases
      } catch (error) {
        console.error('Error adding phrase entry:', error)
        throw error
      }
    },

    getMostRecentPhrases(position, limit = 5) {
      const phrases = Array.from(this.phraseHistory.phrases[position] || [])
      return phrases
        .sort((a, b) => {
          return (this.phraseHistory.lastUsed[`${position}-${b}`] || 0) -
                 (this.phraseHistory.lastUsed[`${position}-${a}`] || 0)
        })
        .slice(0, limit)
    },

    updateCursorPosition(position) {
      this.$patch((state) => {
        state.phraseHistory.cursorPosition = position
      })
    },

    /**
     * Clear subsequent phrases
     * @param {number} startIndex - The index of the phrase to start clearing from
     * @returns {object} the updated phrases
     */
    clearSubsequentPhrases(startIndex) {
      const originalPhrases = { ...this.phraseHistory.phrases }
      const updatedPhrases = {}
      
      // Keep only phrases before startIndex
      Object.entries(this.phraseHistory.phrases).forEach(([index, phrase]) => {
        if (parseInt(index) < startIndex) {
          updatedPhrases[index] = phrase
        }
      })

      // Store the state before clearing for undo
      this.phraseHistory.entries.push({
        fullString: this.phraseHistory.entries[this.phraseHistory.entries.length - 1]?.fullString || '',
        phrases: originalPhrases,
        timestamp: Date.now(),
        isUndoPoint: true
      })

      // Update store
      this.$patch((state) => {
        state.phraseHistory.phrases = updatedPhrases
      })

      return updatedPhrases
    },

    /**
     * Update the current input
     * @param {*} input 
     * @returns {string} the current input
     */
    updateCurrentInput(input) {
      this.$patch((state) => {
        state.phraseHistory.currentInput = input
      })
    },

    navigateHistory(direction) {
      if (this.phraseHistory.entries.length === 0) return false;
      
      const newPosition = this.phraseHistory.historyPosition + direction;
      
      // Bounds checking
      if (newPosition < 0 || newPosition >= this.phraseHistory.entries.length) {
        return false;
      }

      const historyEntry = this.phraseHistory.entries[newPosition];
      
      this.$patch((state) => {
        state.phraseHistory.historyPosition = newPosition;
        state.phraseHistory.phrases = historyEntry.phrases;
        state.phraseHistory.currentInput = null;
      });

      return historyEntry.fullString;
    },
  }
})
