<!-- this is the main source of truth for everything-->

<script setup>
import { RouterLink, RouterView } from 'vue-router'
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
}
</style>
