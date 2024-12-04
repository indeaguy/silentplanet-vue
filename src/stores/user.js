import { defineStore } from 'pinia'
import { supabase } from '../lib/supabaseClient'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    error: null,
    phraseHistory: {
      entries: [], // Complete input strings
      phrases: {
        // Each position will contain an array of phrase objects
        // 0: [], 1: [], etc.
      }, 
      lastUsed: {} // Timestamp of last use for each phrase
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
    async addPhraseEntry(fullString, phraseArray, currentWordIndex) {
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
            end: characterIndex + phrase.length
          }
          
          this.phraseHistory.lastUsed[`${index}-${phrase}`] = Date.now()
          characterIndex += phrase.length + 1 // +1 for the space
        })

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