import { defineStore } from 'pinia'
import { supabase } from '../lib/supabaseClient'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    error: null,
    phraseHistory: {
      entries: [], // Complete input strings
      phrases: {}, 
      lastUsed: {},
      customPhrases: {} // New property to track custom phrases by list type
    }
  }),
  actions: {
    async signIn(email, password) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
        this.user = data.user
        this.error = null
      } catch (error) {
        this.error = error.message
        throw error
      }
    },
    async signUp(email, password) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password
        })
        if (error) throw error
        this.user = data.user
        this.error = null
      } catch (error) {
        this.error = error.message
        throw error
      }
    },
    async signOut() {
      try {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        this.user = null
        this.error = null
      } catch (error) {
        this.error = error.message
        throw error
      }
    },
    async addPhraseEntry(fullString, phraseArray, currentWordIndex, customListType = null) {
      try {
        this.phraseHistory.entries.push({
          fullString,
          currentWordIndex,
          timestamp: Date.now()
        })

        // Keep existing phrases and add/update the new one
        const updatedPhrases = { ...this.phraseHistory.phrases }
        let characterIndex = 0

        // Process phrases in order to maintain correct character positions
        for (let i = 0; i < phraseArray.length; i++) {
          const phrase = phraseArray[i]
          if (!phrase || !phrase.trim()) continue

          // Only update if it's the current word or doesn't exist yet
          if (i === currentWordIndex || !updatedPhrases[i]) {
            updatedPhrases[i] = {
              phrase,
              start: characterIndex,
              end: characterIndex + phrase.length,
              isCustom: i === currentWordIndex ? customListType !== null : updatedPhrases[i]?.isCustom
            }
            
            this.phraseHistory.lastUsed[`${i}-${phrase}`] = Date.now()
          }
          
          characterIndex = updatedPhrases[i].end + 1
        }

        // Track custom phrase if applicable
        if (customListType) {
          if (!this.phraseHistory.customPhrases[customListType]) {
            this.phraseHistory.customPhrases[customListType] = new Set()
          }
          this.phraseHistory.customPhrases[customListType].add(phraseArray[currentWordIndex])
        }

        this.$patch((state) => {
          state.phraseHistory.phrases = updatedPhrases
        })
      } catch (error) {
        this.error = error.message
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
    }
  }
}) 