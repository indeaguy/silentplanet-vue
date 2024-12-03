import { defineStore } from 'pinia'
import { supabase } from '../lib/supabaseClient'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    error: null,
    phraseHistory: {
      entries: [], // Complete input strings
      phrases: {}, // Individual phrases by position - will contain strings
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
        // Store the complete entry with metadata
        this.phraseHistory.entries.push({
          fullString,
          currentWordIndex,
          timestamp: Date.now()
        })

        // Create a new phrases object with the current values
        const newPhrases = {}
        phraseArray.forEach((phrase, index) => {
          if (!phrase || !phrase.trim()) return
          newPhrases[index] = String(phrase).trim()
          this.phraseHistory.lastUsed[`${index}-${phrase}`] = Date.now()
        })

        // Update the phrases object atomically
        this.$patch((state) => {
          state.phraseHistory.phrases = newPhrases
        })

        // Debug log
        console.log('Debug - current phrases:', this.phraseHistory.phrases)
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