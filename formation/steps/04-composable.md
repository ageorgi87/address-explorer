# Step 04 : Premier composable

> **Commit** : `step-04-composable`
> **Duree** : ~30 min
> **Prerequis** : Step 03 complete

---

## Objectif

Extraire la logique du compteur dans un composable (equivalent d'un hook React) et comprendre les auto-imports Nuxt.

---

## C'est quoi un composable ?

### Definition

Un **composable** est une fonction qui encapsule de la logique reutilisable avec de l'etat reactif. C'est exactement le meme concept que les **hooks React**.

```typescript
// React hook
export function useCounter(initial = 0) {
  const [count, setCount] = useState(initial)
  const increment = useCallback(() => setCount(c => c + 1), [])
  return { count, increment }
}

// Vue composable (meme structure !)
export function useCounter(initial = 0) {
  const count = ref(initial)
  const increment = () => count.value++
  return { count, increment }
}
```

### Pourquoi le meme nom "use" ?

La convention `useXxx` existe dans les deux ecosystemes pour les memes raisons :
- Indique que la fonction contient de l'etat
- Distingue des fonctions utilitaires pures
- Facilite la recherche dans le code

---

## Composables Vue vs Hooks React : les differences

### Tableau de comparaison detaille

| Aspect | React Hooks | Vue Composables |
|--------|-------------|-----------------|
| **Import** | `import { useCounter } from '../hooks/useCounter'` | Auto-importe si dans `composables/` |
| **Rules of Hooks** | Obligatoires (pas dans les conditions) | Aucune regle |
| **Execution** | A CHAQUE render | UNE SEULE fois au setup |
| **Stabilite des fonctions** | `useCallback` necessaire | Fonctions stables par defaut |
| **Memoization** | `useMemo` avec deps manuelles | `computed` avec deps auto |
| **Syntaxe** | Identique | Identique |

### Les Rules of Hooks n'existent pas en Vue

En React :
```tsx
// ❌ INTERDIT en React - hook dans une condition
function Component({ enabled }) {
  if (enabled) {
    const { count } = useCounter()  // Error: React Hook cannot be called conditionally
  }
}
```

En Vue :
```vue
<script setup>
// ✅ AUTORISE en Vue - composable dans une condition
if (props.enabled) {
  const { count } = useCounter()  // Aucun probleme
}
</script>
```

**Pourquoi ?** En React, les hooks sont appeles a chaque render et React les identifie par leur ordre d'appel. Si l'ordre change (a cause d'une condition), React se perd. En Vue, `<script setup>` s'execute une seule fois, donc l'ordre n'a pas d'importance.

### L'execution unique change tout

```tsx
// React : cette fonction est recree a CHAQUE render
function useCounter() {
  console.log('useCounter called')  // Log a chaque render
  const [count, setCount] = useState(0)

  // Sans useCallback, increment change de reference a chaque render
  const increment = useCallback(() => setCount(c => c + 1), [])

  return { count, increment }
}
```

```typescript
// Vue : cette fonction s'execute UNE SEULE FOIS
function useCounter() {
  console.log('useCounter called')  // Log une seule fois
  const count = ref(0)

  // increment est cree une seule fois, reference stable
  const increment = () => count.value++

  return { count, increment }
}
```

---

## Les auto-imports Nuxt

### Comment ca marche

Nuxt scanne les dossiers conventionnels au demarrage :
- `app/composables/` → fonctions `useXxx` disponibles partout
- `app/components/` → composants disponibles partout
- `app/utils/` → fonctions utilitaires disponibles partout

Tu n'ecris **jamais** d'import pour ces elements.

### Ce que tu gagnes

```vue
<!-- REACT : imports manuels obligatoires -->
<script>
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import { useCounter } from '../hooks/useCounter'
import { useAuth } from '../hooks/useAuth'
import Button from '../components/Button'
import Card from '../components/Card'
</script>

<!-- VUE/NUXT : zero imports -->
<script setup>
// Tout est disponible directement !
const { count } = useCounter()
const { user } = useAuth()
const router = useRouter()
</script>

<template>
  <!-- Composants aussi auto-importes -->
  <Card>
    <Button @click="increment">{{ count }}</Button>
  </Card>
</template>
```

### Ou Nuxt stocke les declarations

Apres avoir lance `npm run dev`, regarde :

```bash
cat apps/web/.nuxt/imports.d.ts
```

Tu verras quelque chose comme :
```typescript
export {}
declare global {
  const ref: typeof import('vue')['ref']
  const computed: typeof import('vue')['computed']
  const useRoute: typeof import('vue-router')['useRoute']
  const useCounter: typeof import('../app/composables/useCounter')['useCounter']
  // ... des centaines d'autres
}
```

C'est ainsi que TypeScript connait ces fonctions sans import.

### Quand les auto-imports sont regeneres

- A chaque demarrage de `npm run dev`
- Quand tu crees/supprimes un fichier dans `composables/` ou `components/`
- Le HMR met a jour en temps reel

**Piege** : Si tu viens de creer un composable et qu'il n'est pas reconnu, relance `npm run dev`.

---

## Anatomie d'un composable

### Structure de base

```typescript
// app/composables/useXxx.ts

export function useXxx(/* parametres */) {
  // 1. ETAT REACTIF
  const state = ref(initialValue)
  const otherState = reactive({ ... })

  // 2. VALEURS CALCULEES
  const derived = computed(() => state.value * 2)

  // 3. WATCHERS (optionnel)
  watch(state, (newVal) => {
    console.log('state changed:', newVal)
  })

  // 4. LIFECYCLE HOOKS (optionnel)
  onMounted(() => {
    console.log('component using this composable mounted')
  })

  // 5. FONCTIONS
  function doSomething() {
    state.value++
  }

  // 6. RETOUR
  return {
    state,        // refs
    derived,      // computed
    doSomething,  // functions
  }
}
```

### Comparaison avec un hook React

```tsx
// hooks/useXxx.ts (React)

export function useXxx(/* parametres */) {
  // 1. ETAT
  const [state, setState] = useState(initialValue)

  // 2. VALEURS CALCULEES (avec deps manuelles !)
  const derived = useMemo(() => state * 2, [state])

  // 3. EFFECTS (avec deps manuelles !)
  useEffect(() => {
    console.log('state changed:', state)
  }, [state])

  // 4. LIFECYCLE
  useEffect(() => {
    console.log('mounted')
    return () => console.log('unmounted')
  }, [])

  // 5. FONCTIONS (avec useCallback pour stabilite !)
  const doSomething = useCallback(() => {
    setState(s => s + 1)
  }, [])

  // 6. RETOUR
  return {
    state,
    derived,
    doSomething,
  }
}
```

**Observations** :
- Vue n'a pas besoin de tableaux de dependances (`[state]`)
- Vue n'a pas besoin de `useCallback` pour stabiliser les fonctions
- La structure est tres similaire

---

## Fichiers a creer/modifier

### 1. Creer `apps/web/app/composables/useCounter.ts`

```typescript
/**
 * Composable pour gerer un compteur.
 * Equivalent du hook useCounter en React.
 *
 * @param initial - Valeur initiale du compteur
 * @returns Etat reactif et fonctions pour manipuler le compteur
 *
 * @example
 * const { count, increment, reset } = useCounter(10)
 */
export function useCounter(initial = 0) {
  // ============================================
  // ETAT REACTIF
  // ============================================

  // ref() cree un etat reactif
  // Equivalent : const [count, setCount] = useState(initial)
  const count = ref(initial)

  // Stocker la valeur initiale pour le reset
  const initialValue = initial

  // ============================================
  // VALEURS CALCULEES
  // ============================================

  // computed() = useMemo() mais sans tableau de dependances
  // Vue detecte automatiquement que doubled depend de count
  const doubled = computed(() => count.value * 2)

  // On peut avoir plusieurs computed
  const isPositive = computed(() => count.value > 0)
  const isNegative = computed(() => count.value < 0)
  const isZero = computed(() => count.value === 0)

  // ============================================
  // FONCTIONS
  // ============================================

  // Pas besoin de useCallback !
  // Ces fonctions sont creees une seule fois
  // et gardent une reference stable
  function increment() {
    count.value++
  }

  function decrement() {
    count.value--
  }

  function reset() {
    count.value = initialValue
  }

  function set(value: number) {
    count.value = value
  }

  // ============================================
  // RETOUR
  // ============================================

  // Retourne un objet avec tout ce qui est utile
  // Le composant peut destructurer ce dont il a besoin
  return {
    // Etat
    count,          // Ref<number>

    // Computed
    doubled,        // ComputedRef<number>
    isPositive,     // ComputedRef<boolean>
    isNegative,     // ComputedRef<boolean>
    isZero,         // ComputedRef<boolean>

    // Actions
    increment,      // () => void
    decrement,      // () => void
    reset,          // () => void
    set,            // (value: number) => void
  }
}

// ============================================
// TYPE INFERENCE
// ============================================

// TypeScript infere automatiquement le type de retour
// Tu peux l'exporter si besoin
export type UseCounterReturn = ReturnType<typeof useCounter>
```

### 2. Modifier `apps/web/app/pages/index.vue`

```vue
<script setup lang="ts">
// ============================================
// COMPOSABLES - AUCUN IMPORT NECESSAIRE !
// ============================================

// useCounter est auto-importe depuis app/composables/useCounter.ts
// En React : import { useCounter } from '../hooks/useCounter'
// En Nuxt  : rien ! Juste utiliser directement

// Premiere instance du compteur (destructuree)
const { count, doubled, increment, decrement, reset, isZero } = useCounter(0)

// Deuxieme instance INDEPENDANTE
// Chaque appel a useCounter() cree son propre etat
const timer = useCounter(100)

// Troisieme instance avec valeur negative
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
      Step 04 : Les composables (equivalent des hooks React)
    </p>

    <!-- ============================================ -->
    <!-- INSTANCE 1 : Compteur principal             -->
    <!-- ============================================ -->
    <div class="mt-8 p-6 bg-white rounded-lg shadow max-w-md">
      <h2 class="text-lg font-semibold text-gray-700">
        Compteur principal
        <span class="text-sm font-normal text-gray-400 ml-2">
          (useCounter destructure)
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
        <p>Est zero : <span class="font-mono">{{ isZero }}</span></p>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- INSTANCE 2 : Timer (instance independante)  -->
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
    <!-- INSTANCE 3 : Temperature                    -->
    <!-- ============================================ -->
    <div class="mt-4 p-6 bg-white rounded-lg shadow max-w-md">
      <h2 class="text-lg font-semibold text-gray-700">
        Temperature
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
          :class="temperature.isNegative ? 'text-blue-600' : 'text-orange-600'"
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
        Etat :
        <span v-if="temperature.isNegative" class="text-blue-600">Gel</span>
        <span v-else-if="temperature.isZero" class="text-gray-600">Point de congelation</span>
        <span v-else class="text-orange-600">Au-dessus de zero</span>
      </p>
    </div>

    <!-- ============================================ -->
    <!-- EXPLICATIONS                                -->
    <!-- ============================================ -->
    <div class="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-lg">
      <h3 class="font-semibold text-blue-800 mb-2">
        Pourquoi 3 instances independantes ?
      </h3>
      <p class="text-sm text-blue-700">
        Chaque appel a <code>useCounter()</code> cree son propre etat isole.
        Comme en React avec les hooks, chaque instance a sa propre "memoire".
      </p>
    </div>

    <div class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-lg">
      <h3 class="font-semibold text-yellow-800 mb-2">
        Ou trouver les auto-imports ?
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
// RIEN A IMPORTER !

const { count, increment } = useCounter(0)
const timer = useCounter(100)
// ...</code></pre>
      </div>
    </div>
  </div>
</template>
```

---

## Checkpoint

### 1. Lancer le serveur

```bash
npm run dev:web
```

### 2. Ouvrir le navigateur

Ouvre `http://localhost:3000`

**Tu dois voir** :
- Compteur principal (bleu) avec valeur initiale 0
- Timer (vert) avec valeur initiale 100
- Temperature (orange/bleu) avec valeur initiale -5
- Chaque compteur fonctionne independamment

### 3. Verifier l'independance

1. Clique sur + du compteur principal
2. Verifie que le timer et la temperature n'ont pas change
3. Les trois instances ont chacune leur propre etat

### 4. Verifier les auto-imports

```bash
cat apps/web/.nuxt/imports.d.ts | grep useCounter
```

Tu dois voir :
```typescript
const useCounter: typeof import('../app/composables/useCounter')['useCounter']
```

---

## Pieges courants

| Probleme | Cause | Solution |
|----------|-------|----------|
| `useCounter is not defined` | Fichier mal place | Doit etre dans `app/composables/` (pas `composables/` a la racine) |
| Import manuel ajoute | Reflexe React | Supprime l'import, Nuxt auto-importe |
| Nom de fichier sans `use` | Convention non respectee | `useXxx.ts` pour les composables |
| Composable pas detecte | Serveur pas relance | `Ctrl+C` puis `npm run dev:web` |
| TypeScript ne reconnait pas | `.nuxt` pas genere | Relancer le serveur de dev |

---

## Patterns avances de composables

### Pattern 1 : Composable avec options

```typescript
// app/composables/useCounter.ts
interface UseCounterOptions {
  min?: number
  max?: number
  step?: number
}

export function useCounter(initial = 0, options: UseCounterOptions = {}) {
  const { min = -Infinity, max = Infinity, step = 1 } = options

  const count = ref(initial)

  // Computed pour verifier les limites
  const canIncrement = computed(() => count.value + step <= max)
  const canDecrement = computed(() => count.value - step >= min)

  function increment() {
    if (canIncrement.value) {
      count.value += step
    }
  }

  function decrement() {
    if (canDecrement.value) {
      count.value -= step
    }
  }

  return { count, increment, decrement, canIncrement, canDecrement }
}

// Usage
const { count, canIncrement } = useCounter(0, { min: 0, max: 10, step: 2 })
```

### Pattern 2 : Composable avec watch

```typescript
// app/composables/useDebounce.ts
export function useDebounce<T>(value: Ref<T>, delay = 300) {
  const debouncedValue = ref(value.value) as Ref<T>

  let timeout: ReturnType<typeof setTimeout>

  watch(value, (newValue) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      debouncedValue.value = newValue
    }, delay)
  })

  return debouncedValue
}

// Usage dans un composant
const searchQuery = ref('')
const debouncedQuery = useDebounce(searchQuery, 500)
// debouncedQuery se met a jour 500ms apres searchQuery
```

### Pattern 3 : Composable avec lifecycle

```typescript
// app/composables/useWindowSize.ts
export function useWindowSize() {
  const width = ref(0)
  const height = ref(0)

  function update() {
    width.value = window.innerWidth
    height.value = window.innerHeight
  }

  // onMounted s'execute quand le composant utilisant ce composable est monte
  onMounted(() => {
    update()
    window.addEventListener('resize', update)
  })

  // onUnmounted s'execute quand le composant est demonte
  onUnmounted(() => {
    window.removeEventListener('resize', update)
  })

  return { width, height }
}

// Usage
const { width, height } = useWindowSize()
// width et height se mettent a jour au resize
```

### Pattern 4 : Composable partageant un etat global

```typescript
// app/composables/useUser.ts

// Etat HORS de la fonction = partage entre tous les composants
const currentUser = ref<User | null>(null)
const isLoading = ref(false)

export function useUser() {
  async function login(credentials: Credentials) {
    isLoading.value = true
    try {
      currentUser.value = await api.login(credentials)
    } finally {
      isLoading.value = false
    }
  }

  function logout() {
    currentUser.value = null
  }

  return {
    user: readonly(currentUser),  // readonly pour eviter les modifications directes
    isLoading: readonly(isLoading),
    login,
    logout,
  }
}

// Tous les composants partagent le meme user
// ComponentA: const { user } = useUser()
// ComponentB: const { user } = useUser()  // Meme reference !
```

---

## Quand creer un composable ?

| Situation | Creer un composable ? |
|-----------|----------------------|
| Logique utilisee dans 2+ composants | ✅ Oui |
| Logique complexe avec plusieurs refs/computed | ✅ Oui, pour clarifier |
| Interaction avec une API externe | ✅ Oui |
| Logique simple, 1-2 lignes | ❌ Non, inline suffit |
| Etat global partage | ✅ Oui (avec etat hors de la fonction) |

---

## Prochaine etape

→ [05-prisma-setup.md](./05-prisma-setup.md) : Configurer Prisma et PostgreSQL pour la base de donnees
