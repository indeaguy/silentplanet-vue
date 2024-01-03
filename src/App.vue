<!-- this is the main source of truth for everything-->

<script setup>
import { RouterLink, RouterView } from 'vue-router'
import BaseGlobe from './components/BaseGlobe.vue'
import RegionContent from './components/RegionContent.vue'
import { ref, provide } from 'vue'

const polygonContent = ref('')
provide('polygonContent', polygonContent)

// @TODO evaluate using QUASAR here
</script>

<template>
  <header>
    <img alt="Vue logo" class="logo" src="@/assets/logo.svg" width="125" height="125" />

    <div class="wrapper">
      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
      </nav>

      <RegionContent />
    </div>
  </header>

  <BaseGlobe />

  <RouterView />
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}
</style>
