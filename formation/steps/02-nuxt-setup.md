# Step 02 : Setup Nuxt 4 avec Nuxt UI

> **Commit** : `step-02-nuxt-setup`
> **Duree** : ~25 min
> **Prerequis** : Step 01 complete

---

## Objectif

Avoir Nuxt 4 qui tourne dans `apps/web` avec une page d'accueil fonctionnelle.

---

## Pourquoi Nuxt ?

### Ce que tu connais : Next.js Pages Router

```
mon-app-next/
├── pages/
│   ├── index.tsx           ← Route /
│   ├── about.tsx           ← Route /about
│   └── users/[id].tsx      ← Route /users/:id
├── components/
├── styles/
└── next.config.js
```

**Points forts Next.js** :
- Tres populaire, enorme ecosystem
- Vercel = deploiement zero-config
- App Router moderne (mais tu utilises Pages Router)

**Points faibles Next.js** :
- Pas d'auto-imports (tu ecris `import { useState } from 'react'` des centaines de fois)
- Config webpack complexe
- Modules/plugins = chacun fait sa sauce

### Ce que tu vas apprendre : Nuxt 4

```
apps/web/
├── app/                    ← Nouveau en Nuxt 4 (avant c'etait a la racine)
│   ├── pages/
│   │   ├── index.vue       ← Route /
│   │   ├── about.vue       ← Route /about
│   │   └── users/[id].vue  ← Route /users/:id
│   ├── components/         ← Auto-importes !
│   ├── composables/        ← Auto-importes !
│   └── app.vue             ← Layout racine
├── public/
└── nuxt.config.ts
```

**Points forts Nuxt** :
- **Auto-imports** : Zero import pour Vue, Vue Router, composables, composants
- **Modules officiels** : Apollo, UI, Auth... s'installent en une ligne
- **Convention over configuration** : Moins de decisions a prendre
- **TypeScript natif** : Pas de config supplementaire

**Points faibles Nuxt** :
- Moins populaire que Next (mais tres actif)
- Debugging parfois plus opaque (magie = moins de controle)

### Tableau de comparaison detaille

| Aspect | Next.js Pages Router | Nuxt 4 |
|--------|---------------------|--------|
| **Routing** | `pages/` a la racine | `app/pages/` |
| **Layouts** | `_app.tsx` + composants | `app/layouts/` + `<NuxtPage />` |
| **Components** | Import manuel | Auto-import depuis `app/components/` |
| **Hooks/Composables** | Import manuel | Auto-import depuis `app/composables/` |
| **Config** | `next.config.js` (webpack) | `nuxt.config.ts` (Vite + modules) |
| **CSS** | Choix libre | Tailwind via `@nuxt/ui` |
| **API Routes** | `pages/api/` | `server/api/` (Nitro) |
| **Data fetching** | `getServerSideProps` | `useAsyncData` |

---

## Pourquoi Nuxt 4 et pas Nuxt 3 ?

Nuxt 4 est sorti fin 2025. Les differences avec Nuxt 3 :

| Nuxt 3 | Nuxt 4 |
|--------|--------|
| `pages/` a la racine | `app/pages/` |
| `components/` a la racine | `app/components/` |
| Vue 3.3 | Vue 3.5+ |
| Vite 4 | Vite 6 |

**Pourquoi ce changement ?** Le dossier `app/` isole le code applicatif du reste (config, public, server). C'est plus propre et ca prepare le terrain pour des features futures.

**Migration Nuxt 3 → 4** : Deplacer les dossiers dans `app/`. C'est tout.

---

## Pourquoi Nuxt UI ?

### Les alternatives

| Option | Avantages | Inconvenients |
|--------|-----------|---------------|
| **Nuxt UI** | Officiel, 110+ composants, Tailwind | Lock-in Nuxt |
| **Vuetify** | Material Design, tres complet | Lourd, style impose |
| **PrimeVue** | Enorme, theming | Complexe |
| **Headless UI** | Accessible, pas de style | Tu dois tout styler |
| **Tailwind seul** | Total controle | Tu recodes chaque composant |

### Notre choix : Nuxt UI v3

**Raisons** :
1. **Officiel Nuxt** : Integration parfaite, memes conventions
2. **Tailwind-based** : Tu peux tout customiser
3. **110+ composants** : Boutons, modales, tables, formulaires...
4. **Accessible** : ARIA par defaut
5. **Formation** : Un composant `<UButton>` est plus lisible que du Tailwind brut

