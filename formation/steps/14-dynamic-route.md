# Step 14 : Page dynamique /communes/[id]

> **Commit** : `step-14-dynamic-route`
> **Durée** : ~35 min
> **Prérequis** : Step 13 complété

---

## Objectif

Créer une page de détail pour une commune avec routing dynamique.

À la fin de ce step :
- Tu as une page `/communes/[id]` fonctionnelle
- Tu comprends `useRoute()` vs `useRouter().query`
- Tu maîtrises `useSeoMeta()` pour le SEO dynamique
- Tu sais gérer les états loading/error/not-found

---

## Routing dynamique : pourquoi c'est différent ?

### Next.js : plusieurs systèmes à gérer

```
pages/communes/[id].tsx

// Pour les données :
export async function getServerSideProps({ params }) {
  const data = await fetchCommune(params.id)
  return { props: { data } }
}

// OU avec App Router :
app/communes/[id]/page.tsx
export async function generateStaticParams() { ... }
```

**Problèmes Next.js :**
- Pages Router vs App Router : syntaxe différente
- `getServerSideProps` vs `getStaticProps` : logique différente
- Les params sont dans un objet séparé des composants

### Nuxt : tout unifié

```
pages/communes/[id].vue

// Dans le composant directement :
const route = useRoute()
const id = route.params.id

const { data } = await useAsyncData(
  `commune-${id}`,
  () => fetchCommune(id)
)
```

**Avantages Nuxt :**
- Une seule façon de faire (pas Pages vs App Router)
- Params accessibles directement dans le composant
- SSR/SSG géré automatiquement par `useAsyncData`

### Tableau comparatif

| Aspect | Next.js (Pages) | Next.js (App) | Nuxt |
|--------|-----------------|---------------|------|
| Fichier | `pages/[id].tsx` | `app/[id]/page.tsx` | `pages/[id].vue` |
| Accès params | `router.query.id` | `params.id` (prop) | `useRoute().params.id` |
| Data fetching | `getServerSideProps` | `fetch` in component | `useAsyncData` |
| SEO | `<Head>` ou `generateMetadata` | `generateMetadata` | `useSeoMeta()` |
| Catch-all | `[...slug].tsx` | `[...slug]/page.tsx` | `[...slug].vue` |

---

## Convention de nommage des fichiers

### Nuxt file-based routing

```
pages/
├── index.vue                    → /
├── about.vue                    → /about
├── communes/
│   ├── index.vue                → /communes
│   └── [id].vue                 → /communes/:id (dynamique)
├── voies/
│   └── [id]/
│       ├── index.vue            → /voies/:id
│       └── edit.vue             → /voies/:id/edit
└── [...slug].vue                → /* (catch-all)
```

### Syntaxe des segments dynamiques

| Pattern | Fichier Nuxt | Fichier Next | Exemple URL |
|---------|--------------|--------------|-------------|
| Segment simple | `[id].vue` | `[id].tsx` | `/communes/75101` |
| Segment optionnel | `[[id]].vue` | `[[id]].tsx` | `/communes` ou `/communes/75101` |
| Catch-all | `[...slug].vue` | `[...slug].tsx` | `/a/b/c/d` |
| Catch-all optionnel | `[[...slug]].vue` | `[[...slug]].tsx` | `/` ou `/a/b/c` |

---

## useRoute vs useRouter

### useRoute : lecture seule

```typescript
// Vue/Nuxt : useRoute() pour LIRE les infos de route
const route = useRoute()

// Params dynamiques de l'URL
route.params.id        // "75101" pour /communes/75101
route.params.slug      // ["a", "b"] pour /[...slug] avec /a/b

// Query string
route.query.sort       // "name" pour ?sort=name
route.query.page       // "2" pour ?page=2

// Path complet
route.path             // "/communes/75101"
route.fullPath         // "/communes/75101?sort=name"

// Name de la route (si défini)
route.name             // "communes-id"
```

### useRouter : navigation

```typescript
// Vue/Nuxt : useRouter() pour NAVIGUER
const router = useRouter()

// Navigation programmatique
router.push('/communes/75102')
router.push({ path: '/communes', query: { sort: 'name' } })
router.replace('/communes/75102')  // Pas d'historique
router.back()
router.forward()
router.go(-2)  // 2 pages en arrière
```

### Comparaison avec Next.js

```typescript
// Next.js : un seul hook pour tout
const router = useRouter()

// Lecture
router.query.id        // Params ET query combinés
router.pathname        // "/communes/[id]" (avec brackets)
router.asPath          // "/communes/75101" (résolu)

// Navigation
router.push('/communes/75102')
router.replace('/communes/75102')
router.back()
```

