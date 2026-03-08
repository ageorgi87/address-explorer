# Step 13 : Première query avec useAsyncData

> **Commit** : `step-13-first-query`
> **Durée** : ~40 min
> **Prérequis** : Step 12 complété, API qui tourne

---

## Objectif

Afficher la liste des départements depuis l'API GraphQL.

À la fin de ce step :
- La page d'accueil affiche les données de l'API
- Tu comprends la différence entre `useAsyncData` et `getServerSideProps`
- Le SSR fonctionne (données pré-rendues dans le HTML)

---

## Pourquoi useAsyncData ?

### Le problème du double fetch

Sans précaution, les données sont fetchées deux fois :

```
1. SSR (serveur)    →  fetch() → données → HTML généré
2. Hydration (client) →  fetch() → données → comparaison
```

C'est du gaspillage : les données sont déjà dans le HTML !

### La solution Nuxt : useAsyncData

```typescript
const { data } = await useAsyncData('key', () => fetch('/api'))
```

Ce que fait `useAsyncData` :
1. **Serveur** : Exécute le fetch, stocke le résultat dans `__NUXT__.payload`
2. **Client** : Lit `__NUXT__.payload`, ne re-fetch PAS
3. **Navigation** : Re-fetch si besoin (route change)

---

## getServerSideProps vs useAsyncData

### Next.js Pages Router

```tsx
// pages/index.tsx
export async function getServerSideProps() {
  const data = await fetch('http://api/departements').then(r => r.json())
  return { props: { data } }
}

export default function Page({ data }) {
  return <ul>{data.map(d => <li key={d.code}>{d.nom}</li>)}</ul>
}
```

**Caractéristiques :**
- Fonction séparée du composant
- Props passées au composant
- Uniquement dans `/pages`
- Re-fetch à chaque navigation

### Nuxt

```vue
<script setup>
const { data } = await useAsyncData('departements', () =>
  $fetch('http://api/departements')
)
</script>

<template>
  <ul>
    <li v-for="d in data" :key="d.code">{{ d.nom }}</li>
  </ul>
</template>
```

**Caractéristiques :**
- Dans le `<script setup>` du composant
- `data` est une ref réactive
- Fonctionne dans pages ET composants
- Cache intelligent (pas de re-fetch si données fraîches)

### Tableau comparatif détaillé

| Aspect | `getServerSideProps` | `useAsyncData` |
|--------|---------------------|----------------|
| Emplacement | Fonction exportée séparée | Dans le composant |
| Retour | `{ props: {...} }` | `{ data, pending, error }` |
| Type de données | Plain object | Ref réactive |
| Utilisable dans | Pages uniquement | Pages + composants |
| Re-fetch | À chaque navigation | Cache intelligent |
| Watch | Impossible | `watch: [ref]` |
| Error handling | try/catch + return | `.error` réactif |
| Loading state | Custom (`loading: true` dans props) | `.pending` intégré |

---

## Le fichier à modifier

### `apps/web/app/pages/index.vue`

```vue
<script setup lang="ts">
/**
 * Page d'accueil : Liste des départements
 *
 * Démontre :
 * - useAsyncData avec Apollo
 * - Gestion des états (pending, error)
 * - Template Vue avec v-for, v-if
 * - Computed pour transformer les données
 */

// ============================================================
// QUERY GRAPHQL
// ============================================================
// gql est auto-importé par @nuxtjs/apollo
// /* GraphQL */ est un tag pour l'autocomplétion VSCode
// ============================================================

const DEPARTEMENTS_QUERY = gql`
  query Departements {
    departements {
      code
      nom
      displayName
      communeCount
      communes {
        id
        nom
        codePostal
      }
    }
  }
