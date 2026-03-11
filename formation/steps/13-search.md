# Step 13 : Recherche avec v-model et debounce

> **Commit** : `step-13-search`
> **Durée** : ~40 min
> **Prérequis** : Step 12 complété, API qui tourne

---

## Objectif

Créer une barre de recherche réactive pour trouver des voies.

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

### Vue < 3.4 : props + emit

```vue
<script setup lang="ts">
// Vue classique : définir props et emit
const props = defineProps<{
  modelValue: string   // Convention : "modelValue" pour v-model
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]   // Convention : "update:modelValue"
}>()
</script>

<template>
  <input
    :value="modelValue"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
```

### Vue 3.4+ : defineModel()

```vue
<script setup lang="ts">
// ✅ Nouveau : une seule ligne !
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
Utilisateur tape "rivoli"
r      → fetch('r')      ❌ Trop tôt
ri     → fetch('ri')     ❌ Trop tôt
riv    → fetch('riv')    ❌ Trop tôt
rivo   → fetch('rivo')   ❌ Trop tôt
rivol  → fetch('rivol')  ❌ Trop tôt
rivoli → fetch('rivoli') ✅ Celui qu'on veut

= 6 requêtes au lieu de 1
```

### Avec debounce : attend que l'utilisateur arrête

```
Utilisateur tape "rivoli"
r      → (attend 300ms)
ri     → (reset timer, attend 300ms)
riv    → (reset timer, attend 300ms)
...
rivoli → (attend 300ms... ok, pas de frappe)
       → fetch('rivoli') ✅ Une seule requête
```

### React : useEffect + setTimeout

```tsx
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)  // Cleanup = reset timer
  }, [value, delay])

  return debouncedValue
}

// Utilisation
const debouncedSearch = useDebounce(search, 300)
```

### Vue : watchDebounced de VueUse

```typescript
import { watchDebounced } from '@vueuse/core'

const localValue = ref('')
const debouncedValue = ref('')

// Quand localValue change, met à jour debouncedValue après 300ms
watchDebounced(
  localValue,
  (value) => {
    debouncedValue.value = value
  },
  { debounce: 300 }
)
```

**Avantage Nuxt** : VueUse est auto-importé, pas besoin d'import explicite.

---

## Les fichiers à créer/modifier

### 1. Créer `apps/web/app/components/SearchBar.vue`

```vue
<script setup lang="ts">
/**
 * Barre de recherche avec debounce intégré.
 *
 * Pattern utilisé : Local + Debounce → Parent
 *
 * ┌─────────────────────────────────────────────┐
 * │  Parent (index.vue)                         │
 * │                                             │
 * │  search ←──────── modelValue (debounced)    │
 * │                          ↑                  │
 * │                     (300ms delay)           │
 * │                          ↑                  │
 * │              ┌───────────────────┐          │
 * │              │ SearchBar.vue     │          │
 * │              │                   │          │
 * │              │  localValue ←─ input         │
 * │              │  (instant)        │          │
 * │              └───────────────────┘          │
 * └─────────────────────────────────────────────┘
 *
 * Pourquoi ce pattern ?
 * - L'input répond instantanément (pas de lag UX)
 * - Le parent reçoit la valeur après debounce (pas de spam API)
 */

// ============================================================
// DEFINE MODEL
// ============================================================
// defineModel() = v-model bidirectionnel (Vue 3.4+)
// Crée automatiquement :
// - Une prop "modelValue"
// - Un emit "update:modelValue"
// - Un ref réactif synchronisé avec le parent
//
// Equivalent React :
// interface Props {
//   value: string
//   onChange: (value: string) => void
// }
// ============================================================

const modelValue = defineModel<string>({ default: '' })

// ============================================================
// REF LOCALE POUR LE DEBOUNCE
// ============================================================
// On utilise une valeur locale pour que l'input soit réactif
// instantanément, même si on debounce la propagation au parent.
//
// Si on utilisait directement modelValue avec debounce,
// l'input aurait un délai de 300ms = UX horrible.
// ============================================================

const localValue = ref(modelValue.value)

// ============================================================
// SYNC LOCAL → PARENT (avec debounce)
// ============================================================
// watchDebounced vient de VueUse (auto-importé par Nuxt)
// Quand localValue change, on attend 300ms sans autre changement
// avant de propager au parent.
//
// Equivalent React :
// useEffect(() => {
//   const timer = setTimeout(() => {
//     onChange(localValue)
//   }, 300)
//   return () => clearTimeout(timer)
// }, [localValue])
// ============================================================

watchDebounced(
  localValue,
  (value) => {
    modelValue.value = value
  },
  { debounce: 300 }
)

// ============================================================
// SYNC PARENT → LOCAL (sans debounce)
// ============================================================
// Si le parent modifie la valeur (ex: bouton "clear"),
// on synchronise immédiatement vers l'input local.
//
// Le check `value !== localValue.value` évite les boucles infinies :
// local change → parent change → local change → ...
// ============================================================

watch(modelValue, (value) => {
  if (value !== localValue.value) {
    localValue.value = value
  }
})
</script>

<template>
  <!--
    Container avec positionnement relatif pour l'icône absolue.
  -->
  <div class="relative">
    <!--
      Input avec v-model sur la valeur LOCALE (pas modelValue).
      Ainsi l'utilisateur voit ses frappes instantanément.
    -->
    <input
      v-model="localValue"
      type="text"
      placeholder="Rechercher une voie..."
      class="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg
             focus:ring-2 focus:ring-blue-500 focus:border-transparent
             transition-shadow"
    >

    <!--
      Icône de recherche positionnée à gauche de l'input.
      Utilise translate pour centrer verticalement.
    -->
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

### 2. Créer `apps/web/app/components/SearchResults.vue`

```vue
<script setup lang="ts">
/**
 * Affichage des résultats de recherche.
 *
 * Pattern Vue pour les composants de présentation :
 * - Props pour les données entrantes
 * - Emits pour les événements sortants
 * - Pas de logique métier, juste de l'affichage
 *
 * Equivalent React :
 * interface Props {
 *   voies: Voie[]
 *   loading: boolean
 *   onSelect: (voie: Voie) => void
 * }
 */

