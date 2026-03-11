# Step 11 : Configurer Apollo dans Nuxt

> **Commit** : `step-11-apollo-setup`
> **Durée** : ~20 min
> **Prérequis** : Step 10 complété, API qui tourne

---

## Objectif

Connecter le front Nuxt à l'API GraphQL avec Apollo Client.

À la fin de ce step :
- Apollo Client est configuré dans Nuxt
- Le front peut communiquer avec l'API
- Tu comprends la différence avec la config Apollo dans Next.js

---

## Pourquoi Apollo Client ?

### Les alternatives pour consommer GraphQL

| Client | Avantages | Inconvénients |
|--------|-----------|---------------|
| **Fetch natif** | Zéro dépendance | Pas de cache, gestion manuelle |
| **urql** | Léger, extensible | Moins de plugins |
| **graphql-request** | Ultra simple | Pas de cache |
| **Apollo Client** | Cache normalisé, devtools, écosystème | Plus lourd |
| **TanStack Query + graphql-request** | Excellent cache, familier React Query | Config manuelle |

### Pourquoi choisir Apollo

Pour notre formation :
1. **Cache normalisé** : Les données sont stockées par ID, pas par query
2. **Devtools** : Extension Chrome pour débugger
3. **Module Nuxt officiel** : `@nuxtjs/apollo`
4. **SSR natif** : Gère le rendu serveur automatiquement

---

## Apollo dans Next.js vs Nuxt

### Next.js (Pages Router)

```tsx
// pages/_app.tsx
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client'

const client = new ApolloClient({
  uri: 'http://localhost:4000/graphql',
  cache: new InMemoryCache(),
})

export default function App({ Component, pageProps }) {
  return (
    <ApolloProvider client={client}>
      <Component {...pageProps} />
    </ApolloProvider>
  )
}
```

**Points d'attention Next.js :**
- Provider wrapper manuel
- Gestion SSR compliquée (getServerSideProps + cache transfer)
- Import explicite de chaque hook

### Nuxt

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/apollo'],
  apollo: {
    clients: {
      default: {
        httpEndpoint: 'http://localhost:4000/graphql',
      },
    },
  },
})
```

**Avantages Nuxt :**
- Configuration déclarative
- SSR géré automatiquement
- Auto-import des composables (`useQuery`, `useMutation`)
- Pas de wrapper dans les composants

### Tableau comparatif

| Aspect | Next.js | Nuxt |
|--------|---------|------|
| Configuration | `_app.tsx` + Provider | `nuxt.config.ts` |
| Import hooks | Manuel | Auto-import |
| SSR | `getServerSideProps` + cache hydration | Automatique |
| Accès au client | `useApolloClient()` | `useApollo()` |
| Multiple clients | Config custom | `clients: { auth: {...} }` |

---

## Les fichiers à modifier

### 1. Mettre à jour `apps/web/package.json`

Ajouter le module Apollo :

```json
{
  "dependencies": {
    "@nuxtjs/apollo": "^5.0.0"
  }
}
```

### 2. Mettre à jour `apps/web/nuxt.config.ts`

```typescript
export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    '@nuxtjs/apollo',
  ],

  future: {
    compatibilityVersion: 4,
  },

  compatibilityDate: '2024-11-01',

  apollo: {
    clients: {
      default: {
        httpEndpoint: process.env.NUXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql',
        httpLinkOptions: {
          credentials: 'same-origin',
        },
        connectToDevTools: process.env.NODE_ENV === 'development',
      },
    },
    autoImports: true,
  },

  runtimeConfig: {
    public: {
      graphqlUrl: process.env.NUXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql',
    },
  },
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

### 2. Vérifier les auto-imports

Après le build initial :

```bash
cat apps/web/.nuxt/imports.d.ts | grep -i apollo
```

Tu dois voir :
```typescript
const useApollo: typeof import('@nuxtjs/apollo')['useApollo']
const useAsyncQuery: typeof import('@nuxtjs/apollo')['useAsyncQuery']
```

### 3. Accéder à l'app

Ouvre `http://localhost:3000`. La page doit s'afficher sans erreur.

---

## Les composables disponibles

Le module `@nuxtjs/apollo` auto-importe ces composables :

| Composable | Usage | Équivalent React |
|------------|-------|------------------|
| `useApollo()` | Accès direct au client | `useApolloClient()` |
| `useAsyncQuery()` | Query avec SSR (recommandé) | N/A (spécifique Nuxt) |
| `useLazyAsyncQuery()` | Query lazy avec SSR | N/A |
| `useQuery()` | Query classique Apollo | `useQuery()` |
| `useMutation()` | Mutations | `useMutation()` |

### Quelle méthode utiliser ?

```typescript
// RECOMMANDÉ pour la plupart des cas
const { data, pending, error } = await useAsyncQuery(MY_QUERY)

// Pour les queries déclenchées par l'utilisateur
const { data, pending, execute } = await useLazyAsyncQuery(SEARCH_QUERY)

// Pour les cas simples, attention au SSR
const { result, loading } = useQuery(MY_QUERY)
```

---

## Installer les Apollo DevTools

Pour débugger efficacement :

1. Installe l'extension Chrome : [Apollo Client Devtools](https://chrome.google.com/webstore/detail/apollo-client-devtools/jdkknkkbebbapilgoeccciglkfbmbnfm)

2. Vérifie que `connectToDevTools: true` est dans la config

3. Ouvre les DevTools Chrome > onglet "Apollo"

---

## Prochaine étape

Apollo est configuré. Faisons notre première vraie query !

→ [12-first-query.md](./12-first-query.md) : Afficher les départements avec useAsyncQuery