**Différence clé :**
- Next.js : `router.query` mélange params et query string
- Nuxt : `route.params` et `route.query` sont séparés

---

## useSeoMeta : SEO réactif

### Le problème du SEO dynamique

```html
<!-- On veut que ça soit dans le HTML côté serveur -->
<head>
  <title>Paris 1er (75001) - Explorateur</title>
  <meta name="description" content="Découvrez les 150 voies de Paris 1er" />
</head>
```

### Next.js : plusieurs approches

```tsx
// Pages Router : composant Head
import Head from 'next/head'

export default function CommunePage({ commune }) {
  return (
    <>
      <Head>
        <title>{commune.nom} ({commune.codePostal})</title>
        <meta name="description" content={`Découvrez ${commune.nom}`} />
      </Head>
      {/* ... */}
    </>
  )
}

// App Router : generateMetadata
export async function generateMetadata({ params }) {
  const commune = await fetchCommune(params.id)
  return {
    title: `${commune.nom} (${commune.codePostal})`,
    description: `Découvrez ${commune.nom}`,
  }
}
```

### Nuxt : useSeoMeta composable

```vue
<script setup>
const commune = computed(() => data.value?.commune)

// Réactif : se met à jour quand commune change
useSeoMeta({
  title: () => commune.value
    ? `${commune.value.nom} (${commune.value.codePostal})`
    : 'Chargement...',
  description: () => commune.value
    ? `Découvrez les ${commune.value.voies.length} voies de ${commune.value.nom}`
    : '',
  ogTitle: () => commune.value?.nom,
  ogImage: '/og-commune.png',
})
</script>
```

**Avantages :**
- Déclaratif et réactif
- Pas de composant wrapper
- Type-safe avec autocomplétion
- Fonctionne en SSR

---

## Les fichiers à créer

### 1. Créer `apps/web/app/pages/communes/[id].vue`

```vue
<script setup lang="ts">
/**
 * Page de détail d'une commune.
 *
 * Architecture :
 *
 * ┌───────────────────────────────────────────────┐
 * │  URL : /communes/75101                        │
 * │            ↓                                  │
 * │  useRoute().params.id → "75101"               │
 * │            ↓                                  │
 * │  useAsyncData('commune-75101', fetch)         │
 * │            ↓                                  │
 * │  data → commune (computed)                    │
 * │            ↓                                  │
 * │  ┌─────────┬─────────┬──────────┐            │
 * │  │ pending │  error  │ commune  │            │
 * │  │ Skeleton│  Error  │ Content  │            │
 * │  └─────────┴─────────┴──────────┘            │
 * └───────────────────────────────────────────────┘
 *
 * Trois états possibles :
 * 1. pending: true → Afficher skeleton
 * 2. error: Error → Afficher message d'erreur
 * 3. commune: null → Afficher "introuvable"
 * 4. commune: {...} → Afficher le contenu
 */

// ============================================================
// GRAPHQL QUERY
// ============================================================
// La query récupère la commune et ses relations.
// On demande les voies avec leurs numéros pour les stats
// et la future carte.
// ============================================================

const COMMUNE_QUERY = gql`
  query Commune($id: ID!) {
    commune(id: $id) {
      id
      nom
      codePostal
      departement {
        code
        nom
      }
      voies {
        id
        nom
        numeros {
          id
          numero
          suffixe
        }
      }
    }
  }
