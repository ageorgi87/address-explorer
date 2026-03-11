# Step 09 : Schema-first avec GraphQL Codegen

> **Commit** : `step-09-schema-first-setup`
> **Durée** : ~25 min
> **Prérequis** : Step 08 complété

---

## Objectif

Configurer une architecture schema-first avec typage automatique via GraphQL Code Generator.

À la fin de ce step :
- Le schéma GraphQL est défini en SDL (lisible, standard)
- Les types TypeScript sont générés automatiquement
- Les resolvers sont typés grâce aux mappers Prisma

---

## Schema-first vs Code-first

### Pourquoi schema-first ?

On a choisi l'approche **schema-first** plutôt que code-first (Pothos) pour plusieurs raisons :

| Critère | Code-first (Pothos) | Schema-first (notre choix) |
|---------|---------------------|---------------------------|
| **Lisibilité** | API TypeScript verbose | SDL GraphQL natif |
| **Standards** | Syntaxe propriétaire | Standard GraphQL |
| **Typage** | `t.exposeString('nom')` | Automatique via codegen |
| **Courbe** | API à apprendre | GraphQL standard |
| **Portabilité** | Spécifique Pothos | Schéma réutilisable |

L'approche schema-first avec GraphQL Code Generator offre :
1. **Schémas lisibles** en SDL standard
2. **Types générés** automatiquement depuis le schéma
3. **Mappers Prisma** pour lier les types GraphQL aux modèles DB
4. **Imports explicites** (pas de magie)

---

## Architecture

```
apps/api/src/
├── schema/              # Définitions GraphQL en TypeScript (template strings)
│   ├── departement.ts   # Type Departement + queries
│   ├── commune.ts       # Type Commune + queries
│   └── voie.ts          # Type Voie
├── resolvers/           # Implémentation des resolvers
│   ├── departement.ts   # Resolvers Departement
│   ├── commune.ts       # Resolvers Commune
│   └── voie.ts          # Resolvers Voie
├── generated/           # Types générés (ne pas modifier)
│   ├── graphql.ts       # Types TypeScript du schéma
│   └── context.ts       # Type du contexte GraphQL
├── lib/
│   ├── prisma.ts        # Client Prisma singleton
│   └── isDev.ts         # Constante isDev
└── index.ts             # Point d'entrée serveur
```

---

## Les fichiers à créer/modifier

### 1. Installer les dépendances

```bash
cd apps/api
npm install @graphql-tools/merge @graphql-tools/schema
npm install -D @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-resolvers
```

### 2. Créer `apps/api/codegen.ts`

Configuration de GraphQL Code Generator :

```typescript
import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: 'src/schema/*.ts',

  generates: {
    'src/generated/graphql.ts': {
      plugins: ['typescript', 'typescript-resolvers'],
      config: {
        // Mapper les types GraphQL vers les types Prisma
        mappers: {
          Departement: '@prisma/client#Departement as DepartementModel',
          Commune: '@prisma/client#Commune as CommuneModel',
          Voie: '@prisma/client#Voie as VoieModel',
        },
        // Type du contexte
        contextType: './context.js#GraphQLContext',
        // Utiliser des types stricts
        useIndexSignature: true,
        // Éviter les Maybe<T> partout
        avoidOptionals: {
          field: true,
          inputValue: false,
          object: false,
        },
      },
    },
  },
}

export default config
```

### 3. Créer `apps/api/src/generated/context.ts`

```typescript
import type { PrismaClient } from '@prisma/client'

export interface GraphQLContext {
  prisma: PrismaClient
}
```

### 4. Créer `apps/api/src/lib/isDev.ts`

```typescript
export const isDev = process.env.NODE_ENV !== "production";
```

### 5. Créer `apps/api/src/lib/prisma.ts`

```typescript
import { PrismaClient } from '@prisma/client'
import { isDev } from './isDev.js'

// Singleton Prisma pour éviter les connexions multiples en dev (hot-reload)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Créer ou réutiliser l'instance existante
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  // En dev, on log les queries pour debug
  log: isDev ? ['query', 'error', 'warn'] : ['error'],
})

// En dev, stocker dans globalThis pour persister entre les hot-reloads
if (isDev) {
  globalForPrisma.prisma = prisma
}
```

### 6. Ajouter le script codegen dans `package.json`

```json
{
  "scripts": {
    "codegen": "graphql-codegen",
    "dev": "tsx watch src/index.ts",
    "build": "npm run codegen && tsc"
  }
}
```

---

## Comment ça marche

### Le flux de génération

```
schema/*.ts (SDL)  →  codegen  →  generated/graphql.ts (types TS)
                                           ↓
resolvers/*.ts  ←────── import Resolvers ──┘
```

### Les mappers

Les mappers sont la clé du typage. Ils disent à codegen :

> "Quand un resolver retourne un `Departement`, c'est en fait un `DepartementModel` de Prisma"

```typescript
mappers: {
  Departement: '@prisma/client#Departement as DepartementModel',
}
```

Sans mapper, codegen penserait que `parent` dans un resolver Departement contient tous les champs GraphQL. Avec le mapper, il sait que `parent` est un model Prisma (qui peut avoir moins de champs).

---

## Commandes à exécuter

```bash
# Installer les dépendances
npm install

# Créer les fichiers (voir sections suivantes)
mkdir -p apps/api/src/schema apps/api/src/resolvers apps/api/src/generated apps/api/src/lib

# Générer les types (après avoir créé les schémas)
npm run codegen -w api

# Lancer l'API
npm run dev:api
```

---

## Checkpoint

### 1. Fichiers créés

```
apps/api/
├── codegen.ts
├── src/
│   ├── generated/
│   │   └── context.ts
│   └── lib/
│       ├── prisma.ts
│       └── isDev.ts
```

### 2. Codegen fonctionne

Après avoir créé les schémas (step suivant), la commande :

```bash
npm run codegen -w api
```

Doit créer `src/generated/graphql.ts` avec les types.

---

## Bonnes pratiques

### 1. Imports explicites

On préfère les imports explicites plutôt que les glob patterns :

```typescript
// Bien : Explicite, visible dans l'IDE
import { departementTypeDefs } from "./schema/departement.js";
import { communeTypeDefs } from "./schema/commune.js";

// Éviter : Magie, difficile à suivre
loadFilesSync(path.join(__dirname, "schema/*.graphql"))
```

### 2. Nommage cohérent

- Schema : `departementTypeDefs`, `communeTypeDefs`
- Resolvers : `departementResolvers`, `communeResolvers`
- Pas de barrel exports (index.ts qui réexporte tout)

### 3. Un fichier = un type

Chaque type GraphQL a son propre fichier dans `schema/` et `resolvers/`.

---

## Prochaine étape

On a l'infrastructure. Créons les premiers types GraphQL.

→ [10-graphql-types.md](./10-graphql-types.md) : Créer les types Departement et Commune
