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

        let characterIndex = 0
        const updatedPhrases = {}
        
        phraseArray.forEach((phrase, index) => {
          if (!phrase || !phrase.trim()) return
          
          updatedPhrases[index] = {
            phrase,
            start: characterIndex,
            end: characterIndex + phrase.length,
            isCustom: index === currentWordIndex && customListType !== null // Track if this is a custom phrase
          }
          
          this.phraseHistory.lastUsed[`${index}-${phrase}`] = Date.now()
          characterIndex += phrase.length + 1
        })

        // Track custom phrase in the new customPhrases property
        if (customListType) {
          if (!this.phraseHistory.customPhrases[customListType]) {
            this.phraseHistory.customPhrases[customListType] = new Set()
          }
          this.phraseHistory.customPhrases[customListType].add(phraseArray[currentWordIndex])
        }

        let soup = {
          phrases: updatedPhrases,
          customPhrases: this.phraseHistory.customPhrases
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