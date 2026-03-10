<script setup lang="ts">
// ============================================
// COMPOSABLES - AUCUN IMPORT NÉCESSAIRE !
// ============================================

// useCounter est auto-importé depuis app/composables/useCounter.ts
// En React : import { useCounter } from '../hooks/useCounter'
// En Nuxt  : rien ! Juste utiliser directement

// Première instance du compteur (destructurée)
const { count, doubled, increment, decrement, reset, isZero } = useCounter(0)

// Deuxième instance INDÉPENDANTE
// Chaque appel à useCounter() crée son propre état
const timer = useCounter(100)

// Troisième instance avec valeur négative
const temperature = useCounter(-5)

// ============================================
// SEO
// ============================================

useSeoMeta({
  title: 'Les composables Vue',
  description: 'Step 04 - Comprendre les composables (hooks Vue)'
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 p-8">
    <h1 class="text-3xl font-bold text-gray-900">
      Explorateur d'adresses
    </h1>

    <p class="mt-2 text-gray-600">
      Step 04 : Les composables (équivalent des hooks React)
    </p>

    <!-- ============================================ -->
    <!-- INSTANCE 1 : Compteur principal             -->
    <!-- ============================================ -->
    <div class="mt-8 p-6 bg-white rounded-lg shadow max-w-md">
      <h2 class="text-lg font-semibold text-gray-700">
        Compteur principal
        <span class="text-sm font-normal text-gray-400 ml-2">
          (useCounter destructuré)
        </span>
      </h2>

      <div class="mt-4 flex items-center gap-4">
        <button
          class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
          @click="decrement"
        >
          -
        </button>

        <span
          class="text-2xl font-mono w-16 text-center"
          :class="{
            'text-green-600': count > 0,
            'text-red-600': count < 0,
            'text-gray-400': count === 0
          }"
        >
          {{ count }}
        </span>

        <button
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          @click="increment"
        >
          +
        </button>

        <button
          class="px-3 py-2 text-gray-500 hover:text-gray-700 transition-colors"
          @click="reset"
        >
          Reset
        </button>
      </div>

      <div class="mt-4 text-sm text-gray-500 space-y-1">
        <p>Double (computed) : <span class="font-mono">{{ doubled }}</span></p>
        <p>Est zéro : <span class="font-mono">{{ isZero }}</span></p>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- INSTANCE 2 : Timer (instance indépendante)  -->
    <!-- ============================================ -->
    <div class="mt-4 p-6 bg-white rounded-lg shadow max-w-md">
      <h2 class="text-lg font-semibold text-gray-700">
        Timer
        <span class="text-sm font-normal text-gray-400 ml-2">
          (autre instance, valeur initiale 100)
        </span>
      </h2>

      <div class="mt-4 flex items-center gap-4">
        <button
          class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
          @click="timer.decrement"
        >
          -
        </button>

        <span class="text-2xl font-mono w-16 text-center text-green-600">
          {{ timer.count }}
        </span>

        <button
          class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          @click="timer.increment"
        >
          +
        </button>

        <button
          class="px-3 py-2 text-gray-500 hover:text-gray-700 transition-colors"
          @click="timer.reset"
        >
          Reset (100)
        </button>
      </div>

      <p class="mt-4 text-sm text-gray-500">
        Double : <span class="font-mono">{{ timer.doubled }}</span>
      </p>
    </div>

    <!-- ============================================ -->
    <!-- INSTANCE 3 : Température                    -->
    <!-- ============================================ -->
    <div class="mt-4 p-6 bg-white rounded-lg shadow max-w-md">
      <h2 class="text-lg font-semibold text-gray-700">
        Température
        <span class="text-sm font-normal text-gray-400 ml-2">
          (valeur initiale -5)
        </span>
      </h2>

      <div class="mt-4 flex items-center gap-4">
        <button
          class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
          @click="temperature.decrement"
        >
          -
        </button>

        <span
          class="text-2xl font-mono w-20 text-center"
          :class="temperature.isNegative.value ? 'text-blue-600' : 'text-orange-600'"
        >
          {{ temperature.count }}°C
        </span>

        <button
          class="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
          @click="temperature.increment"
        >
          +
        </button>
      </div>

      <p class="mt-4 text-sm text-gray-500">
        État :
        <!-- IMPORTANT: .value est requis ici car temperature n'est pas destructuré -->
        <!-- Vue n'auto-unwrap les refs que dans les objets réactifs -->
        <span v-if="temperature.isNegative.value" class="text-blue-600">Gel</span>
        <span v-else-if="temperature.isZero.value" class="text-gray-600">Point de congélation</span>
        <span v-else class="text-orange-600">Au-dessus de zéro</span>
      </p>
    </div>

    <!-- ============================================ -->
    <!-- EXPLICATIONS                                -->
    <!-- ============================================ -->
    <div class="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-lg">
      <h3 class="font-semibold text-blue-800 mb-2">
        Pourquoi 3 instances indépendantes ?
      </h3>
      <p class="text-sm text-blue-700">
        Chaque appel à <code>useCounter()</code> crée son propre état isolé.
        Comme en React avec les hooks, chaque instance a sa propre "mémoire".
      </p>
    </div>

    <div class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-lg">
      <h3 class="font-semibold text-yellow-800 mb-2">
        Où trouver les auto-imports ?
      </h3>
      <p class="text-sm text-yellow-700">
        Regarde <code>.nuxt/imports.d.ts</code> pour voir tout ce que Nuxt
        auto-importe : Vue, Vue Router, tes composables, tes composants...
      </p>
    </div>

    <!-- ============================================ -->
    <!-- COMPARAISON CODE                            -->
    <!-- ============================================ -->
    <div class="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
      <div class="p-4 bg-white rounded-lg shadow">
        <h3 class="font-semibold text-red-600 mb-3">React (avec imports)</h3>
        <pre class="text-xs bg-gray-100 p-3 rounded overflow-x-auto"><code>// Dans le composant
import { useCounter } from '../hooks/useCounter'
import { useTimer } from '../hooks/useTimer'

function Page() {
  const { count, increment } = useCounter(0)
  const timer = useTimer(100)
  // ...
}</code></pre>
      </div>

      <div class="p-4 bg-white rounded-lg shadow">
        <h3 class="font-semibold text-green-600 mb-3">Vue (auto-imports)</h3>
        <pre class="text-xs bg-gray-100 p-3 rounded overflow-x-auto"><code>// Dans le composant
// RIEN À IMPORTER !

const { count, increment } = useCounter(0)
const timer = useCounter(100)
// ...</code></pre>
      </div>
    </div>
  </div>
</template>