---

## La structure Nuxt 4 en detail

```
apps/web/
├── app/                        ← CODE APPLICATIF
│   ├── app.vue                 ← Composant racine (equivalent _app.tsx)
│   ├── pages/                  ← Routes (file-based routing)
│   │   └── index.vue
│   ├── components/             ← Auto-importes partout
│   ├── composables/            ← Auto-importes partout
│   ├── layouts/                ← Layouts reutilisables
│   └── assets/                 ← CSS, images (bundled)
│
├── server/                     ← CODE SERVEUR (Nitro)
│   └── api/                    ← API routes (optionnel)
│
├── public/                     ← Fichiers statiques (non bundled)
├── nuxt.config.ts              ← Configuration centrale
├── package.json
└── tsconfig.json               ← Genere automatiquement
```

### Le fichier `app.vue`

C'est l'equivalent de `_app.tsx` en Next.js Pages Router :

```tsx
// Next.js _app.tsx
function MyApp({ Component, pageProps }) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  )
}
```

```vue
<!-- Nuxt app.vue -->
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

- `<NuxtLayout>` : Applique le layout actif
- `<NuxtPage>` : Rend la page correspondant a la route

### Les auto-imports : la grande difference

En Next.js, tu ecris ca des centaines de fois :

```typescript
// Next.js - chaque fichier
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'
import MyComponent from '../components/MyComponent'
```

En Nuxt, tu n'ecris **rien** :

```vue
<script setup>
// Tout est auto-importe !
const route = useRoute()       // Vue Router
const count = ref(0)           // Vue
const doubled = computed(...)  // Vue

// Meme tes composants !
// <MyComponent /> fonctionne sans import
</script>
```

**Comment ca marche ?** Nuxt scanne tes dossiers au demarrage et genere `.nuxt/imports.d.ts`. TypeScript voit ces declarations et l'autocompletion fonctionne.

**Ou voir les auto-imports ?**
```bash
cat apps/web/.nuxt/imports.d.ts
```

---

## Fichiers a creer

### 1. `apps/web/nuxt.config.ts`

```typescript
export default defineNuxtConfig({
  // Nuxt 4 utilise la nouvelle structure app/
  future: {
    compatibilityVersion: 4
  },

  compatibilityDate: '2024-11-01',

  // Modules = plugins Nuxt qui s'integrent profondement
  // Tres different de next.config.js qui configure juste webpack
  modules: [
    '@nuxt/ui'  // Ajoute les composants UI + Tailwind
  ],

  // Mode de rendu
  // ssr: true = SSR (comme Next.js par defaut)
  // ssr: false = SPA only
  ssr: true,

  // DevTools integres (pas d'extension navigateur requise)
  devtools: { enabled: true },

  // TypeScript strict par defaut
  typescript: {
    strict: true
  }
})
```

**Difference avec Next.js** : `nuxt.config.ts` est beaucoup plus central. Les modules s'y installent et injectent des fonctionnalites globales dans toute l'app.

### 2. `apps/web/app/app.vue`

```vue
<template>
  <NuxtPage />
</template>
```

C'est le composant racine. Toutes les pages sont rendues dans `<NuxtPage />`.

### 3. `apps/web/app/pages/index.vue`

```vue
<script setup lang="ts">
// Pas d'imports ! Tout est auto-importe par Nuxt

// ref() = useState() en React, mais :
// - Retourne un objet { value: ... }
// - Se lit avec .value dans le script
// - Se lit SANS .value dans le template (auto-unwrap)
const message = ref('Hello from Nuxt 4!')

