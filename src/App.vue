<!-- this is the main source of truth for everything-->

<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header>
    <img alt="Silent Planet logo" class="logo" src="@/assets/logo.svg" width="100" height="100" />
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
}
</style>
