# Step 13 : Recherche avec v-model et debounce

> **Commit** : `step-13-search`
> **Prérequis** : Step 12 complété, API qui tourne

---

## Objectif

Créer une barre de recherche réactive pour trouver des communes.

À la fin de ce step :
- Tu as une SearchBar avec debounce intégré
- Tu comprends `v-model` vs les controlled inputs React
- Tu maîtrises `defineModel()` de Vue 3.4+
- Tu sais utiliser `watchDebounced` de VueUse

---

## Pourquoi ce pattern est différent de React ?

### Le problème en React : Controlled Inputs

```tsx
// React : tout est explicite
function SearchBar() {
  const [value, setValue] = useState('')

  return (
    <input
      value={value}                          // ① Binding lecture
      onChange={e => setValue(e.target.value)} // ② Binding écriture
    />
  )
}
```

**2 choses à configurer** :
1. `value` pour pousser l'état vers l'input
2. `onChange` pour récupérer les changements

### La solution Vue : v-model

```vue
<script setup>
const search = ref('')
</script>

<template>
  <!-- Une seule directive fait tout -->
  <input v-model="search" />
</template>
```

**`v-model` est du sucre syntaxique pour** :

```vue
<input
  :value="search"
  @input="search = $event.target.value"
/>
```

### Tableau comparatif

| Aspect | React (controlled) | Vue (v-model) |
|--------|-------------------|---------------|
| Syntaxe | `value` + `onChange` | `v-model` |
| Lignes de code | 2 props | 1 directive |
| Re-render | Tout le composant | Ciblé (template uniquement) |
| Validation | Dans `onChange` | Dans `watch` ou directive custom |
| Philosophie | Explicite, unidirectionnel | Magique, bidirectionnel |

---

## Anatomie de v-model dans un composant

### React : props + callback

```tsx
// React : pattern classique
interface Props {
  value: string
  onChange: (value: string) => void
}

function SearchBar({ value, onChange }: Props) {
  return <input value={value} onChange={e => onChange(e.target.value)} />
}

// Utilisation
<SearchBar value={search} onChange={setSearch} />
```

### Vue 3.4+ : defineModel()

```vue
<script setup lang="ts">
// Une seule ligne !
const modelValue = defineModel<string>({ default: '' })
// C'est un ref bidirectionnel : modifie modelValue.value = modifie le parent
</script>

<template>
  <!-- Utilisation directe comme un ref local -->
  <input v-model="modelValue" />
</template>
```

**Pourquoi c'est mieux ?**
- Moins de boilerplate
- Type-safe automatiquement
- Pas besoin de `emit` explicite

---

## Le problème du debounce

### Sans debounce : requête à chaque frappe

```
Utilisateur tape "paris"
p      → fetch('p')      ❌ Trop tôt
pa     → fetch('pa')     ❌ Trop tôt
par    → fetch('par')    ❌ Trop tôt
pari   → fetch('pari')   ❌ Trop tôt
paris  → fetch('paris')  ✅ Celui qu'on veut

= 5 requêtes au lieu de 1
```

### Avec debounce : attend que l'utilisateur arrête

```
Utilisateur tape "paris"
p      → (attend 300ms)
pa     → (reset timer, attend 300ms)
par    → (reset timer, attend 300ms)
...
paris  → (attend 300ms... ok, pas de frappe)
       → fetch('paris') ✅ Une seule requête
```

### Vue : watchDebounced de VueUse

```typescript
// VueUse est auto-importé via @vueuse/nuxt
const localValue = ref('')

watchDebounced(
  localValue,
  (value) => {
    // Exécuté 300ms après le dernier changement
    doSearch(value)
  },
  { debounce: 300 }
)
```

---

## Les fichiers à créer/modifier

### 1. Créer la query `apps/web/app/queries/searchCommunes.ts`