`

// ============================================================
// RÉCUPÉRER L'ID DE LA ROUTE
// ============================================================
// useRoute() retourne les infos de la route actuelle.
// C'est read-only, contrairement à useRouter().
//
// Equivalent Next.js :
// const router = useRouter()
// const id = router.query.id as string
//
// Différence : Nuxt sépare params et query.
// ============================================================

const route = useRoute()

// computed car params peut changer (navigation client-side)
// En Next.js pages router, c'est automatiquement mis à jour
// via le re-render, mais ici on veut une réactivité explicite.
const communeId = computed(() => route.params.id as string)

// ============================================================
// FETCH DES DONNÉES
// ============================================================
// useAsyncData avec une clé unique par commune.
// La clé inclut l'ID pour éviter les collisions de cache.
//
// Important : pas de watch ici car l'ID ne change pas
// sur cette page (navigation = nouvelle page = nouveau composant).
//
// Equivalent Next.js :
// export async function getServerSideProps({ params }) {
//   const data = await fetchCommune(params.id)
//   return { props: { data } }
// }
// ============================================================

const { data, pending, error } = await useAsyncData(
  `commune-${communeId.value}`,  // Clé unique
  async () => {
    const { resolveClient } = useApollo()
    const client = resolveClient()

    return client.query({
      query: COMMUNE_QUERY,
      variables: { id: communeId.value }
    })
  }
)

// ============================================================
// COMPUTED POUR EXTRAIRE LA COMMUNE
// ============================================================
// Computed car data.value peut être null au début,
// et on veut un accès propre dans le template.
// ============================================================

const commune = computed(() => data.value?.data?.commune)

// ============================================================
// SEO DYNAMIQUE
// ============================================================
// useSeoMeta accepte des getters (fonctions) pour la réactivité.
// Le titre sera "Paris 1er (75001)" une fois les données chargées.
//
// Ces meta sont rendues côté serveur en SSR.
// View Source montre les bonnes valeurs, pas "Chargement...".
//
// Equivalent Next.js (Pages Router) :
// <Head>
//   <title>{commune?.nom} ({commune?.codePostal})</title>
//   <meta name="description" content={...} />
// </Head>
//
// Equivalent Next.js (App Router) :
// export async function generateMetadata({ params }) {
//   const commune = await fetchCommune(params.id)
//   return { title: `${commune.nom}...` }
// }
// ============================================================

useSeoMeta({
  // Fonctions pour la réactivité
  title: () => commune.value
    ? `${commune.value.nom} (${commune.value.codePostal}) - Explorateur`
    : 'Chargement...',

  description: () => commune.value
    ? `Découvrez les ${commune.value.voies?.length ?? 0} voies de ${commune.value.nom}`
    : '',

  // Open Graph pour les partages sociaux
  ogTitle: () => commune.value?.nom,
  ogDescription: () => commune.value
    ? `${commune.value.voies?.length ?? 0} voies dans ${commune.value.departement.nom}`
    : '',
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!--
      Header avec navigation de retour.
      NuxtLink = Link de Next.js.
      Différence : `to` au lieu de `href`.
    -->
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 py-4">
        <!--
          NuxtLink avec préfetch automatique.
          Quand l'utilisateur survole, Nuxt précharge la page.

          Equivalent Next.js :
          <Link href="/" prefetch>
        -->
        <NuxtLink
          to="/"
          class="text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Retour à la recherche
        </NuxtLink>
      </div>
    </header>

    <!--
      État 1 : Chargement
      Skeleton loader pendant le fetch initial.
    -->
    <div v-if="pending" class="p-8">
      <div class="animate-pulse space-y-4 max-w-3xl mx-auto">
        <div class="h-8 bg-gray-200 rounded w-1/2"></div>
        <div class="h-4 bg-gray-200 rounded w-1/4"></div>
        <div class="h-64 bg-gray-200 rounded"></div>
      </div>
    </div>

    <!--
      État 2 : Erreur réseau/API
      Affiché si useAsyncData échoue (timeout, 500, etc).
    -->
    <div v-else-if="error" class="p-8">
      <div class="max-w-3xl mx-auto bg-red-50 p-6 rounded-lg">
        <h2 class="text-xl font-bold text-red-700">Erreur</h2>
        <p class="mt-2 text-red-600">{{ error.message }}</p>
        <NuxtLink
          to="/"
          class="mt-4 inline-block px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retour à l'accueil
        </NuxtLink>
      </div>
    </div>

    <!--
      État 3 : Commune non trouvée
      Le fetch a réussi mais commune est null.
      Différent de l'erreur : l'API a répondu correctement.
    -->
    <div v-else-if="!commune" class="p-8">
      <div class="max-w-3xl mx-auto bg-yellow-50 p-6 rounded-lg">
        <h2 class="text-xl font-bold text-yellow-700">Commune introuvable</h2>
        <p class="mt-2 text-yellow-600">
          La commune avec l'ID "{{ communeId }}" n'existe pas.
        </p>
        <NuxtLink
          to="/"
          class="mt-4 inline-block px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
        >
          Retour à l'accueil
        </NuxtLink>
      </div>
    </div>

    <!--
      État 4 : Contenu chargé
      Le v-else garantit que commune est défini ici.
    -->
    <main v-else class="p-8">
      <div class="max-w-3xl mx-auto">
        <!-- En-tête commune -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-start justify-between">
            <div>
              <!--
                {{ }} = interpolation de texte.
                Equivalent React : {commune.nom}
              -->
              <h1 class="text-3xl font-bold text-gray-900">
                {{ commune.nom }}
              </h1>
              <p class="mt-1 text-lg text-gray-500">
                {{ commune.codePostal }} - {{ commune.departement.nom }}
              </p>
            </div>
            <!--
              Badge avec le code département.
              Tailwind pour le style.
            -->
            <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              {{ commune.departement.code }}
            </span>
          </div>
        </div>

        <!--
          Statistiques en grille.
          Calcul inline avec reduce pour le nombre total d'adresses.
        -->
        <div class="mt-6 grid grid-cols-2 gap-4">
          <div class="bg-white rounded-lg shadow p-4 text-center">
            <div class="text-3xl font-bold text-blue-600">
              <!--
                ?. pour le chaînage optionnel.
                ?? 0 comme fallback.
              -->
              {{ commune.voies?.length ?? 0 }}
            </div>
            <div class="text-gray-500">voies</div>
          </div>
          <div class="bg-white rounded-lg shadow p-4 text-center">
            <div class="text-3xl font-bold text-green-600">
              <!--
                reduce pour compter tous les numéros.
                Calcul dans le template = ok pour les cas simples.
                Pour les calculs complexes, utiliser computed().
              -->
              {{ commune.voies?.reduce((sum, v) => sum + (v.numeros?.length ?? 0), 0) ?? 0 }}
            </div>
            <div class="text-gray-500">adresses</div>
          </div>
        </div>

        <!-- Liste des voies -->
        <div class="mt-6 bg-white rounded-lg shadow">
          <h2 class="px-6 py-4 border-b font-semibold text-gray-700">
            Voies de la commune
          </h2>
          <!--
            v-for pour itérer sur les voies.
            :key obligatoire pour le virtual DOM.

            Equivalent React :
            {commune.voies.map(voie => (
              <li key={voie.id}>...</li>
            ))}
          -->
          <ul class="divide-y">
            <li
              v-for="voie in commune.voies"
              :key="voie.id"
              class="px-6 py-3 hover:bg-gray-50"
            >
              <!--
                NuxtLink avec template literal pour l'URL.
                :to avec backticks pour l'interpolation.

                Equivalent React :
                <Link href={`/voies/${voie.id}`}>
              -->
              <NuxtLink
                :to="`/voies/${voie.id}`"
                class="flex items-center justify-between"
              >
                <span class="text-gray-900">{{ voie.nom }}</span>
                <span class="text-sm text-gray-500">
                  {{ voie.numeros?.length ?? 0 }} numéros
                </span>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>
    </main>
  </div>
</template>
```

