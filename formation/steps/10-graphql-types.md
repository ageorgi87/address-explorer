# Step 10 : Premiers types GraphQL

> **Commit** : `step-10-graphql-types`
> **Durée** : ~30 min
> **Prérequis** : Step 09 complété

---

## Objectif

Exposer les types `Departement` et `Commune` en GraphQL avec leurs relations.

À la fin de ce step :
- Les types GraphQL correspondent aux modèles Prisma
- Les relations sont navigables dans les deux sens
- Tu comprends le pattern Pothos/Prisma

---

## Comment Pothos expose Prisma

### Le flux de données

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  schema.prisma  │────▶│  prismaObject()  │────▶│  Type GraphQL   │
│                 │     │                  │     │                 │
│  model Dept {   │     │  builder.prisma  │     │  type Dept {    │
│    code String  │────▶│    Object(...)   │────▶│    code: ID!    │
│    communes []  │     │                  │     │    communes:... │
│  }              │     │                  │     │  }              │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### Ce que fait `prismaObject()`

```typescript
builder.prismaObject('Departement', {
  fields: (t) => ({
    code: t.exposeID('code'),        // Expose le champ Prisma 'code' comme ID
    nom: t.exposeString('nom'),      // Expose le champ Prisma 'nom' comme String
    communes: t.relation('communes'), // Expose la relation Prisma 'communes'
  }),
})
```

**Résultat GraphQL :**
```graphql
type Departement {
  code: ID!
  nom: String!
  communes: [Commune!]!
}
```

### Pourquoi pas mapper directement tous les champs ?

On pourrait exposer automatiquement tous les champs Prisma. Mais **on ne le fait pas** car :

| Exposition automatique | Exposition explicite (notre choix) |
|------------------------|-----------------------------------|
| Rapide à écrire | Plus de code |
| Expose tout par défaut | Contrôle total |
| Risque de fuites (passwords, etc.) | Sécurisé par défaut |
| Difficile à maintenir | Intention claire |
| Pas de champs calculés | Facile d'ajouter des computed |

**Principe** : Exposer explicitement chaque champ, même si c'est répétitif. C'est une forme de documentation.

---

## Structure de fichiers recommandée

```
apps/api/src/
├── builder.ts          # Configuration Pothos (déjà créé)
├── db.ts               # Client Prisma (déjà créé)
├── index.ts            # Point d'entrée serveur
└── schema/             # NOUVEAU : Types GraphQL
    ├── index.ts        # Agrège tout + queries
    ├── departement.ts  # Type Departement
    ├── commune.ts      # Type Commune
    ├── voie.ts         # (prochain step)
    └── numero.ts       # (prochain step)
```

**Pourquoi cette structure ?**
- Un fichier par type = facile à naviguer
- `schema/index.ts` centralise l'export du schema
- Évite les gros fichiers monolithiques

---

## Les fichiers à créer

### 1. `apps/api/src/schema/departement.ts`

```typescript
/**
 * Type GraphQL : Departement
 *
 * Représente un département français (101 au total).
 * Expose les champs du model Prisma + relations.
 */

import { builder } from '../builder.js'

// ============================================================
// TYPE DEPARTEMENT
// ============================================================
// builder.prismaObject() crée un type GraphQL à partir d'un model Prisma.
// Le premier argument doit correspondre EXACTEMENT au nom du model.
// ============================================================

builder.prismaObject('Departement', {
  // Description visible dans GraphiQL
  description: 'Un département français',

  fields: (t) => ({
    // ============================================================
    // CHAMPS SCALAIRES
    // ============================================================
    // t.exposeXxx() mappe directement un champ Prisma.
    // TypeScript vérifie que le champ existe et correspond au type.
    // ============================================================

    // Le code est l'identifiant naturel (ex: "75", "13", "2A")
    // On l'expose comme ID GraphQL (bien qu'il soit String en Prisma)
    code: t.exposeID('code', {
      description: 'Code du département (ex: 75 pour Paris)',
    }),

    // Le nom complet du département
    nom: t.exposeString('nom', {
      description: 'Nom du département (ex: Paris)',
    }),

    // ============================================================
    // RELATIONS
    // ============================================================
    // t.relation() expose une relation Prisma.
    // Pothos sait automatiquement :
    // - Le type de retour ([Commune] car hasMany)
    // - Comment résoudre la relation (via Prisma)
    // ============================================================

    communes: t.relation('communes', {
      description: 'Liste des communes du département',
      // On pourrait ajouter des arguments ou trier ici :
      // args: { limit: t.arg.int({ defaultValue: 100 }) },
      // query: (args) => ({ take: args.limit, orderBy: { nom: 'asc' } }),
    }),

    // ============================================================
    // CHAMPS CALCULÉS (exemples)
    // ============================================================
    // Champs qui n'existent pas en base mais sont calculés à la volée.
    // Utiles pour agréger, formater, ou enrichir les données.
    // ============================================================

    // Nombre de communes (sans charger toutes les communes)
    communeCount: t.int({
      description: 'Nombre de communes dans ce département',
      resolve: async (departement, _args, ctx) => {
        // count() est plus efficace que findMany().length
        return ctx.prisma.commune.count({
          where: { departementCode: departement.code },
        })
      },
    }),

    // Nom formaté pour l'affichage
    displayName: t.string({
      description: 'Nom formaté (ex: "75 - Paris")',
      resolve: (departement) => `${departement.code} - ${departement.nom}`,
    }),
  }),
})
```