`

// ============================================================
// FETCH DES DONNÉES
// ============================================================
// useAsyncData = équivalent de getServerSideProps
//
// Arguments :
// 1. 'departements' - clé unique pour le cache
// 2. async function - le fetch à effectuer
//
// Retour :
// - data : les données (ref réactive)
// - pending : true pendant le chargement
// - error : erreur éventuelle
// - refresh : fonction pour re-fetcher
// ============================================================

const { data, pending, error, refresh } = await useAsyncData(
  'departements',
  async () => {
    // Récupérer le client Apollo
    const { resolveClient } = useApollo()
    const client = resolveClient()

    // Exécuter la query
    const result = await client.query({
      query: DEPARTEMENTS_QUERY,
      // fetchPolicy : d'où viennent les données ?
      // 'cache-first' : cache Apollo d'abord, puis réseau si absent
      // 'network-only' : toujours réseau (pas de cache)
      // 'cache-only' : uniquement cache (erreur si absent)
      fetchPolicy: 'cache-first',
    })

    return result.data
  }
)

// ============================================================
// COMPUTED
// ============================================================
// computed = useMemo de React, mais SANS tableau de dépendances
// Vue track automatiquement les dépendances
// ============================================================

// Extraire les départements de la réponse
// data.value car data est une ref (wrapper réactif)
const departements = computed(() => data.value?.departements ?? [])

// Nombre total de communes (somme)
const totalCommunes = computed(() =>
  departements.value.reduce((sum, d) => sum + (d.communeCount ?? 0), 0)
)

// Stats formatées
const stats = computed(() => ({
  departements: departements.value.length,
  communes: totalCommunes.value,
}))
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- ============================================================
         HEADER
         ============================================================ -->
    <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 py-6">
        <h1 class="text-3xl font-bold text-gray-900">
          Explorateur d'adresses
        </h1>
        <p class="mt-1 text-gray-600">
          26 millions d'adresses françaises
        </p>
      </div>
    </header>

    <!-- ============================================================
         CONTENU PRINCIPAL
         ============================================================ -->
    <main class="max-w-7xl mx-auto px-4 py-8">

      <!-- ÉTAT : CHARGEMENT -->
      <!-- v-if = rendu conditionnel (équivalent {pending && ...} en React) -->
      <div v-if="pending" class="space-y-4">
        <div class="animate-pulse h-8 bg-gray-200 rounded w-1/4"></div>
        <div class="animate-pulse h-32 bg-gray-200 rounded"></div>
        <div class="animate-pulse h-32 bg-gray-200 rounded"></div>
      </div>

      <!-- ÉTAT : ERREUR -->
      <div
        v-else-if="error"
        class="bg-red-50 border border-red-200 rounded-lg p-6"
      >
        <h2 class="text-lg font-semibold text-red-800">
          Erreur de chargement
        </h2>
        <p class="mt-2 text-red-700">
          {{ error.message }}
        </p>
        <button
          @click="refresh()"
          class="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Réessayer
        </button>
      </div>

      <!-- ÉTAT : DONNÉES CHARGÉES -->
      <div v-else>
        <!-- Stats -->
        <div class="mb-8 grid grid-cols-2 gap-4 max-w-md">
          <div class="bg-white rounded-lg shadow p-4">
            <div class="text-3xl font-bold text-blue-600">
              {{ stats.departements }}
            </div>
            <div class="text-gray-600">Département(s)</div>
          </div>
          <div class="bg-white rounded-lg shadow p-4">
            <div class="text-3xl font-bold text-green-600">
              {{ stats.communes }}
            </div>
            <div class="text-gray-600">Communes</div>
          </div>
        </div>

        <!-- Liste des départements -->
        <!-- v-for = équivalent de .map() en React -->
        <!-- :key = équivalent de key={} en React -->
        <div class="space-y-6">
          <div
            v-for="dept in departements"
            :key="dept.code"
            class="bg-white rounded-lg shadow-md overflow-hidden"
          >
            <!-- En-tête du département -->
            <div class="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
              <div>
                <span class="text-lg font-bold text-gray-900">
                  {{ dept.code }}
                </span>
                <span class="ml-2 text-gray-700">
                  {{ dept.nom }}
                </span>
              </div>
              <span class="text-sm text-gray-500">
                {{ dept.communeCount }} commune(s)
              </span>
            </div>

            <!-- Liste des communes (collapsed par défaut) -->
            <!-- <details> = élément HTML natif pour accordion -->
            <details class="px-6 py-4">
              <summary class="cursor-pointer text-blue-600 hover:text-blue-800">
                Voir les communes
              </summary>

              <ul class="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                <!-- Limite à 10 pour ne pas surcharger -->
                <li
                  v-for="commune in dept.communes.slice(0, 10)"
                  :key="commune.id"
                  class="text-sm text-gray-600 hover:text-gray-900"
                >
                  <!-- NuxtLink = Link de Next.js -->
                  <NuxtLink
                    :to="`/communes/${commune.id}`"
                    class="hover:underline"
                  >
                    {{ commune.nom }}
                    <span class="text-gray-400">({{ commune.codePostal }})</span>
                  </NuxtLink>
                </li>

                <!-- Message si plus de 10 communes -->
                <li
                  v-if="dept.communes.length > 10"
                  class="text-sm text-gray-400 italic"
                >
                  ... et {{ dept.communes.length - 10 }} autres
                </li>
              </ul>
            </details>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
```

---

## Commandes à exécuter

```bash
# Terminal 1 : API (si pas déjà lancée)
npm run dev:api

# Terminal 2 : Front
npm run dev:web
```

---

## Checkpoint ✓

### 1. La page affiche les données

Ouvre `http://localhost:3000`.

Tu dois voir :
- Le header "Explorateur d'adresses"
- Les stats (1 département, ~21 communes)
- La carte du département 75 avec ses communes

### 2. Le SSR fonctionne

Vérifie que les données sont pré-rendues :

