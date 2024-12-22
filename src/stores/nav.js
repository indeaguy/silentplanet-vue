import { defineStore } from 'pinia'

export const useNavStore = defineStore('nav', {
  state: () => ({
    phraseHistory: {
      entries: [], // Complete input strings
      phrases: {}, 
      lastUsed: {},
      customPhrases: {}, // Track custom phrases by list type
      selectedPhrase: {},
      cursorPosition: 0
    },
    wordLists: {
      sequence: ['adjectives', 'contentTypes', 'preposition', 'location'],
      lists: {
        adjectives: ['most popular', 'newest', 'fastest rising', 'random', 'most undisliked', 'most controversial', 'least controversial'],
        contentTypes: ['post', 'music', 'art', 'video', 'vine', 'poem', 'controvercy', 'ad'],
        preposition: ['in', 'from', 'today', 'this week', 'added on', 'added between'],
        location: ['Canada', 'Lower Sackville', 'New York', 'Paris'],
      },
      addSpaceAfter: ['adjectives', 'preposition']
    }
  }),

  getters: {
    selectedPhrase: (state) => {
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

        for (let i = 0; i < phraseArray.length; i++) {
          const phrase = phraseArray[i]
          if (!phrase || !phrase.trim()) continue

          if (characterIndex > 0 && fullString[characterIndex] === ' ') {
            characterIndex++
          }

          if (i === currentWordIndex || !updatedPhrases[i]) {
            updatedPhrases[i] = {
              phrase,
              start: characterIndex,
              end: characterIndex + phrase.length - 1,
              isCustom: i === currentWordIndex ? customListType !== null : updatedPhrases[i]?.isCustom,
              listType: listType,
              listTypeIndex: i
            }
            
            this.phraseHistory.lastUsed[`${i}-${phrase}`] = Date.now()
          }
          
          characterIndex = updatedPhrases[i].end + 1
        }

        if (customListType) {
          if (!this.phraseHistory.customPhrases[customListType]) {
            this.phraseHistory.customPhrases[customListType] = new Set()
          }
          this.phraseHistory.customPhrases[customListType].add(phraseArray[currentWordIndex])
        }

        this.$patch((state) => {
          state.phraseHistory.phrases = updatedPhrases
        })

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
    }
  }
})