### 2. `apps/api/src/schema/commune.ts`

```typescript
/**
 * Type GraphQL : Commune
 *
 * Représente une commune française (~35 000 au total).
 * Inclut la relation vers le département parent.
 */

import { builder } from '../builder.js'

builder.prismaObject('Commune', {
  description: 'Une commune française',

  fields: (t) => ({
    // ============================================================
    // CHAMPS SCALAIRES
    // ============================================================

    // Code INSEE (identifiant unique national)
    id: t.exposeID('id', {
      description: 'Code INSEE de la commune (ex: 75101)',
    }),

    // Nom de la commune
    nom: t.exposeString('nom', {
      description: 'Nom de la commune (ex: Paris 1er Arrondissement)',
    }),

    // Code postal (pour l'affichage, pas pour l'identification)
    codePostal: t.exposeString('codePostal', {
      description: 'Code postal (ex: 75001)',
    }),

    // ============================================================
    // RELATION VERS LE PARENT
    // ============================================================
    // Relation inverse : chaque commune appartient à un département.
    // C'est une relation "belongsTo" en termes ORM classiques.
    // ============================================================

    departement: t.relation('departement', {
      description: 'Département de cette commune',
    }),

    // Code du département (sans charger la relation)
    // Utile pour éviter une jointure quand on veut juste le code
    departementCode: t.exposeString('departementCode', {
      description: 'Code du département (ex: 75)',
    }),

    // ============================================================
    // RELATION VERS LES ENFANTS
    // ============================================================
    // On expose aussi la relation vers les voies.
    // Attention : une commune peut avoir des milliers de voies !
    // On limitera par défaut.
    // ============================================================

    voies: t.relation('voies', {
      description: 'Voies de cette commune',
      // Limite par défaut pour éviter de charger 6000 voies
      query: () => ({
        take: 100,
        orderBy: { nom: 'asc' as const },
      }),
    }),

    // ============================================================
    // CHAMPS CALCULÉS
    // ============================================================

    voieCount: t.int({
      description: 'Nombre de voies dans cette commune',
      resolve: async (commune, _args, ctx) => {
        return ctx.prisma.voie.count({
          where: { communeId: commune.id },
        })
      },
    }),

    // Adresse complète formatée
    displayName: t.string({
      description: 'Nom formaté avec code postal (ex: "Paris 1er - 75001")',
      resolve: (commune) => `${commune.nom} - ${commune.codePostal}`,
    }),
  }),
})
```

### 3. `apps/api/src/schema/index.ts`