1. Ouvre les DevTools > Network
2. Rafraîchis la page (F5)
3. Clique sur la requête du document HTML
4. Regarde le contenu

Tu dois voir les données **dans le HTML**, pas un loader.

### 3. Pas de double fetch

1. Ouvre les DevTools > Network
2. Filtre par "graphql"
3. Rafraîchis la page

Tu dois voir **une seule requête** GraphQL (SSR), pas deux.

---

## Comprendre le code en détail

### La clé de cache unique

```typescript
await useAsyncData('departements', async () => { ... })
//                  ↑ clé unique
```

Cette clé :
- Identifie les données dans le cache Nuxt
- Permet `refreshNuxtData('departements')` pour re-fetch
- Doit être unique par requête différente

### `data.value` : Pourquoi `.value` ?

```typescript
const departements = computed(() => data.value?.departements ?? [])
//                                      ↑ .value car ref
```

En Vue, une `ref` est un wrapper réactif :
```typescript
const data = ref({ departements: [...] })
// data = { value: { departements: [...] } }
// data.value = { departements: [...] }
```

Dans le template, pas besoin de `.value` (auto-unwrap).

### `v-if` / `v-else-if` / `v-else`

```vue
<div v-if="pending">Chargement...</div>
<div v-else-if="error">Erreur...</div>
<div v-else>Données...</div>
```

Équivalent React :
```tsx
{pending && <div>Chargement...</div>}
{error && <div>Erreur...</div>}
{!pending && !error && <div>Données...</div>}
```

La syntaxe Vue est plus lisible pour les branches multiples.

### `v-for` avec `:key`

```vue
<li v-for="commune in communes" :key="commune.id">
  {{ commune.nom }}
</li>
```

Équivalent React :
```tsx
{communes.map(commune => (
  <li key={commune.id}>{commune.nom}</li>
))}
```

`:key` (avec les deux-points) est un raccourci pour `v-bind:key`.

### `@click` : Gestion des événements

```vue
<button @click="refresh()">Réessayer</button>
```

`@click` est un raccourci pour `v-on:click`.

Équivalent React :
```tsx
<button onClick={() => refresh()}>Réessayer</button>
```

### `computed` vs `useMemo`

```typescript
// Vue : computed (pas de deps)
const stats = computed(() => ({
  departements: departements.value.length,
  communes: totalCommunes.value,
}))

// React : useMemo (deps explicites)
const stats = useMemo(() => ({
  departements: departements.length,
  communes: totalCommunes,
}), [departements, totalCommunes])
```

Vue track automatiquement les dépendances grâce à son système de réactivité. Pas besoin de les lister.

---

## NuxtLink : La navigation

```vue
<NuxtLink :to="`/communes/${commune.id}`">
  {{ commune.nom }}
</NuxtLink>
```

| `<NuxtLink>` (Nuxt) | `<Link>` (Next.js) |
|---------------------|-------------------|
| `:to` (dynamique) | `href` |
| `to` (statique) | `href` |
| Auto-prefetch | `prefetch` prop |
| Client-side nav | Client-side nav |

La page `/communes/[id]` n'existe pas encore, on la créera au Step 15.

---

## Pièges courants

| Problème | Cause | Solution |
|----------|-------|----------|
| `data` est `null` | API pas lancée | Vérifier le terminal API |
| Données pas réactives | Oublié `.value` | `data.value?.departements` |
| `gql is not defined` | Auto-import manquant | Relancer `npm run dev:web` |
| Double fetch visible | `await` manquant | `await useAsyncData(...)` |
| Erreur CORS | API bloque | Yoga autorise * par défaut |
| Types incorrects | TypeScript | Ajouter les types si besoin |

---

## Amélioration : Ajouter les types

Pour un meilleur typage :

```typescript
// types/graphql.ts
interface Commune {
  id: string
  nom: string
  codePostal: string
}

interface Departement {
  code: string
  nom: string
  displayName: string
  communeCount: number
  communes: Commune[]
}

interface DepartementsQueryResult {
  departements: Departement[]
}

// Dans le composant
const { data } = await useAsyncData<DepartementsQueryResult>('departements', ...)
```

On le fera proprement avec GraphQL Code Generator plus tard.

---

## Ce qu'on a appris

| Concept React | Équivalent Vue | Notes |
|---------------|----------------|-------|
| `useState` | `ref()` | `.value` en JS |
| `useMemo` | `computed()` | Pas de deps |
| `{condition && ...}` | `v-if` | Plus lisible |
| `.map()` | `v-for` | Plus lisible |
| `onClick` | `@click` | Syntaxe différente |
| `<Link>` | `<NuxtLink>` | Même concept |
| `getServerSideProps` | `useAsyncData` | Plus flexible |

---

## Prochaine étape

On sait afficher des données. Ajoutons une recherche interactive !

→ [14-search.md](./14-search.md) : Recherche avec v-model et debounce
