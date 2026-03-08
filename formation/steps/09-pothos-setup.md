# Step 09 : Configurer Pothos

> **Commit** : `step-09-pothos-setup`
> **Durée** : ~30 min
> **Prérequis** : Step 08 complété

---

## Objectif

Remplacer le schéma SDL (string) par un schéma code-first avec Pothos.

À la fin de ce step :
- Le schéma GraphQL est 100% TypeScript
- Les types Prisma sont automatiquement disponibles
- L'autocomplétion fonctionne parfaitement dans les resolvers

---

## Pourquoi Pothos ?

### Le problème avec SDL-first

Dans le step précédent, on a écrit le schéma en SDL (string) :

```typescript
const schema = createSchema({
  typeDefs: `
    type Query {
      user(id: ID!): User!
    }
    type User {
      id: ID!
      name: String!
    }
  `,
  resolvers: {
    Query: {
      user: (_, args) => {
        // args est typé 'any' - pas d'autocomplétion !
        // On pourrait retourner n'importe quoi...
        return { id: args.id, nom: 'Jean' }  // ❌ 'nom' au lieu de 'name', aucune erreur !
      },
    },
  },
})
```

**Problèmes :**
1. `args` est typé `any` - pas de vérification
2. Le retour n'est pas validé contre le type `User`
3. Fautes de frappe silencieuses (`nom` vs `name`)
4. Deux sources de vérité (typeDefs + resolvers)

### La solution code-first

| Approche | SDL-first | Code-first (Pothos) |
|----------|-----------|---------------------|
| Définition | String GraphQL | TypeScript |
| Typage | Manuel ou généré | Automatique |
| Erreurs | Runtime | Compile-time |
| Autocomplétion | Limitée | Complète |
| Refactoring | Risqué | Safe |
| Source de vérité | 2 (typeDefs + resolvers) | 1 (code) |

### Pourquoi Pothos spécifiquement ?

Il existe plusieurs librairies code-first :

| Librairie | Avantages | Inconvénients |
|-----------|-----------|---------------|
| **TypeGraphQL** | Décorateurs familiers | Decorateurs expérimentaux |
| **Nexus** | API élégante | Moins maintenu |
| **gqtx** | Ultra léger | Limité |
| **Pothos** | Plugin Prisma, Relay, types parfaits | API verbose |

**On choisit Pothos pour :**
1. **Plugin Prisma** : Génère les types GraphQL depuis `schema.prisma`
2. **Plugin Relay** : Pagination cursor-based native
3. **Zero runtime overhead** : Tout est résolu à la compilation
4. **Types parfaits** : Pas de `as any` ou de hacks

---

## Comment ça marche ?

### Architecture de Pothos

```
schema.prisma  ─┬─> prisma generate ─> @prisma/client (types DB)
                └─> prisma-pothos-types ─> types Pothos

builder.ts (configure Pothos) ─┬─> types/*.ts (définition des types GraphQL)
                               └─> index.ts (build schema + serveur)
```

### Le Builder

Le "builder" est l'objet central de Pothos. Il :
- Configure les plugins
- Connaît les types Prisma
- Génère le schéma GraphQL final

```typescript
const builder = new SchemaBuilder<{
  PrismaTypes: PrismaTypes  // Types générés depuis schema.prisma
  Context: { prisma: PrismaClient }  // Contexte disponible dans les resolvers
}>({
  plugins: [PrismaPlugin, RelayPlugin],
  prisma: { client: prisma },
})
```

---

## Les fichiers à créer/modifier

### 1. Ajouter les dépendances dans `apps/api/package.json`

```json
{
  "dependencies": {
    "@pothos/core": "^4.3.0",
    "@pothos/plugin-prisma": "^4.3.0",
    "@pothos/plugin-relay": "^4.3.0"
  }
}
```

### 2. Modifier `apps/api/prisma/schema.prisma`

Ajouter le générateur Pothos :

```prisma
generator client {
  provider = "prisma-client-js"
}

// NOUVEAU : Génère les types pour Pothos
generator pothos {
  provider = "prisma-pothos-types"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ... modèles inchangés ...
```

### 3. Créer `apps/api/src/db.ts`

Instance singleton du client Prisma :