```typescript
/**
 * Point d'entrée du schéma GraphQL
 *
 * Ce fichier :
 * 1. Importe tous les types (pour qu'ils soient enregistrés)
 * 2. Définit les queries racine
 * 3. Exporte le schéma final
 */

import { builder } from '../builder.js'

// ============================================================
// IMPORT DES TYPES
// ============================================================
// L'ordre n'a pas d'importance - Pothos résout les dépendances.
// L'import a pour seul effet d'exécuter le code (enregistrer les types).
// ============================================================

import './departement.js'
import './commune.js'

// ============================================================
// QUERIES
// ============================================================
// Chaque query est un point d'entrée de l'API.
// Équivalent des endpoints REST.
// ============================================================

// --- Tous les départements ---
builder.queryField('departements', (t) =>
  t.prismaField({
    type: ['Departement'],  // Retourne un tableau
    description: 'Liste de tous les départements',

    resolve: (query, _root, _args, ctx) =>
      ctx.prisma.departement.findMany({
        // IMPORTANT : ...query propage les optimisations Pothos
        // Il contient les select/include nécessaires pour les relations demandées
        ...query,
        orderBy: { code: 'asc' },
      }),
  })
)

// --- Un département par code ---
builder.queryField('departement', (t) =>
  t.prismaField({
    type: 'Departement',
    nullable: true,  // Peut ne pas exister
    description: 'Un département par son code',

    args: {
      code: t.arg.string({
        required: true,
        description: 'Code du département (ex: 75)',
      }),
    },

    resolve: (query, _root, args, ctx) =>
      ctx.prisma.departement.findUnique({
        ...query,
        where: { code: args.code },
      }),
  })
)

// --- Une commune par ID (code INSEE) ---
builder.queryField('commune', (t) =>
  t.prismaField({
    type: 'Commune',
    nullable: true,
    description: 'Une commune par son code INSEE',

    args: {
      id: t.arg.string({
        required: true,
        description: 'Code INSEE de la commune (ex: 75101)',
      }),
    },

    resolve: (query, _root, args, ctx) =>
      ctx.prisma.commune.findUnique({
        ...query,
        where: { id: args.id },
      }),
  })
)

// --- Communes d'un département ---
builder.queryField('communesByDepartement', (t) =>
  t.prismaField({
    type: ['Commune'],
    description: 'Toutes les communes d\'un département',

    args: {
      departementCode: t.arg.string({
        required: true,
        description: 'Code du département',
      }),
    },

    resolve: (query, _root, args, ctx) =>
      ctx.prisma.commune.findMany({
        ...query,
        where: { departementCode: args.departementCode },
        orderBy: { nom: 'asc' },
      }),
  })
)

// ============================================================
// EXPORT DU SCHEMA
// ============================================================
// builder.toSchema() compile tous les types en un schéma GraphQL.
// À ce moment, toutes les validations TypeScript sont vérifiées.
// ============================================================

export const schema = builder.toSchema()
```

### 4. Simplifier `apps/api/src/index.ts`

```typescript
/**
 * Point d'entrée du serveur
 *
 * Maintenant simplifié : le schéma est défini dans schema/
 */

import { createYoga } from 'graphql-yoga'
import { createServer } from 'node:http'

// Importe le schéma compilé
import { schema } from './schema/index.js'
import { prisma } from './db.js'

const yoga = createYoga({
  schema,

  context: () => ({ prisma }),

  graphiql: {
    title: 'Adresse Explorer API',
    defaultQuery: `# Explore l'API !

# Tous les départements avec leurs communes
query DepartementsAvecCommunes {
  departements {
    code
    nom
    communeCount
    communes {
      id
      nom
      codePostal
    }
  }
}

# Un département spécifique
query Paris {
  departement(code: "75") {
    code
    nom
    displayName
    communes {
      nom
      codePostal
      voieCount
    }
  }
}

