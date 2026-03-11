# Step 10 : Types GraphQL

> **Commit** : `step-10-graphql-types`
> **Durée** : ~30 min
> **Prérequis** : Step 09 complété

---

## Objectif

Créer les types GraphQL pour Departement, Commune et Voie avec leurs resolvers.

À la fin de ce step :
- Les types sont définis en SDL dans des template strings TypeScript
- Les resolvers implémentent les champs calculés et les relations
- L'API expose les données BAN

---

## Structure des fichiers

```
apps/api/src/
├── schema/
│   ├── departement.ts   # Type Departement + queries
│   ├── commune.ts       # Type Commune + queries
│   └── voie.ts          # Type Voie
├── resolvers/
│   ├── departement.ts   # Resolvers Departement
│   ├── commune.ts       # Resolvers Commune
│   └── voie.ts          # Resolvers Voie
├── lib/
│   ├── graphiql.ts      # Config GraphiQL
│   ├── prisma.ts        # Client Prisma
│   └── isDev.ts         # Constante isDev
└── index.ts             # Point d'entrée
```

---

## Les fichiers à créer

### 1. `apps/api/src/schema/departement.ts`

```typescript
export const departementTypeDefs = /* GraphQL */ `
  type Query {
    "Liste de tous les départements"
    departements: [Departement!]!

    "Un département par son code"
    departement(code: String!): Departement
  }

  "Département français"
  type Departement {
    "Code du département (ex: 75)"
    code: String!

    "Nom officiel"
    nom: String!

    "Nom formaté (ex: 75 - Paris)"
    displayName: String!

    "Nombre de communes"
    communeCount: Int!

    "Liste des communes"
    communes: [Commune!]!
  }
`
```

### 2. `apps/api/src/schema/commune.ts`

```typescript
export const communeTypeDefs = /* GraphQL */ `
  extend type Query {
    "Une commune par son code INSEE"
    commune(id: String!): Commune

    "Communes d'un département"
    communesByDepartement(departementCode: String!): [Commune!]!
  }

  "Commune française"
  type Commune {
    "Code INSEE (identifiant unique)"
    id: String!

    "Nom de la commune"
    nom: String!

    "Code postal principal"
    codePostal: String!

    "Nom formaté avec code postal"
    displayName: String!

    "Département parent"
    departement: Departement!

    "Code du département"
    departementCode: String!

    "Nombre de voies"
    voieCount: Int!

    "Liste des voies (max 100)"
    voies: [Voie!]!
  }
`
```

### 3. `apps/api/src/schema/voie.ts`

```typescript
export const voieTypeDefs = /* GraphQL */ `
  "Voie (rue, avenue, etc.)"
  type Voie {
    "Identifiant unique"
    id: String!

    "Nom de la voie"
    nom: String!

    "Commune parente"
    commune: Commune!
  }
`
```

### 4. `apps/api/src/resolvers/departement.ts`

```typescript
import type { Resolvers } from '../generated/graphql.js'

export const departementResolvers: Resolvers = {
  Query: {
    departements: (_parent, _args, ctx) => {
      return ctx.prisma.departement.findMany({
        orderBy: { code: 'asc' },
      })
    },

    departement: (_parent, args, ctx) => {
      return ctx.prisma.departement.findUnique({
        where: { code: args.code },
      })
    },
  },

  Departement: {
    // Champ calculé : nom formaté
    displayName: (parent) => `${parent.code} - ${parent.nom}`,

    // Champ calculé : nombre de communes
    communeCount: (parent, _args, ctx) => {
      return ctx.prisma.commune.count({
        where: { departementCode: parent.code },
      })
    },

    // Relation : liste des communes
    communes: (parent, _args, ctx) => {
      return ctx.prisma.commune.findMany({
        where: { departementCode: parent.code },
        orderBy: { nom: 'asc' },
      })
    },
  },
}
```

### 5. `apps/api/src/resolvers/commune.ts`

```typescript
import type { Resolvers } from '../generated/graphql.js'

export const communeResolvers: Resolvers = {
  Query: {
    commune: (_parent, args, ctx) => {
      return ctx.prisma.commune.findUnique({
        where: { id: args.id },
      })
    },

    communesByDepartement: (_parent, args, ctx) => {
      return ctx.prisma.commune.findMany({
        where: { departementCode: args.departementCode },
        orderBy: { nom: 'asc' },
      })
    },
  },

  Commune: {
    // Champ calculé : nom formaté
    displayName: (parent) => `${parent.nom} - ${parent.codePostal}`,

    // Relation : département parent
    departement: async (parent, _args, ctx) => {
      const departement = await ctx.prisma.departement.findUnique({
        where: { code: parent.departementCode },
      })
      if (!departement) throw new Error(`Departement ${parent.departementCode} introuvable`)
      return departement
    },

    // Champ calculé : nombre de voies
    voieCount: (parent, _args, ctx) => {
      return ctx.prisma.voie.count({
        where: { communeId: parent.id },
      })
    },

    // Relation : liste des voies (limitée)
    voies: (parent, _args, ctx) => {
      return ctx.prisma.voie.findMany({
        where: { communeId: parent.id },
        take: 100,
        orderBy: { nom: 'asc' },
      })
    },
  },
}
```

### 6. `apps/api/src/resolvers/voie.ts`

