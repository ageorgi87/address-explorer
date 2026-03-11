# Step 11 : Configurer Apollo Client dans Nuxt

> **Commit** : `step-11-apollo-client`
> **Prérequis** : Step 10 complété, API qui tourne

---

## Objectif

Connecter le front Nuxt à l'API GraphQL avec `@nuxtjs/apollo`.

À la fin de ce step :
- Le client Apollo est configuré dans Nuxt
- Le front peut communiquer avec l'API
- Tu comprends la structure des queries

---

## Pourquoi Apollo ?

### Les alternatives pour consommer GraphQL

| Client | Avantages | Inconvénients |
|--------|-----------|---------------|
| **Fetch natif** | Zéro dépendance | Pas de cache, gestion manuelle |
| **Apollo Client** | Cache normalisé, devtools, écosystème | Plus lourd |
| **graphql-request** | Ultra simple | Pas de cache |
| **urql** | Léger, extensible | Moins de plugins |

### Pourquoi choisir Apollo

Pour notre projet :
1. **Écosystème mature** : Documentation, devtools, communauté
2. **Cache intelligent** : Évite les requêtes redondantes
3. **SSR natif** : Intégration Nuxt via `@nuxtjs/apollo`
4. **Standard de l'industrie** : Compétence transférable

---

## Les fichiers à modifier

### 1. Installer les dépendances

```bash
cd apps/web
npm install @nuxtjs/apollo@next @vueuse/nuxt
```

### 2. Mettre à jour `apps/web/nuxt.config.ts`

```typescript
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',

  modules: [
    '@nuxt/ui',
    '@nuxtjs/apollo',
    '@vueuse/nuxt',
  ],

  apollo: {
    clients: {
      default: {
        httpEndpoint: process.env.NUXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql',
      },
    },
  },

  ssr: true,
  devtools: { enabled: true },

  typescript: {
    strict: true,
  },
})
```

---

## Structure des queries

On organise les queries dans un dossier dédié, un fichier par query :

```
apps/web/app/
├── queries/
│   ├── departements.ts
│   └── searchCommunes.ts
├── pages/
│   └── index.vue
└── components/
```

### Exemple de fichier query

```typescript
// queries/departements.ts
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

**Points clés :**
- Les types sont définis avec la query
- On exporte l'interface `Data` pour typer `useAsyncQuery`
- Convention de nommage : `QUERY_NAME` en SCREAMING_CASE

---

## Les composables Apollo

| Composable | Usage |
|------------|-------|
| `useAsyncQuery()` | Query avec SSR (recommandé pour les données initiales) |
| `useQuery()` | Query réactive sans SSR |
| `useLazyAsyncQuery()` | Query lazy, déclenchée manuellement |
| `useMutation()` | Mutations |
| `useApollo()` | Accès direct au client Apollo |

### Quelle méthode utiliser ?

```typescript
import { DEPARTEMENTS_QUERY, type DepartementsData } from '../queries/departements'

// RECOMMANDÉ pour les données initiales (SSR)
const { data, pending, error } = await useAsyncQuery<DepartementsData>(DEPARTEMENTS_QUERY)

// Pour les queries déclenchées par l'utilisateur
const { clients } = useApollo()
const { data } = await clients.default.query({
  query: SEARCH_QUERY,
  variables: { search: 'paris' }
})
```

---

## Commandes à exécuter

```bash
# À la racine du monorepo
npm install

# Terminal 1 : Lancer l'API
npm run dev:api

# Terminal 2 : Lancer le front
npm run dev:web
```

---

## Checkpoint

### 1. Pas d'erreur au démarrage

La console de `npm run dev:web` ne doit pas montrer d'erreur liée à Apollo.

### 2. Accéder à l'app

Ouvre `http://localhost:3000`. La page doit s'afficher sans erreur.

---

## Prochaine étape

Le client Apollo est configuré. Faisons notre première vraie query !

→ [12-apollo-setup.md](./12-apollo-setup.md) : Afficher les départements avec useAsyncQuery
