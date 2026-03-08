<script setup lang="ts">
// Pas d'imports ! Tout est auto-importé par Nuxt

// ref() = useState() en React, mais :
// - Retourne un objet { value: ... }
// - Se lit avec .value dans le script
// - Se lit SANS .value dans le template (auto-unwrap)
const message = ref('Hello from Nuxt 4!')

// useSeoMeta() = <Head> en Next.js
// Génère les balises <title>, <meta>, etc.
useSeoMeta({
  title: 'Explorateur d\'adresses',
  description: 'Recherchez parmi 26 millions d\'adresses françaises'
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 p-8">
    <!-- Pas d'import pour les classes Tailwind, Nuxt UI l'inclut -->
    <h1 class="text-3xl font-bold text-gray-900">
      {{ message }}
    </h1>

    <p class="mt-4 text-gray-600">
      Nuxt 4 + Nuxt UI fonctionnent !
    </p>

    <!-- UButton = composant Nuxt UI, auto-importé -->
    <UButton class="mt-6" color="primary">
      Un bouton Nuxt UI
    </UButton>
  </div>
</template>