### 2. Ajouter la query GraphQL (si pas déjà fait)

Dans `apps/api/src/schema/commune.ts` :

```typescript
/**
 * Query pour récupérer une commune par son ID.
 *
 * Utilisée par la page /communes/[id].
 */

builder.queryField('commune', (t) =>
  t.prismaField({
    type: 'Commune',
    nullable: true,  // Retourne null si non trouvé
    args: {
      id: t.arg.id({ required: true })
    },
    resolve: (query, _parent, args) =>
      prisma.commune.findUnique({
        ...query,  // Inclut les relations demandées
        where: { id: String(args.id) }
      })
  })
)
```

---

## Comprendre le routing Nuxt

### Navigation programmatique

```typescript
// Dans un composant Vue/Nuxt
const router = useRouter()

// Navigation simple
router.push('/communes/75101')

// Avec query params
router.push({
  path: '/communes',
  query: { sort: 'name', page: '2' }
})
// Résultat : /communes?sort=name&page=2

// Avec params (route nommée)
router.push({
  name: 'communes-id',
  params: { id: '75101' }
})

// Replace (pas d'historique)
router.replace('/communes/75102')

// Navigation relative
router.back()
router.forward()
router.go(-2)
```

### Equivalent avec navigateTo

```typescript
// navigateTo = helper Nuxt (plus simple)
navigateTo('/communes/75101')

// Avec options
navigateTo('/communes/75101', {
  replace: true,    // Pas d'historique
  external: false,  // Lien interne
  redirectCode: 302 // Pour SSR
})

// Redirection externe
navigateTo('https://google.com', { external: true })
```

### Comparaison Next.js

```typescript
// Next.js
const router = useRouter()
router.push('/communes/75101')
router.push({ pathname: '/communes', query: { sort: 'name' } })
router.replace('/communes/75102')
router.back()

// Nuxt (méthode 1 : useRouter)
const router = useRouter()
router.push('/communes/75101')
router.push({ path: '/communes', query: { sort: 'name' } })
router.replace('/communes/75102')
router.back()

// Nuxt (méthode 2 : navigateTo - recommandé)
navigateTo('/communes/75101')
navigateTo({ path: '/communes', query: { sort: 'name' } })
```