// ============================================================
// INTERFACE DES DONNÉES
// ============================================================

interface Voie {
  id: string
  nom: string
  commune: {
    nom: string
    codePostal: string
  }
}

// ============================================================
// DEFINE PROPS
// ============================================================
// defineProps avec TypeScript = typage automatique des props.
// Pas besoin de runtime validation, c'est compile-time.
//
// Equivalent React :
// function SearchResults({ voies, loading }: {
//   voies: Voie[]
//   loading: boolean
// })
// ============================================================

defineProps<{
  voies: Voie[]
  loading: boolean
}>()

// ============================================================
// DEFINE EMITS
// ============================================================
// defineEmits déclare les événements que ce composant émet.
// Notation TypeScript : [paramètre: type]
//
// Equivalent React :
// onSelect: (voie: Voie) => void
//
// Différence clé :
// - React : callback en prop
// - Vue : événement émis vers le parent
// ============================================================

defineEmits<{
  select: [voie: Voie]
}>()
</script>

<template>
  <div class="mt-4">
    <!--
      État 1 : Chargement
      v-if évalue la condition et render/destroy le DOM selon le résultat.

      Equivalent React :
      {loading && <Skeleton />}
    -->
    <div v-if="loading" class="space-y-2">
      <!--
        v-for avec :key pour les listes.
        `:key` est OBLIGATOIRE en Vue (erreur si absent).
        Sert au virtual DOM pour identifier les éléments.
      -->
      <div
        v-for="i in 5"
        :key="i"
        class="h-16 bg-gray-100 rounded animate-pulse"
      />
    </div>

    <!--
      État 2 : Résultats trouvés
      v-else-if chaîne avec le v-if précédent.
    -->
    <div v-else-if="voies.length > 0" class="space-y-2">
      <button
        v-for="voie in voies"
        :key="voie.id"
        class="w-full p-4 text-left bg-white rounded-lg shadow
               hover:bg-blue-50 transition-colors"
        @click="$emit('select', voie)"
      >
        <!--
          {{ }} = interpolation de texte (mustache syntax).
          Equivalent React : {voie.nom}
        -->
        <div class="font-medium text-gray-900">
          {{ voie.nom }}
        </div>
        <div class="text-sm text-gray-500">
          {{ voie.commune.nom }} ({{ voie.commune.codePostal }})
        </div>
      </button>
    </div>

    <!--
      État 3 : Aucun résultat
      v-else capture tous les cas restants.
    -->
    <div
      v-else
      class="p-8 text-center text-gray-500 bg-gray-50 rounded-lg"
    >
      Aucune voie trouvée
    </div>
  </div>