```typescript
/**
 * Client Prisma singleton
 *
 * Pourquoi un fichier séparé ?
 * - Évite les imports circulaires
 * - Un seul point d'accès à la DB
 * - Facilite les tests (mock possible)
 */

import { PrismaClient } from '@prisma/client'

// En développement, on réutilise l'instance entre les hot-reloads
// Voir Step 05 pour l'explication du pattern singleton
declare global {
  var __prisma: PrismaClient | undefined
}

export const prisma = globalThis.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
})

if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma
}
```

### 4. Créer `apps/api/src/builder.ts`

Configuration centrale de Pothos :

```typescript
/**
 * Builder Pothos
 *
 * Le builder est le cœur de Pothos. Il :
 * 1. Configure les plugins (Prisma, Relay)
 * 2. Définit les types génériques (Context, PrismaTypes)
 * 3. Fournit les méthodes pour créer le schéma
 *
 * Tous les types GraphQL seront définis via ce builder.
 */

import SchemaBuilder from '@pothos/core'
import PrismaPlugin from '@pothos/plugin-prisma'
import RelayPlugin from '@pothos/plugin-relay'

// Types générés par `prisma generate` (via generator pothos)
// Ce fichier est créé automatiquement dans node_modules
import type PrismaTypes from '@pothos/plugin-prisma/generated'

import { prisma } from './db.js'

// ============================================================
// TYPE DU BUILDER
// ============================================================
// Le générique définit :
// - PrismaTypes : Les types de tes modèles Prisma
// - Context : Ce qui est disponible dans chaque resolver
// - Scalars : Types scalaires custom (optionnel)
// ============================================================

export const builder = new SchemaBuilder<{
  // Types Prisma générés automatiquement
  PrismaTypes: PrismaTypes

  // Contexte disponible dans tous les resolvers
  // Accessible via le 3ème argument : (parent, args, context) => ...
  Context: {
    prisma: typeof prisma
  }

  // Scalars custom (on pourrait ajouter DateTime, JSON, etc.)
  Scalars: {
    // ID est string par défaut, mais on peut le customiser
    ID: {
      Input: string
      Output: string
    }
  }
}>({
  // ============================================================
  // PLUGINS
  // ============================================================

  plugins: [PrismaPlugin, RelayPlugin],

  // ============================================================
  // CONFIGURATION PRISMA
  // ============================================================
  // Le plugin Prisma permet :
  // - builder.prismaObject() : Créer un type GraphQL depuis un model Prisma
  // - t.relation() : Exposer les relations automatiquement
  // - t.prismaField() : Queries optimisées (évite N+1)
  // ============================================================

  prisma: {
    client: prisma,

    // Exposer les filtres Prisma (where, orderBy, etc.)
    // Utile pour des APIs très flexibles
    exposeDescriptions: true,

    // Appliquer le filtre relationnel automatiquement
    // Évite le N+1 problem en utilisant le DataLoader sous le capot
    filterConnectionTotalCount: true,
  },

  // ============================================================
  // CONFIGURATION RELAY
  // ============================================================
  // Relay est une spec de pagination par curseurs.
  // Avantages :
  // - Pagination stable (pas de "page 2 manquante si item supprimé")
  // - Fonctionne avec les données en temps réel
  // - Standard reconnu (GitHub, Shopify, etc.)
  // ============================================================

  relay: {
    // Format des curseurs (base64 par défaut)
    // En prod, on pourrait encoder avec une clé secrète
    cursorType: 'String',

    // Fonction pour encoder les curseurs
    encodeGlobalID: (typename, id) => `${typename}:${id}`,
    decodeGlobalID: (globalID) => {
      const [typename, id] = globalID.split(':')
      return { typename, id }
    },
  },
})

// ============================================================
// INITIALISATION DU TYPE QUERY
// ============================================================
// Obligatoire : Le type Query racine doit être déclaré
// On ajoutera les champs dans d'autres fichiers
// ============================================================

builder.queryType({
  description: 'Point d\'entrée pour toutes les requêtes de lecture',
})

// ============================================================
// INITIALISATION DU TYPE MUTATION (optionnel pour l'instant)
// ============================================================
// On le déclare pour plus tard, quand on aura des mutations
// ============================================================

// builder.mutationType({
//   description: 'Point d\'entrée pour toutes les requêtes d\'écriture',
// })
```

### 5. Modifier `apps/api/src/index.ts`

Remplacer le schéma SDL par Pothos :

