<!-- this is the main source of truth for everything-->

<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { useUserStore } from './stores/user'
import { ref } from 'vue'

const userStore = useUserStore()
const email = ref('')
const password = ref('')
const isSignUp = ref(false)

const handleSignIn = async () => {
  try {
    if (isSignUp.value) {
      await userStore.signUp(email.value, password.value)
    } else {
      await userStore.signIn(email.value, password.value)
    }
    email.value = ''
    password.value = ''
  } catch (error) {
    console.error('Auth error:', error.message)
  }
}

const handleSignOut = async () => {
  try {
    await userStore.signOut()
  } catch (error) {
    console.error('Sign out error:', error.message)
  }
}

const toggleMode = () => {
  isSignUp.value = !isSignUp.value
}
</script>

<template>
  <header>
    <img 
      alt="Silent Planet logo" 
      class="logo" 
      src="@/assets/logo.svg" 
      width="30" 
      height="39"
      aria-hidden="true" />
    <h1>Silent Planet</h1>

    <div v-if="!userStore.user" class="auth-container">
      <div v-if="userStore.error" class="error-message">
        {{ userStore.error }}
      </div>
      <input 
        v-model="email" 
        type="email" 
        placeholder="Email"
        required />
      <input 
        v-model="password" 
        type="password" 
        placeholder="Password"
        required
        minlength="6" />
      <button @click="handleSignIn">
        {{ isSignUp ? 'Sign Up' : 'Sign In' }}
      </button>
      <button class="toggle-btn" @click="toggleMode">
        {{ isSignUp ? 'Already have an account?' : 'Need an account?' }}
      </button>
    </div>
    <div v-else class="auth-container">
      <span>{{ userStore.user.email }}</span>
      <button @click="handleSignOut">Sign Out</button>
    </div>
  </header>

  <RouterView />

  <footer>
    <div class="wrapper">
      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
      </nav>
    </div>
  </footer>
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .2rem;
  width: 100%;
  padding: 1rem 0;
}

h1 {
  font-weight: 500;
  font-size: .8rem;
  color: var(--color-heading);
  letter-spacing: .8rem;
}

.auth-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: stretch;
  margin-left: auto;
  padding-right: 1rem;
  min-width: 250px;
}

.auth-container input {
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #ccc;
}

.auth-container button {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: none;
  background-color: var(--color-primary);
  color: white;
  cursor: pointer;
}

.auth-container button:hover {
  opacity: 0.9;
}

.error-message {
  color: #ff4444;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.toggle-btn {
  background: none !important;
  color: var(--color-primary) !important;
  text-decoration: underline;
  padding: 0 !important;
}
</style>