</template>
```

### 3. Modifier `apps/web/app/pages/index.vue`

```vue
<script setup lang="ts">
/**
 * Page d'accueil avec recherche de voies.
 *
 * Architecture de la recherche :
 *
 * ┌─────────────────────────────────────────────┐
 * │  index.vue                                  │
 * │                                             │
 * │  search (ref) ←──── SearchBar (debounced)   │
 * │       │                                     │
 * │       ▼                                     │
 * │  useAsyncData({ watch: [search] })          │
 * │       │                                     │
 * │       ▼                                     │
 * │  data (query results)                       │
 * │       │                                     │
 * │       ▼                                     │
 * │  voies (computed) → SearchResults           │
 * └─────────────────────────────────────────────┘
 *
 * Le `watch` sur search déclenche automatiquement
 * un re-fetch quand la valeur change.
 */

// ============================================================
// GRAPHQL QUERY
// ============================================================
// gql est auto-importé par @nuxtjs/apollo.
// Définir la query en haut du fichier pour lisibilité.
// ============================================================

const SEARCH_VOIES_QUERY = gql`
  query SearchVoies($search: String!, $first: Int!) {
    searchVoies(search: $search, first: $first) {
      edges {
        node {
          id
          nom
          commune {
            nom
            codePostal
          }
        }
      }
    }
  }
`

// ============================================================
// STATE DE RECHERCHE
// ============================================================
// ref('') crée une valeur réactive initialisée à chaîne vide.
// Cette valeur est synchronisée avec SearchBar via v-model.
//
// Equivalent React :
// const [search, setSearch] = useState('')
// ============================================================

const search = ref('')

// ============================================================
// FETCH AVEC WATCH AUTOMATIQUE
// ============================================================
// useAsyncData avec l'option `watch` re-exécute la fonction
// chaque fois qu'une des refs du tableau change.
//
// C'est l'équivalent de :
// useEffect(() => {
//   if (search.length >= 2) fetchData()
// }, [search])
//
// Mais avec gestion SSR, cache, et états (pending, error).
// ============================================================

const { data, pending } = await useAsyncData(
  'searchVoies',  // Clé de cache unique
  async () => {
    // Guard : ne pas fetch si moins de 2 caractères
    // Évite les requêtes trop génériques
    if (search.value.length < 2) return null

    // Récupérer le client Apollo
    const { resolveClient } = useApollo()
    const client = resolveClient()

    // Exécuter la query GraphQL
    return client.query({
      query: SEARCH_VOIES_QUERY,
      variables: {
        search: search.value,
        first: 10
      }
    })
  },
  {
    // Re-fetch automatique quand search change
    // C'est ce qui rend la recherche "live"
    watch: [search]
  }
)

// ============================================================
// COMPUTED POUR EXTRAIRE LES VOIES
// ============================================================
// computed() crée une valeur dérivée qui se recalcule
// automatiquement quand ses dépendances changent.
//
// Ici : quand data change, voies est recalculé.
//
// Equivalent React :
// const voies = useMemo(() =>
//   data?.data?.searchVoies?.edges?.map(e => e.node) ?? [],
//   [data]
// )
//
// Différence : Vue détecte automatiquement les dépendances.
// ============================================================

const voies = computed(() =>
  data.value?.data?.searchVoies?.edges?.map((e: any) => e.node) ?? []
)

// ============================================================
// NAVIGATION
// ============================================================
// navigateTo() est auto-importé par Nuxt.
// C'est l'équivalent de router.push() mais plus simple.
//
// Equivalent React :
// const router = useRouter()
// function handleSelect(voie) {
//   router.push(`/voies/${voie.id}`)
// }
// ============================================================