# Une commune par son code INSEE
query ParisFirst {
  commune(id: "75101") {
    nom
    codePostal
    departement {
      nom
    }
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
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 API GraphQL démarrée !                               ║
║                                                            ║
║   GraphiQL : http://localhost:${PORT}/graphql                ║
║                                                            ║
║   Types disponibles :                                      ║
║   - Departement (avec communes)                           ║
║   - Commune (avec departement)                            ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`)
})
```

---

## Commandes à exécuter

```bash
# Créer le dossier schema
mkdir -p apps/api/src/schema

# (Créer les fichiers ci-dessus)

# Relancer l'API
npm run dev:api
```

---

## Checkpoint ✓

### Query 1 : Liste des départements avec communes

```graphql
query {
  departements {
    code
    nom
    displayName
    communeCount
    communes {
      id
      nom
      codePostal
    }
  }
}
```

**Résultat attendu :**
```json
{
  "data": {
    "departements": [
      {
        "code": "75",
        "nom": "Paris",
        "displayName": "75 - Paris",
        "communeCount": 21,
        "communes": [
          { "id": "75101", "nom": "Paris 1er Arrondissement", "codePostal": "75001" },
          { "id": "75102", "nom": "Paris 2e Arrondissement", "codePostal": "75002" }
        ]
      }
    ]
  }
}
```

### Query 2 : Une commune avec son département

```graphql
query {
  commune(id: "75101") {
    nom
    codePostal
    displayName
    voieCount
    departement {
      code
      nom
    }
  }
}
```

**Résultat attendu :**
```json
{
  "data": {
    "commune": {
      "nom": "Paris 1er Arrondissement",
      "codePostal": "75001",
      "displayName": "Paris 1er Arrondissement - 75001",
      "voieCount": 312,
      "departement": {
        "code": "75",
        "nom": "Paris"
      }
    }
  }
}
```

### Query 3 : Naviguer dans les deux sens

```graphql
query {
  departement(code: "75") {
    nom
    communes {
      nom
      departement {
        nom
      }
    }
  }
}
```

La navigation `departement → communes → departement` fonctionne !

---

## Comprendre le code en détail

### `t.exposeXxx()` vs `t.xxx()`

```typescript
// exposeString : Mappe directement un champ Prisma existant
nom: t.exposeString('nom')
// GraphQL: nom: String!  (non-null car le champ Prisma l'est)

// string : Champ calculé, tu fournis le resolver
fullName: t.string({
  resolve: (parent) => `${parent.firstName} ${parent.lastName}`
})
// GraphQL: fullName: String!
```

### `t.relation()` : La magie des relations

```typescript
// Pothos sait que 'communes' est une relation hasMany dans Prisma
communes: t.relation('communes')
// GraphQL: communes: [Commune!]!

// Équivalent manuel (si on devait le faire sans le plugin) :
communes: t.field({
  type: ['Commune'],
  resolve: async (departement, _args, ctx) =>
    ctx.prisma.commune.findMany({
      where: { departementCode: departement.code }
    })
})
```

Avec `t.relation()`, Pothos :
1. Infère le type de retour
2. Optimise les requêtes (batching, DataLoader)
3. Évite les erreurs de typo

### Le paramètre `query` : Éviter le N+1

```typescript
resolve: (query, _root, _args, ctx) =>
  ctx.prisma.departement.findMany({
    ...query,  // ← CRUCIAL !
    orderBy: { code: 'asc' },
  })
```

**Sans `...query` :**
```sql
-- 1 requête pour les départements
SELECT * FROM departements;
-- N requêtes pour les communes (N+1 problem)
SELECT * FROM communes WHERE departement_code = '75';
SELECT * FROM communes WHERE departement_code = '13';
...
```

**Avec `...query` :**
```sql
-- 1 seule requête optimisée
SELECT d.*, c.*
FROM departements d
LEFT JOIN communes c ON c.departement_code = d.code
ORDER BY d.code;
```

Pothos analyse la query GraphQL demandée et génère les `include` nécessaires.

---

## Pièges courants

| Problème | Cause | Solution |
|----------|-------|----------|
| `Unknown type "Departement"` | Fichier pas importé | Ajouter `import './departement.js'` |
| Relation retourne `null` | Mauvais nom de relation | Vérifier `schema.prisma` |
| N+1 queries visibles | `...query` oublié | Toujours spreader `query` |
| Type mismatch | Champ pas dans le model | Vérifier Prisma types |
| `Cannot return null` | Champ non-null mais data null | Ajouter `nullable: true` |

---

## Bonnes pratiques

### 1. Toujours ajouter des descriptions

```typescript
builder.prismaObject('Departement', {
  description: 'Un département français',
  fields: (t) => ({
    code: t.exposeID('code', {
      description: 'Code du département (ex: 75)',
    }),
  }),
})
```

Ces descriptions apparaissent dans GraphiQL et servent de documentation.

### 2. Limiter les relations "hasMany"

```typescript
voies: t.relation('voies', {
  query: () => ({
    take: 100,  // Ne pas charger 6000 voies par défaut
    orderBy: { nom: 'asc' as const },
  }),
})
```

### 3. Préférer les champs calculés aux jointures

```typescript
// Bien : Une seule requête COUNT
voieCount: t.int({
  resolve: (commune, _args, ctx) =>
    ctx.prisma.voie.count({ where: { communeId: commune.id } })
})

// Moins bien : Charge toutes les voies juste pour compter
voieCount: t.int({
  resolve: async (commune) => commune.voies.length
})
```

---

## Ce qu'on a construit

| Avant (Step 09) | Après (Step 10) |
|-----------------|-----------------|
| Queries de test (`hello`) | Types réels (`Departement`, `Commune`) |
| Pas de données | Données BAN exposées |
| Pas de relations | Navigation bidirectionnelle |
| Fichier unique | Structure modulaire |

---

## Prochaine étape

On a les types de base. Maintenant, ajoutons les voies et numéros avec une vraie recherche paginée.

→ [11-graphql-queries.md](./11-graphql-queries.md) : Voies, Numéros, et pagination Relay
