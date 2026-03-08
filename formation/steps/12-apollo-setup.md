# Step 12 : Configurer Apollo dans Nuxt

> **Commit** : `step-12-apollo-setup`
> **Durée** : ~20 min
> **Prérequis** : Step 11 complété, API qui tourne

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
  "name": "web",
  "private": true,
  "scripts": {
    "dev": "nuxt dev",
    "build": "nuxt build",
    "preview": "nuxt preview"
  },
  "dependencies": {
    "@nuxt/ui": "^3.0.0",
    "@nuxtjs/apollo": "^5.0.0",
    "nuxt": "^3.15.0"
  }
}
```

### 2. Mettre à jour `apps/web/nuxt.config.ts`

```typescript
/**
 * Configuration Nuxt
 *
 * - @nuxt/ui : Composants UI (Nuxt UI v3)
 * - @nuxtjs/apollo : Client GraphQL
 */

export default defineNuxtConfig({
  // ============================================================
  // MODULES
  // ============================================================
  modules: [
    '@nuxt/ui',
    '@nuxtjs/apollo',
  ],

  // ============================================================
  // NUXT 4 COMPATIBILITY
  // ============================================================
  future: {
    compatibilityVersion: 4,
  },

  compatibilityDate: '2024-11-01',

  // ============================================================
  // APOLLO CLIENT
  // ============================================================
  // Configuration du client GraphQL.
  // 'default' est le client principal.
  // On peut avoir plusieurs clients pour différentes APIs.
  // ============================================================

  apollo: {
    clients: {
      default: {
        // URL de l'API GraphQL
        // En dev : localhost
        // En prod : variable d'environnement
        httpEndpoint: process.env.NUXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql',

        // Options supplémentaires
        httpLinkOptions: {
          // Credentials pour les cookies (si authentification)
          credentials: 'same-origin',
        },

        // Activer les Devtools en dev
        connectToDevTools: process.env.NODE_ENV === 'development',
      },
    },

    // Auto-importer gql tag
    autoImports: true,
  },

  // ============================================================
  // RUNTIME CONFIG
  // ============================================================
  // Variables accessibles côté client et serveur
  // ============================================================

  runtimeConfig: {
    // Secrets (serveur uniquement)
    // apiSecret: '',

    // Variables publiques (client + serveur)
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

## Checkpoint ✓

### 1. Pas d'erreur au démarrage

La console de `npm run dev:web` ne doit pas montrer d'erreur liée à Apollo.

### 2. Vérifier les auto-imports

Après le build initial, vérifie que les types sont générés :

```bash
cat apps/web/.nuxt/imports.d.ts | grep -i apollo
```

Tu dois voir :
```typescript
const useApollo: typeof import('@nuxtjs/apollo')['useApollo']
const useAsyncQuery: typeof import('@nuxtjs/apollo')['useAsyncQuery']
const useLazyAsyncQuery: typeof import('@nuxtjs/apollo')['useLazyAsyncQuery']
```

### 3. Accéder à l'app

Ouvre `http://localhost:3000`.

La page doit s'afficher sans erreur (même si elle est vide pour l'instant).

---

## Comprendre la configuration

### `httpEndpoint`

```typescript
httpEndpoint: 'http://localhost:4000/graphql'
```

C'est l'URL de ton serveur GraphQL Yoga.

En production, utilise une variable d'environnement :
```bash
# .env
NUXT_PUBLIC_GRAPHQL_URL=https://api.monsite.com/graphql
```

### `httpLinkOptions`

```typescript
httpLinkOptions: {
  credentials: 'same-origin',  // Envoie les cookies pour l'auth
  // credentials: 'include',   // Pour cross-origin avec cookies
}
```

### Plusieurs clients (avancé)

Si tu as plusieurs APIs GraphQL :

```typescript
apollo: {
  clients: {
    default: {
      httpEndpoint: 'http://localhost:4000/graphql',
    },
    auth: {
      httpEndpoint: 'http://localhost:4001/auth-graphql',
    },
    cms: {
      httpEndpoint: 'https://cms.example.com/graphql',
    },
  },
}
```

Usage :
```typescript
const { resolveClient } = useApollo()
const defaultClient = resolveClient()        // Client 'default'
const authClient = resolveClient('auth')     // Client 'auth'
```

---

## Les composables disponibles

Le module `@nuxtjs/apollo` auto-importe ces composables :

| Composable | Usage | Équivalent React |
|------------|-------|------------------|
| `useApollo()` | Accès direct au client | `useApolloClient()` |
| `useAsyncQuery()` | Query avec SSR (recommandé) | N/A (spécifique Nuxt) |
| `useLazyAsyncQuery()` | Query lazy avec SSR | N/A |
| `useQuery()` | Query classique Apollo | `useQuery()` |
| `useLazyQuery()` | Query déclenchée manuellement | `useLazyQuery()` |
| `useMutation()` | Mutations | `useMutation()` |
| `useSubscription()` | Subscriptions temps réel | `useSubscription()` |

### Quelle méthode utiliser ?

```typescript
// ✅ RECOMMANDÉ pour la plupart des cas
// Utilise useAsyncData sous le capot, évite le double fetch SSR
const { data, pending, error } = await useAsyncQuery(MY_QUERY)

// ✅ Pour les queries déclenchées par l'utilisateur
// Ex: recherche quand l'utilisateur tape
const { data, pending, execute } = await useLazyAsyncQuery(SEARCH_QUERY)

// ⚠️ Pour les cas simples, mais attention au SSR
// Peut causer un double fetch si mal utilisé
const { result, loading } = useQuery(MY_QUERY)
```

---

## Pièges courants

| Problème | Cause | Solution |
|----------|-------|----------|
| `Cannot connect to localhost:4000` | API pas lancée | `npm run dev:api` dans un autre terminal |
| `Module '@nuxtjs/apollo' not found` | Package pas installé | `npm install` à la racine |
| Erreur CORS | API bloque le front | Yoga accepte tout par défaut, vérifier config |
| `gql is not defined` | Auto-import pas actif | Relancer `npm run dev:web` |
| Types non générés | Build pas terminé | Attendre le warm-up Nuxt |

---

## Installer les Apollo DevTools

Pour débugger efficacement :

1. Installe l'extension Chrome : [Apollo Client Devtools](https://chrome.google.com/webstore/detail/apollo-client-devtools/jdkknkkbebbapilgoeccciglkfbmbnfm)

2. Vérifie que `connectToDevTools: true` est dans la config (c'est le cas en dev)

3. Ouvre les DevTools Chrome > onglet "Apollo"

Tu pourras :
- Voir toutes les queries exécutées
- Inspecter le cache
- Tester des queries manuellement

---

## Structure du cache Apollo

Apollo normalise les données par ID :

```javascript
// Query 1 : departements
{
  "Departement:75": { code: "75", nom: "Paris" },
  "Commune:75101": { id: "75101", nom: "Paris 1er" },
  "Commune:75102": { id: "75102", nom: "Paris 2ème" },
}

// Query 2 : commune(id: "75101")
// Pas de nouvelle requête ! Les données sont déjà dans le cache.
```

C'est pourquoi GraphQL recommande toujours de demander les IDs :
```graphql
query {
  departements {
    code    # ← Sert d'ID pour le cache
    nom
    communes {
      id    # ← Sert d'ID pour le cache
      nom
    }
  }
}
```

---

## Prochaine étape

Apollo est configuré. Faisons notre première vraie query !

→ [13-first-query.md](./13-first-query.md) : Afficher les départements avec useAsyncData