```typescript
/**
 * Point d'entrée du serveur GraphQL
 *
 * Ce fichier :
 * 1. Importe le builder configuré
 * 2. Ajoute des queries de test
 * 3. Construit le schéma final
 * 4. Lance le serveur Yoga
 */

import { createYoga } from 'graphql-yoga'
import { createServer } from 'node:http'

import { builder } from './builder.js'
import { prisma } from './db.js'

// ============================================================
// QUERIES DE TEST
// ============================================================
// On définit quelques queries simples pour vérifier que tout fonctionne
// Dans les prochains steps, on ajoutera les vraies queries
// ============================================================

builder.queryField('hello', (t) =>
  t.string({
    description: 'Message de bienvenue',
    resolve: () => 'Bienvenue sur l\'API Adresse Explorer !',
  })
)

builder.queryField('serverTime', (t) =>
  t.string({
    description: 'Heure actuelle du serveur (ISO 8601)',
    resolve: () => new Date().toISOString(),
  })
)

// Exemple avec un type personnalisé
const ApiInfoType = builder.objectRef<{
  name: string
  version: string
  description: string
}>('ApiInfo').implement({
  description: 'Métadonnées de l\'API',
  fields: (t) => ({
    name: t.exposeString('name'),
    version: t.exposeString('version'),
    description: t.exposeString('description'),
  }),
})

builder.queryField('apiInfo', (t) =>
  t.field({
    type: ApiInfoType,
    description: 'Informations sur l\'API',
    resolve: () => ({
      name: 'Adresse Explorer API',
      version: '0.2.0',
      description: 'API GraphQL pour explorer 26 millions d\'adresses',
    }),
  })
)

// ============================================================
// CONSTRUCTION DU SCHÉMA
// ============================================================
// builder.toSchema() compile tous les types et queries en un schéma GraphQL
// C'est ici que les vérifications de type ont lieu
// ============================================================

const schema = builder.toSchema()

// ============================================================
// SERVEUR YOGA
// ============================================================

const yoga = createYoga({
  schema,

  // Contexte disponible dans tous les resolvers
  // Appelé à chaque requête
  context: () => ({
    prisma,
  }),

  // GraphiQL activé en dev
  graphiql: {
    title: 'Adresse Explorer API (Pothos)',
    defaultQuery: `# Schéma maintenant géré par Pothos !
# L'autocomplétion est basée sur les types TypeScript.

query {
  hello
  serverTime
  apiInfo {
    name
    version
    description
  }
}
`,
  },

  logging: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
})

const server = createServer(yoga)
const PORT = process.env.PORT || 4000

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   🚀 GraphQL Pothos démarré !                           ║
║                                                          ║
║   GraphiQL : http://localhost:${PORT}/graphql              ║
║                                                          ║
║   Le schéma est maintenant 100% TypeScript.             ║
║   Essaie de faire une erreur de type dans un resolver,  ║
║   TypeScript te préviendra !                             ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
`)
})
```

---

## Commandes à exécuter

```bash
# À la racine
npm install

# Régénérer le client Prisma + types Pothos
cd apps/api
npx prisma generate

# Vérifier que les types sont générés
ls node_modules/@pothos/plugin-prisma/generated.d.ts

# Lancer l'API
npm run dev:api
```

---

## Checkpoint ✓

### 1. Types générés

```bash
# Ce fichier doit exister après prisma generate
cat apps/api/node_modules/@pothos/plugin-prisma/generated.d.ts
```

Tu dois voir des types comme :
```typescript
export type PrismaTypes = {
  Departement: { ... }
  Commune: { ... }
  Voie: { ... }
  Numero: { ... }
}
```

### 2. GraphiQL fonctionne

Ouvre `http://localhost:4000/graphql` et exécute :

```graphql
query {
  hello
  serverTime
  apiInfo {
    name
    version
    description
  }
}
```

**Résultat :**
```json
{
  "data": {
    "hello": "Bienvenue sur l'API Adresse Explorer !",
    "serverTime": "2024-01-15T10:30:00.000Z",
    "apiInfo": {
      "name": "Adresse Explorer API",
      "version": "0.2.0",
      "description": "API GraphQL pour explorer 26 millions d'adresses"
    }
  }
}
```

### 3. TypeScript vérifie les resolvers

Essaie d'introduire une erreur dans `index.ts` :

```typescript
builder.queryField('hello', (t) =>
  t.string({
    resolve: () => 42,  // ❌ Erreur TypeScript : number n'est pas string
  })
)
```

