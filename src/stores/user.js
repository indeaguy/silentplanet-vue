import { defineStore } from 'pinia'
import { supabase } from '../lib/supabaseClient'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    error: null
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
    }
  }
}) 