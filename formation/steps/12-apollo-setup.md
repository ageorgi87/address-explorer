# Step 12 : Première query avec useAsyncQuery

> **Commit** : `step-12-first-query`
> **Prérequis** : Step 11 complété, API qui tourne

---

## Objectif

Afficher la liste des départements depuis l'API GraphQL.

À la fin de ce step :
- La page d'accueil affiche les données de l'API
- Tu comprends comment utiliser `useAsyncQuery`
- Le SSR fonctionne (données pré-rendues dans le HTML)

---

## Les fichiers à créer/modifier

### 1. Créer la query `apps/web/app/queries/departements.ts`

```typescript
import { gql } from 'graphql-tag'

export interface Departement {
  code: string
  nom: string
  communeCount: number
}

export interface DepartementsData {
  departements: Departement[]
}

export const DEPARTEMENTS_QUERY = gql`
  query Departements {
    departements {
      code
      nom
      communeCount
    }
  }
`
```

### 2. Modifier `apps/web/app/pages/index.vue`

```vue
<script setup lang="ts">
import { DEPARTEMENTS_QUERY, type DepartementsData } from '../queries/departements'

const { data, pending, error } = await useAsyncQuery<DepartementsData>(DEPARTEMENTS_QUERY)

const departements = computed(() => data.value?.departements ?? [])

const totalCommunes = computed(() =>
  departements.value.reduce((sum, dept) => sum + dept.communeCount, 0),
)

useSeoMeta({
  title: 'Explorateur d\'adresses',
  description: 'Explore les adresses françaises',
})
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
      <div v-if="pending" class="animate-pulse h-32 bg-gray-200 rounded" />

      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6">
        <p class="text-red-700">{{ error }}</p>
      </div>

      <div v-else>
        <div class="mb-8 grid grid-cols-2 gap-4 max-w-md">
          <div class="bg-white rounded-lg shadow p-4">
            <div class="text-3xl font-bold text-blue-600">{{ departements.length }}</div>
            <div class="text-gray-600">Départements</div>
          </div>
          <div class="bg-white rounded-lg shadow p-4">
            <div class="text-3xl font-bold text-green-600">{{ totalCommunes.toLocaleString() }}</div>
            <div class="text-gray-600">Communes</div>
          </div>
        </div>

        <div class="space-y-2">
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
// useAsyncQuery : spécifique à Apollo
const { data, pending, error } = await useAsyncQuery<DepartementsData>(DEPARTEMENTS_QUERY)

// useAsyncData : générique Nuxt, plus de contrôle
const { data } = await useAsyncData('key', async () => {
  // fetch manuel
})
```

`useAsyncQuery` est plus simple pour les queries GraphQL.

### Typage avec le générique

```typescript
// Sans typage : data.value est de type {}
const { data } = await useAsyncQuery(DEPARTEMENTS_QUERY)

// Avec typage : data.value est de type DepartementsData
const { data } = await useAsyncQuery<DepartementsData>(DEPARTEMENTS_QUERY)
```

Le générique `<DepartementsData>` permet à TypeScript de savoir que `data.value.departements` existe.

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
