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
            { label: 'in' },
            { label: 'from' },
            { label: 'today' },
            { label: 'this week' },
            { label: 'added on' },
            { label: 'added between' }
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