function handleSelect(voie: any) {
  navigateTo(`/voies/${voie.id}`)
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 p-8">
    <!--
      Titre de la page.
      Pas de Head/useSeoMeta ici car c'est l'index,
      les meta par défaut suffisent.
    -->
    <h1 class="text-3xl font-bold text-gray-900">
      Explorateur d'adresses
    </h1>

    <div class="mt-8 max-w-xl">
      <!--
        Barre de recherche avec v-model bidirectionnel.
        Le composant SearchBar gère le debounce en interne.

        v-model="search" est équivalent à :
        :modelValue="search"
        @update:modelValue="search = $event"

        Equivalent React :
        <SearchBar
          value={search}
          onChange={setSearch}
        />
      -->
      <SearchBar v-model="search" />

      <!--
        Indication du minimum de caractères.
        v-if conditionnel : affiche seulement si conditions remplies.

        Equivalent React :
        {search.length > 0 && search.length < 2 && (
          <p>Tape au moins 2 caractères...</p>
        )}
      -->
      <p
        v-if="search.length > 0 && search.length < 2"
        class="mt-2 text-sm text-gray-500"
      >
        Tape au moins 2 caractères...
      </p>

      <!--
        Résultats de recherche.
        Seulement affiché si on a au moins 2 caractères.

        @select écoute l'événement "select" émis par SearchResults.
        C'est l'équivalent de onSelect en React.
      -->
      <SearchResults
        v-if="search.length >= 2"
        :voies="voies"
        :loading="pending"
        @select="handleSelect"
      />
    </div>
  </div>
</template>
```

---

## Comprendre v-if vs v-show

### v-if : conditional rendering

```vue
<template>
  <!-- v-if détruit/recrée le DOM -->
  <div v-if="show">Je suis créé/détruit</div>
</template>
```

**Équivalent React :**
```tsx
{show && <div>Je suis créé/détruit</div>}
```

### v-show : toggle visibility

```vue
<template>
  <!-- v-show ajoute/retire display: none -->
  <div v-show="show">Je suis caché/visible</div>
</template>
```

**Équivalent React :**
```tsx
<div style={{ display: show ? 'block' : 'none' }}>
  Je suis caché/visible
</div>
```

### Quand utiliser lequel ?

| Cas d'usage | Recommandation |
|-------------|----------------|
| Toggle fréquent | `v-show` (pas de re-render) |
| Condition rarement changée | `v-if` (pas de DOM caché) |
| Plusieurs conditions | `v-if` / `v-else-if` / `v-else` |
| Grosse section | `v-if` (moins de DOM initial) |

---

## Commandes à exécuter

```bash
# Terminal 1 : Lancer l'API
npm run dev:api

# Terminal 2 : Lancer le front
npm run dev:web
```

---

## Checkpoint ✓

### 1. Tester le debounce

1. Ouvre `http://localhost:3000`
2. Ouvre l'onglet Network des DevTools
3. Tape "rivoli" rapidement dans la barre de recherche
4. Compte les requêtes GraphQL

**Tu dois voir** : Une seule requête 300ms après la dernière frappe, pas 6 requêtes.

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
| Aucun résultat | Message "Aucune voie trouvée" |

---

## Pièges courants

| Problème | Cause | Solution |
|----------|-------|----------|
| Requête à chaque frappe | Pas de debounce | Utiliser `watchDebounced` |
| `defineModel is not defined` | Version Vue < 3.4 | Mettre à jour ou utiliser props/emit |
| Résultats pas à jour | Cache Apollo | Vérifier `watch: [search]` |
| Input lag | Debounce sur l'input | Debounce sur la propagation, pas l'input |
| Boucle infinie | Sync bidirectionnelle sans guard | Vérifier `value !== localValue.value` |
| `watchDebounced is not defined` | VueUse pas importé | Ajouter `@vueuse/core` ou relancer Nuxt |

---

## Pattern avancé : Debounce vs Throttle

```typescript
// DEBOUNCE : attend que l'utilisateur arrête
// Bon pour : recherche, autocomplétion, resize window
watchDebounced(search, fetch, { debounce: 300 })
// Si tape "abc" rapidement, fetch appelé UNE fois avec "abc"

// THROTTLE : exécute au max une fois par intervalle
// Bon pour : scroll, drag, animations
watchThrottled(scroll, handleScroll, { throttle: 100 })
// Si scroll pendant 1s, handleScroll appelé ~10 fois (toutes les 100ms)
```

### Visualisation

```
Debounce 300ms (recherche) :
|--a--|--b--|--c--|-----------|FETCH("abc")
      ↑     ↑     ↑           ↑
    type  type  type      300ms after last

Throttle 100ms (scroll) :
|--a--|--b--|--c--|--d--|--e--|--f--|
      ↑           ↑           ↑
   CALL        CALL        CALL
   (100ms)    (100ms)     (100ms)
```

---

## Pattern : Recherche optimisée avec cache

Pour éviter de re-fetcher les mêmes recherches :

```typescript
// Option 1 : Apollo cache (automatique)
// Si la même query avec les mêmes variables est exécutée,
// Apollo retourne le cache sans fetch réseau.

// Option 2 : Cache manuel
const searchCache = new Map<string, Voie[]>()

const { data } = await useAsyncData(
  'searchVoies',
  async () => {
    const key = search.value

    // Retourner du cache si disponible
    if (searchCache.has(key)) {
      return { data: { searchVoies: { edges: searchCache.get(key) } } }
    }

    // Sinon fetch et stocker
    const result = await client.query({ ... })
    searchCache.set(key, result.data.searchVoies.edges)
    return result
  },
  { watch: [search] }
)
```

---

## Prochaine étape

→ [14-dynamic-route.md](./14-dynamic-route.md) : Page dynamique /communes/[id]