Tu dois voir une erreur de compilation !

---

## Comprendre Pothos en détail

### La différence avec SDL

```typescript
// SDL-first (avant)
const schema = createSchema({
  typeDefs: `
    type Query {
      hello: String!
    }
  `,
  resolvers: {
    Query: {
      hello: () => 42,  // ❌ Bug silencieux (42 au lieu de string)
    },
  },
})

// Code-first Pothos (maintenant)
builder.queryField('hello', (t) =>
  t.string({
    resolve: () => 42,  // ❌ Erreur de compilation TypeScript
  })
)
```

### Anatomie d'un champ Pothos

```typescript
builder.queryField('nomDuChamp', (t) =>
  // t = "TypeRef" - fournit les méthodes pour définir le type de retour
  t.string({                    // Type de retour : String!
  // t.int({                    // Type : Int!
  // t.boolean({                // Type : Boolean!
  // t.field({ type: MonType }) // Type custom

    // Options
    nullable: true,             // Rend le champ nullable (String au lieu de String!)
    description: 'Description', // Documentation dans GraphiQL

    // Arguments
    args: {
      search: t.arg.string({ required: true }),  // search: String!
      limit: t.arg.int({ defaultValue: 10 }),    // limit: Int = 10
    },

    // Resolver : fonction qui retourne la valeur
    resolve: (parent, args, context, info) => {
      // parent  : objet parent (null pour Query root)
      // args    : { search: string, limit: number } - TYPÉ !
      // context : { prisma: PrismaClient } - TYPÉ !
      // info    : GraphQL resolve info

      return 'valeur'
    },
  })
)
```

### Types Prisma avec Pothos

Dans le prochain step, on utilisera `builder.prismaObject()` :

```typescript
// Définit un type GraphQL à partir d'un model Prisma
builder.prismaObject('Departement', {
  fields: (t) => ({
    // Expose les champs scalaires
    code: t.exposeID('code'),
    nom: t.exposeString('nom'),

    // Expose les relations (automatiquement optimisé)
    communes: t.relation('communes'),
  }),
})
```

Les avantages :
- **Types automatiques** : Pas besoin de redéfinir
- **Relations optimisées** : Évite le N+1 problem
- **Validation** : Le champ doit exister dans le model Prisma

---

## Structure de fichiers recommandée

Pour un projet plus grand, on séparerait ainsi :

```
apps/api/src/
├── index.ts           # Point d'entrée, serveur
├── builder.ts         # Configuration Pothos
├── db.ts              # Client Prisma
├── schema/            # Définitions GraphQL
│   ├── index.ts       # Importe tous les types
│   ├── departement.ts # Type Departement
│   ├── commune.ts     # Type Commune
│   ├── voie.ts        # Type Voie
│   └── numero.ts      # Type Numero
└── utils/             # Helpers
```

Pour l'instant, on garde tout dans `index.ts` pour simplifier.

---

## Pièges courants

| Problème | Cause | Solution |
|----------|-------|----------|
| `Cannot find module '@pothos/plugin-prisma/generated'` | Types pas générés | `npx prisma generate` |
| Import `.js` manquant | ESM strict | `./builder.js` pas `./builder` |
| `builder is not defined` | Import circulaire | Vérifier l'ordre des imports |
| Types `any` dans les resolvers | Génériques mal configurés | Vérifier le type du builder |
| Schéma vide | `builder.toSchema()` avant les définitions | Importer les types avant |

---

## SDL-first vs Code-first : Récapitulatif

| Critère | SDL-first | Code-first (Pothos) |
|---------|-----------|---------------------|
| **Apprentissage** | Plus facile (GraphQL pur) | Nécessite comprendre Pothos |
| **Typage** | Pas de vérification | 100% vérifié par TypeScript |
| **Refactoring** | Risqué (string) | Safe (IDE guide) |
| **Performance** | Équivalent | Équivalent |
| **Écosystème** | Universel | Spécifique Pothos |
| **Prisma** | Manuel | Plugin natif |

**Notre choix** : Code-first avec Pothos pour la sécurité de type et l'intégration Prisma.

---

## Prochaine étape

On a maintenant une infrastructure Pothos fonctionnelle. Il est temps d'exposer nos vraies données !

→ [10-graphql-types.md](./10-graphql-types.md) : Créer les types GraphQL pour Département, Commune, Voie, Numéro