```typescript
import { gql } from 'graphql-tag'

export interface CommuneSearchResult {
  id: string
  nom: string
  codePostal: string
  departement: {
    code: string
    nom: string
  }
}

export interface SearchCommunesData {
  searchCommunes: CommuneSearchResult[]
}

export const SEARCH_COMMUNES_QUERY = gql`
  query SearchCommunes($search: String!, $first: Int) {
    searchCommunes(search: $search, first: $first) {
      id
      nom
      codePostal
      departement {
        code
        nom
      }
    }
  }
`
```

### 2. Créer `apps/web/app/components/SearchBar.vue`

```vue
<script setup lang="ts">
/**
 * Barre de recherche avec debounce intégré.
 */

const modelValue = defineModel<string>({ default: '' })

const localValue = ref(modelValue.value)

watchDebounced(
  localValue,
  (value) => {
    modelValue.value = value
  },
  { debounce: 300 }
)

watch(modelValue, (value) => {
  if (value !== localValue.value) {
    localValue.value = value
  }
})
</script>

<template>
  <div class="relative">
    <input
      v-model="localValue"
      type="text"
      placeholder="Rechercher une commune..."
      class="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg
             focus:ring-2 focus:ring-blue-500 focus:border-transparent
             transition-shadow"
    >

    <svg
      class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  </div>
</template>
```

### 3. Créer `apps/web/app/components/SearchResults.vue`

```vue
<script setup lang="ts">
import type { CommuneSearchResult } from '../queries/searchCommunes'

defineProps<{
  communes: CommuneSearchResult[]
  loading: boolean
}>()

defineEmits<{
  select: [commune: CommuneSearchResult]
}>()
</script>

<template>
  <div class="mt-4">
    <div v-if="loading" class="space-y-2">
      <div
        v-for="i in 5"
        :key="i"
        class="h-16 bg-gray-100 rounded animate-pulse"
      />
    </div>

    <div v-else-if="communes.length > 0" class="space-y-2">
      <button
        v-for="commune in communes"
        :key="commune.id"
        class="w-full p-4 text-left bg-white rounded-lg shadow
               hover:bg-blue-50 transition-colors"
        @click="$emit('select', commune)"
      >
        <div class="font-medium text-gray-900">
          {{ commune.nom }}
        </div>
        <div class="text-sm text-gray-500">
          {{ commune.codePostal }} - {{ commune.departement.nom }} ({{ commune.departement.code }})
        </div>
      </button>
    </div>

    <div
      v-else
      class="p-8 text-center text-gray-500 bg-gray-50 rounded-lg"
    >
      Aucune commune trouvée
    </div>
  </div>
</template>
```

### 4. Modifier `apps/web/app/pages/index.vue`