// useSeoMeta() = <Head> en Next.js
// Genere les balises <title>, <meta>, etc.
useSeoMeta({
  title: 'Explorateur d\'adresses',
  description: 'Recherchez parmi 26 millions d\'adresses francaises'
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 p-8">
    <!-- Pas d'import pour les classes Tailwind, Nuxt UI l'inclut -->
    <h1 class="text-3xl font-bold text-gray-900">
      {{ message }}
    </h1>

    <p class="mt-4 text-gray-600">
      Nuxt 4 + Nuxt UI fonctionnent !
    </p>

    <!-- UButton = composant Nuxt UI, auto-importe -->
    <UButton class="mt-6" color="primary">
      Un bouton Nuxt UI
    </UButton>
  </div>
</template>
```

### 4. `apps/web/package.json` (remplacer)

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
    "nuxt": "^3.15.0"
  }
}
```

---

## Commandes a executer

```bash
# A la racine du monorepo
npm install

# Lancer Nuxt
npm run dev:web
```

---

## Comprendre `<script setup>`

C'est la syntaxe moderne de Vue 3. Comparaison avec React :

```tsx
// React
import { useState } from 'react'

export default function Page() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <p>{count}</p>
      <button onClick={() => setCount(count + 1)}>+</button>
    </div>
  )
}
```

```vue
<!-- Vue 3 avec <script setup> -->
<script setup>
const count = ref(0)
</script>

<template>
  <div>
    <p>{{ count }}</p>
    <button @click="count++">+</button>
  </div>
</template>
```

**Differences** :
- Pas de `return` : tout ce qui est declare dans `<script setup>` est expose au template
- Pas de `export default` : le composant est le fichier entier
- `@click` au lieu de `onClick` : convention Vue
- `{{ }}` au lieu de `{}` : syntaxe template Vue

---

## Checkpoint

### 1. Lancer le serveur de dev

```bash
npm run dev:web
```

### 2. Ouvrir le navigateur

Ouvre `http://localhost:3000`

**Tu dois voir** :
- Le titre "Hello from Nuxt 4!"
- Le texte "Nuxt 4 + Nuxt UI fonctionnent !"
- Un bouton bleu stylise

### 3. Verifier les DevTools Nuxt

En bas de la page, tu dois voir une icone Nuxt. Clique dessus pour ouvrir les DevTools integres.

### 4. Verifier les auto-imports

```bash
cat apps/web/.nuxt/imports.d.ts | head -50
```

Tu dois voir des declarations pour `ref`, `computed`, `useRoute`, etc.

---

## Pieges courants

| Probleme | Cause | Solution |
|----------|-------|----------|
| `ref is not defined` | Nuxt pas demarre | Relancer `npm run dev:web` |
| Page blanche | Erreur dans `app.vue` | Verifier la console |
| Styles manquants | Nuxt UI pas installe | Verifier `modules: ['@nuxt/ui']` |
| Port 3000 occupe | Autre process | `npx kill-port 3000` |
| `Cannot find module 'nuxt'` | Deps pas installees a la racine | `cd ../.. && npm install` |
| Page dans `pages/` au lieu de `app/pages/` | Mauvaise structure | Deplacer dans `app/pages/` |

---

## Ce qui se passe au demarrage

Quand tu lances `npm run dev:web` :

1. **Nuxt lit `nuxt.config.ts`** et charge les modules
2. **Nuxt scanne les dossiers** `app/pages`, `app/components`, `app/composables`
3. **Nuxt genere `.nuxt/`** avec les types, routes, imports
4. **Vite demarre** le serveur de dev avec HMR
5. **Le navigateur se connecte** et recoit la page SSR

La generation de `.nuxt/` est automatique. Tu ne modifies jamais ce dossier.

---

## Structure apres ce step

```
apps/web/
├── .nuxt/                    ← Genere, ne pas toucher
│   ├── imports.d.ts          ← Auto-imports TypeScript
│   └── ...
├── app/
│   ├── app.vue               ← Racine
│   └── pages/
│       └── index.vue         ← Route /
├── nuxt.config.ts
├── package.json
└── tsconfig.json             ← Genere, etend .nuxt/tsconfig.json
```

---

## Ce qu'on n'a PAS configure (et pourquoi)

| Element | Next.js | Nuxt | Pourquoi pas besoin |
|---------|---------|------|---------------------|
| TypeScript | `tsconfig.json` manuel | Auto-genere | Nuxt le configure |
| Tailwind | `tailwind.config.js` | Via Nuxt UI | Le module s'en occupe |
| ESLint | `.eslintrc` | Optionnel | On peut ajouter plus tard |
| PostCSS | `postcss.config.js` | Via Nuxt UI | Inclus dans le module |

Nuxt est **opinionated** : il prend des decisions pour toi. Moins de config, plus de conventions.

---

## Prochaine etape

→ [03-vue-reactivity.md](./03-vue-reactivity.md) : Comprendre `ref`, `computed` et la reactivite Vue
