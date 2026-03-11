# Step 12 : Première query avec useAsyncQuery

> **Commit** : `step-12-first-query`
> **Durée** : ~30 min
> **Prérequis** : Step 11 complété, API qui tourne

---

## Objectif

Afficher la liste des départements depuis l'API GraphQL.

À la fin de ce step :
- La page d'accueil affiche les données de l'API
- Tu comprends comment utiliser `useAsyncQuery`
- Le SSR fonctionne (données pré-rendues dans le HTML)

---

## Le fichier à modifier

### `apps/web/app/pages/index.vue`

```vue
<script setup lang="ts">
// Query GraphQL
const DEPARTEMENTS_QUERY = gql`
  query Departements {
    departements {
      code
      nom
      displayName
      communeCount
    }
  }
`

// Fetch des données avec SSR
const { data, pending, error } = await useAsyncQuery(DEPARTEMENTS_QUERY)

// Extraire les départements de la réponse
const departements = computed(() => data.value?.departements ?? [])

// Stats
const stats = computed(() => ({
  departements: departements.value.length,
  communes: departements.value.reduce((sum, d) => sum + (d.communeCount ?? 0), 0),
}))
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 py-6">
        <h1 class="text-3xl font-bold text-gray-900">
          Explorateur d'adresses
        </h1>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-8">
      <!-- Chargement -->
      <div v-if="pending" class="animate-pulse h-32 bg-gray-200 rounded"></div>

      <!-- Erreur -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6">
        <p class="text-red-700">{{ error.message }}</p>
      </div>

      <!-- Données -->
      <div v-else>
        <!-- Stats -->
        <div class="mb-8 grid grid-cols-2 gap-4 max-w-md">
          <div class="bg-white rounded-lg shadow p-4">
            <div class="text-3xl font-bold text-blue-600">{{ stats.departements }}</div>
            <div class="text-gray-600">Départements</div>
          </div>
          <div class="bg-white rounded-lg shadow p-4">
            <div class="text-3xl font-bold text-green-600">{{ stats.communes }}</div>
            <div class="text-gray-600">Communes</div>
          </div>
        </div>

        <!-- Liste des départements -->
        <div class="space-y-4">
          <div
            v-for="dept in departements"
            :key="dept.code"
            class="bg-white rounded-lg shadow p-4"
          >
            <span class="font-bold">{{ dept.code }}</span>
            <span class="ml-2">{{ dept.nom }}</span>
            <span class="text-gray-500 ml-2">({{ dept.communeCount }} communes)</span>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
```

---

## Checkpoint

### 1. La page affiche les données

Ouvre `http://localhost:3000`. Tu dois voir :
- Les stats (nombre de départements et communes)
- La liste des départements

### 2. Le SSR fonctionne

1. Ouvre les DevTools > View Source (ou Ctrl+U)
2. Cherche "Paris" dans le HTML

Les données doivent être présentes dans le HTML source, pas chargées en JavaScript.

---

## Comprendre le code

### `useAsyncQuery` vs `useAsyncData`

```typescript
// useAsyncQuery : spécifique Apollo, gère tout
const { data, pending, error } = await useAsyncQuery(QUERY)

// useAsyncData : générique Nuxt, plus de contrôle
const { data } = await useAsyncData('key', async () => {
  const { resolveClient } = useApollo()
  return resolveClient().query({ query: QUERY })
})
```

`useAsyncQuery` est plus simple pour les cas courants.

### `computed` : Valeurs dérivées

```typescript
const departements = computed(() => data.value?.departements ?? [])
```

`computed` recalcule automatiquement quand `data` change. Équivalent de `useMemo` en React, mais sans liste de dépendances.

### `v-if` / `v-else-if` / `v-else`

```vue
<div v-if="pending">Chargement...</div>
<div v-else-if="error">Erreur</div>
<div v-else>Données</div>
```

Rendu conditionnel. Plus lisible que les ternaires React.

### `v-for` avec `:key`

```vue
<div v-for="dept in departements" :key="dept.code">
  {{ dept.nom }}
</div>
```

Équivalent de `.map()` en React. `:key` est obligatoire.

---

## Prochaine étape

On sait afficher des données. Ajoutons une recherche interactive !

→ [13-search.md](./13-search.md) : Recherche avec v-model et debounce