---

## Gestion des erreurs 404

### Option 1 : Redirection depuis le composant

```vue
<script setup>
const { data } = await useAsyncData('commune', fetchCommune)

// Rediriger si non trouvé
if (!data.value?.commune) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Commune non trouvée'
  })
}
</script>
```

### Option 2 : Page error.vue

Créer `apps/web/app/error.vue` :

```vue
<script setup>
const props = defineProps({
  error: Object
})

// Effacer l'erreur et retourner à l'accueil
const handleClear = () => clearError({ redirect: '/' })
</script>

<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <h1 class="text-6xl font-bold text-gray-300">
        {{ error?.statusCode ?? 500 }}
      </h1>
      <p class="mt-4 text-xl text-gray-600">
        {{ error?.statusMessage ?? 'Une erreur est survenue' }}
      </p>
      <button
        class="mt-8 px-6 py-3 bg-blue-600 text-white rounded-lg"
        @click="handleClear"
      >
        Retour à l'accueil
      </button>
    </div>
  </div>
</template>
```

---

## Commandes à exécuter

```bash
# Terminal 1 : API
npm run dev:api

# Terminal 2 : Front
npm run dev:web
```

---

## Checkpoint ✓

### 1. Tester la navigation

1. Ouvre `http://localhost:3000`
2. Recherche "rivoli"
3. Clique sur un résultat
4. Tu es redirigé vers `/communes/75101` (ou similaire)

### 2. Accès direct

Ouvre `http://localhost:3000/communes/75101`

**Tu dois voir** :
- Nom de la commune en grand
- Code postal et département
- Badge avec le code département
- Statistiques (nombre de voies et adresses)
- Liste des voies cliquable
- Bouton retour fonctionnel

### 3. Vérifier le SEO (SSR)

1. Clic droit sur la page > "Afficher le code source"
2. Cherche `<title>`
3. Tu dois voir le nom de la commune, PAS "Chargement..."

```html
<!-- Ce qu'on doit voir dans le source HTML -->
<title>Paris 1er (75001) - Explorateur</title>
<meta name="description" content="Découvrez les 150 voies de Paris 1er">
```

### 4. Tester les erreurs

1. Va sur `/communes/inexistant`
2. Tu dois voir le message "Commune introuvable"
3. Le bouton retour fonctionne

---

## Pièges courants

| Problème | Cause | Solution |
|----------|-------|----------|
| `params.id` undefined | Mauvais nom de fichier | Fichier doit être `[id].vue` |
| 404 sur la page | Fichier mal placé | Doit être dans `pages/communes/` |
| SEO pas dynamique | `useSeoMeta` pas réactif | Utiliser des fonctions `() => ...` |
| Double fetch | Pas de `await` sur `useAsyncData` | Ajouter `await` obligatoire |
| Page blanche | Erreur non catchée | Vérifier l'onglet Console |
| Params pas mis à jour | Navigation client-side | Utiliser `computed()` pour params |

---

## Pattern : Middleware de validation

Pour valider les params avant le render :

```typescript
// middleware/validate-commune.ts
export default defineNuxtRouteMiddleware((to) => {
  const id = to.params.id as string

  // Vérifier le format de l'ID
  if (!/^\d{5}$/.test(id)) {
    return navigateTo('/404')
  }
})
```

```vue
<!-- pages/communes/[id].vue -->
<script setup>
// Appliquer le middleware à cette page
definePageMeta({
  middleware: ['validate-commune']
})
</script>
```

---

## Pattern : Prefetch des données

```vue
<template>
  <!-- Prefetch au survol (automatique avec NuxtLink) -->
  <NuxtLink to="/communes/75101">
    Paris 1er
  </NuxtLink>

  <!-- Désactiver le prefetch si besoin -->
  <NuxtLink to="/communes/75101" :prefetch="false">
    Paris 1er
  </NuxtLink>

  <!-- Prefetch manuel -->
  <a @mouseenter="prefetch" @click="navigate">
    Paris 1er
  </a>
</template>

<script setup>
const prefetch = () => {
  // Précharger les données
  $fetch('/api/communes/75101')
}
</script>
```

---

## Prochaine étape

→ [15-map.md](./15-map.md) : Carte MapLibre avec les adresses
