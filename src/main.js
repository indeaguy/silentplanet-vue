import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { supabase } from './lib/supabaseClient'
import { useUserStore } from './stores/user'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

// Initialize auth state from session
const userStore = useUserStore(pinia)
supabase.auth.onAuthStateChange((event, session) => {
  userStore.user = session?.user || null
})

app.mount('#app')