```typescript
import type { Resolvers } from '../generated/graphql.js'

export const voieResolvers: Resolvers = {
  Voie: {
    commune: async (parent, _args, ctx) => {
      const commune = await ctx.prisma.commune.findUnique({
        where: { id: parent.communeId },
      })
      if (!commune) throw new Error(`Commune ${parent.communeId} introuvable`)
      return commune
    },
  },
}
```

### 7. `apps/api/src/lib/graphiql.ts`

```typescript
export const GRAPHIQL_CONFIG = {
  title: "Adresse Explorer API",
  defaultQuery: `# Explore l'API !

query Departements {
  departements {
    code
    nom
    displayName
    communeCount
  }
}

query Paris {
  departement(code: "75") {
    nom
    communes {
      nom
      codePostal
      voieCount
    }
  }
}

query Commune {
  commune(id: "75101") {
    nom
    displayName
    departement {
      nom
    }
  }
}
`,
}
```

### 8. `apps/api/src/index.ts`

```typescript
import { createYoga } from "graphql-yoga";
import { createServer } from "node:http";
import { mergeTypeDefs, mergeResolvers } from "@graphql-tools/merge";
import { makeExecutableSchema } from "@graphql-tools/schema";

import { prisma } from "./lib/prisma.js";
import { isDev } from "./lib/isDev.js";
import { GRAPHIQL_CONFIG } from "./lib/graphiql.js";
import type { GraphQLContext } from "./generated/context.js";

// Schema
import { departementTypeDefs } from "./schema/departement.js";
import { communeTypeDefs } from "./schema/commune.js";
import { voieTypeDefs } from "./schema/voie.js";

// Resolvers
import { departementResolvers } from "./resolvers/departement.js";
import { communeResolvers } from "./resolvers/commune.js";
import { voieResolvers } from "./resolvers/voie.js";

const typeDefs = mergeTypeDefs([
  departementTypeDefs,
  communeTypeDefs,
  voieTypeDefs,
]);

const resolvers = mergeResolvers([
  departementResolvers,
  communeResolvers,
  voieResolvers,
]);

const schema = makeExecutableSchema({ typeDefs, resolvers });

const yoga = createYoga<GraphQLContext>({
  schema,
  context: () => ({ prisma }),
  graphiql: GRAPHIQL_CONFIG,
});

const server = createServer(yoga);
const port = process.env.PORT || 4000;

server.listen(port, () => {
  if (isDev) {
    console.log(`GraphQL API: http://localhost:${port}/graphql`);
  }
});
```

---

## Commandes à exécuter

```bash
# Générer les types TypeScript
npm run codegen -w api

# Lancer l'API
npm run dev:api
```

---

## Checkpoint

### Query 1 : Liste des départements

```graphql
query {
  departements {
    code
    nom
    displayName
    communeCount
  }
}
```

### Query 2 : Un département avec ses communes

```graphql
query {
  departement(code: "75") {
    nom
    displayName
    communeCount
    communes {
      id
      nom
      codePostal
      voieCount
    }
  }
}
```

### Query 3 : Une commune avec son département

```graphql
query {
  commune(id: "75101") {
    nom
    displayName
    departement {
      code
      nom
    }
    voies {
      id
      nom
    }
  }
}
```

---

## Comprendre les resolvers

### Structure d'un resolver

```typescript
export const departementResolvers: Resolvers = {
  // Resolvers pour Query (points d'entrée)
  Query: {
    departements: (parent, args, ctx, info) => { ... }
  },

  // Resolvers pour le type Departement
  Departement: {
    // Champs qui n'existent pas sur le model Prisma
    displayName: (parent) => `${parent.code} - ${parent.nom}`,

    // Relations
    communes: (parent, _args, ctx) => ctx.prisma.commune.findMany(...)
  },
}
```

### Les 4 arguments d'un resolver

| Argument | Description |
|----------|-------------|
| `parent` | L'objet parent (model Prisma grâce aux mappers) |
| `args` | Arguments passés à ce champ |
| `ctx` | Contexte (contient `prisma`) |
| `info` | Métadonnées GraphQL (rarement utilisé) |

### Champs automatiques vs calculés

```typescript
// parent contient { code: "75", nom: "Paris" } (du model Prisma)

// Pas besoin de resolver pour 'code' et 'nom' :
// GraphQL les résout automatiquement depuis parent

// Resolver nécessaire pour displayName (n'existe pas en DB) :
displayName: (parent) => `${parent.code} - ${parent.nom}`
```

---

## Bonnes pratiques

### 1. Typer les resolvers

```typescript
import type { Resolvers } from '../generated/graphql.js'

// Les types sont générés par codegen
export const departementResolvers: Resolvers = { ... }
```

### 2. Limiter les relations

```typescript
voies: (parent, _args, ctx) => {
  return ctx.prisma.voie.findMany({
    where: { communeId: parent.id },
    take: 100,  // Limite pour éviter de charger 6000 voies
    orderBy: { nom: 'asc' },
  })
}
```

### 3. Préfixer les arguments inutilisés

```typescript
// _parent, _args indiquent qu'ils ne sont pas utilisés
departements: (_parent, _args, ctx) => { ... }
```

---

## Prochaine étape

L'API GraphQL est prête ! On va maintenant la consommer depuis Nuxt.

→ [11-apollo-setup.md](./11-apollo-setup.md) : Configurer Apollo Client dans Nuxt