```vue
<script setup lang="ts">
import { DEPARTEMENTS_QUERY, type DepartementsData } from '../queries/departements'
import { SEARCH_COMMUNES_QUERY, type CommuneSearchResult } from '../queries/searchCommunes'

const { data, pending, error } = await useAsyncQuery<DepartementsData>(DEPARTEMENTS_QUERY)

const departements = computed(() => data.value?.departements ?? [])

const totalCommunes = computed(() =>
  departements.value.reduce((sum, dept) => sum + dept.communeCount, 0),
)

const search = ref('')
const searchResults = ref<CommuneSearchResult[]>([])
const searchPending = ref(false)

const { clients } = useApollo()

watchDebounced(
  search,
  async (value: string) => {
    if (value.length < 2) {
      searchResults.value = []
      return
    }
    searchPending.value = true
    const { data } = await clients!.default.query({
      query: SEARCH_COMMUNES_QUERY,
      variables: { search: value, first: 10 },
    })
    searchResults.value = data?.searchCommunes ?? []
    searchPending.value = false
  },
  { debounce: 300 }
)

function handleSelect(commune: CommuneSearchResult) {
  navigateTo(`/communes/${commune.id}`)
}

useSeoMeta({
  title: "Explorateur d'adresses",
  description: 'Explore les adresses françaises',
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 py-6">
        <h1 class="text-3xl font-bold text-gray-900">Explorateur d'adresses</h1>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-8">
      <div v-if="pending" class="animate-pulse h-32 bg-gray-200 rounded" />

      <div
        v-else-if="error"
        class="bg-red-50 border border-red-200 rounded-lg p-6"
      >
        <p class="text-red-700">{{ error }}</p>
      </div>

      <div v-else>
        <div class="mb-8 grid grid-cols-2 gap-4 max-w-md">
          <div class="bg-white rounded-lg shadow p-4">
            <div class="text-3xl font-bold text-blue-600">
              {{ departements.length }}
            </div>
            <div class="text-gray-600">Départements</div>
          </div>
          <div class="bg-white rounded-lg shadow p-4">
            <div class="text-3xl font-bold text-green-600">
              {{ totalCommunes.toLocaleString() }}
            </div>
            <div class="text-gray-600">Communes</div>
          </div>
        </div>

        <div class="max-w-xl mb-8">
          <SearchBar v-model="search" />

          <p
            v-if="search.length > 0 && search.length < 2"
            class="mt-2 text-sm text-gray-500"
          >
            Tape au moins 2 caractères...
          </p>

          <SearchResults
            v-if="search.length >= 2"
            :communes="searchResults"
            :loading="searchPending"
            @select="handleSelect"
          />
        </div>

        <div class="space-y-2">
          <div
            v-for="dept in departements"
            :key="dept.code"
            class="bg-white rounded-lg shadow p-4"
          >
            <span class="font-bold">{{ dept.code }}</span>
            <span class="ml-2">{{ dept.nom }}</span>
            <span class="text-gray-500 ml-2"
              >({{ dept.communeCount }} communes)</span
            >
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
```

---

## Comprendre useApollo pour les queries manuelles

```typescript
const { clients } = useApollo()

// Exécuter une query manuellement
const { data } = await clients!.default.query({
  query: SEARCH_COMMUNES_QUERY,
  variables: { search: 'paris', first: 10 },
})
```

**Quand utiliser `useApollo` vs `useAsyncQuery` ?**

| Méthode | Usage |
|---------|-------|
| `useAsyncQuery` | Données initiales, SSR |
| `useApollo().clients.default.query()` | Queries déclenchées par l'utilisateur |

---

## Checkpoint

### 1. Tester le debounce

1. Ouvre `http://localhost:3000`
2. Ouvre l'onglet Network des DevTools
3. Tape "paris" rapidement dans la barre de recherche
4. Compte les requêtes GraphQL

**Tu dois voir** : Une seule requête 300ms après la dernière frappe, pas 5 requêtes.

### 2. Vérifier l'input instantané

1. Tape une lettre
2. Elle apparaît immédiatement dans l'input (pas de lag)
3. La requête part seulement après 300ms

### 3. Tester les états

| Action | Résultat attendu |
|--------|------------------|
| 0 caractères | Rien (pas de SearchResults) |
| 1 caractère | Message "au moins 2 caractères" |
| 2+ caractères | Skeleton pendant le loading |
| Résultats reçus | Liste cliquable |
| Aucun résultat | Message "Aucune commune trouvée" |

---

## Pièges courants

| Problème | Cause | Solution |
|----------|-------|----------|
| Requête à chaque frappe | Pas de debounce | Utiliser `watchDebounced` |
| `defineModel is not defined` | Version Vue < 3.4 | Mettre à jour ou utiliser props/emit |
| Input lag | Debounce sur l'input | Debounce sur la propagation, pas l'input |
| Boucle infinie | Sync bidirectionnelle sans guard | Vérifier `value !== localValue.value` |
| `watchDebounced is not defined` | VueUse pas configuré | Ajouter `@vueuse/nuxt` aux modules |

---

## Prochaine étape

→ [14-dynamic-route.md](./14-dynamic-route.md) : Page dynamique /communes/[id]
