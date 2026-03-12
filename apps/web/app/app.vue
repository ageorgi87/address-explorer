<script setup lang="ts">
// Import global styles
import '~/assets/css/main.css'
</script>

<template>
  <div class="min-h-screen bg-[#0f0f1a]">
    <NuxtPage />
  </div>
</template>

<style>
/* Ensure dark background on html/body */
html, body {
  background-color: #0f0f1a;
}
</style>
