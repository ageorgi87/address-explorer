# Step 11 : Queries et pagination Relay

> **Commit** : `step-11-graphql-queries`
> **Durée** : ~40 min
> **Prérequis** : Step 10 complété

---

## Objectif

Ajouter les types Voie et Numero, et implémenter une recherche paginée.

À la fin de ce step :
- Tous les types sont exposés (Departement, Commune, Voie, Numero)
- Une query de recherche avec pagination Relay fonctionne
- Tu comprends la différence entre offset et cursor pagination

---

## Pourquoi la pagination ?

### Le problème sans pagination

```graphql
query {
  voies {
    nom
  }
}
```

Avec 2.5 millions de voies en France, cette query :
1. Chargerait 2.5M de lignes en mémoire
2. Générerait une réponse JSON de ~500MB
3. Prendrait plusieurs minutes
4. Probablement crasherait

**On a besoin de pagination.**

---

## Offset vs Cursor : Comparaison

### Pagination Offset (classique)

```
GET /api/voies?page=2&limit=10
```

```sql
SELECT * FROM voies ORDER BY nom LIMIT 10 OFFSET 10;
```

| Avantages | Inconvénients |
|-----------|---------------|
| Simple à comprendre | Instable si insertion/suppression |
| "Page 5 sur 100" facile | Lent sur grandes tables (OFFSET coûteux) |
| Navigation directe à page X | Doublons possibles entre pages |

**Exemple de problème :**
```
Page 1 : [A, B, C, D, E]   ← Tu lis cette page
                            ← Quelqu'un supprime "B"
Page 2 : [E, F, G, H, I]   ← "E" apparaît deux fois !
```

### Pagination Cursor (Relay)

```graphql
{
  voies(first: 10, after: "cursor_xxx") {
    edges { node { nom } }
    pageInfo { hasNextPage, endCursor }
  }
}
```

```sql
SELECT * FROM voies WHERE id > 'cursor_xxx' ORDER BY nom LIMIT 10;
```

| Avantages | Inconvénients |
|-----------|---------------|
| Stable (pas de doublons) | Pas de "page 5 sur 100" |
| Très performant (index) | Plus complexe côté client |
| Fonctionne avec temps réel | Navigation directe impossible |

**Le même exemple :**
```
Page 1 : [A, B, C, D, E]   cursor = "E"
                            ← Quelqu'un supprime "B"
Page 2 (after "E") : [F, G, H, I, J]   ← Correct !
```

### Pourquoi choisir Relay

Pour notre cas (recherche d'adresses) :
- On a 26 millions d'entrées
- Les données changent (mises à jour quotidiennes)
- On ne veut pas de "page 5 sur 2.6M"
- On veut une pagination infinie fluide

**Choix : Pagination Relay (cursor-based)**

---

## Structure d'une réponse Relay

```graphql
{
  searchVoies(query: "rivoli", first: 5) {
    edges {
      cursor             # Identifiant opaque pour paginer
      node {             # L'item lui-même
        id
        nom
      }
    }
    pageInfo {
      hasNextPage        # Y a-t-il une page suivante ?
      hasPreviousPage    # Y a-t-il une page précédente ?
      startCursor        # Premier cursor de cette page
      endCursor          # Dernier cursor (pour "after")
    }
    totalCount           # (optionnel) Nombre total de résultats
  }
}
```

### Navigation

```graphql
# Page suivante
{ voies(first: 10, after: "endCursor") { ... } }

# Page précédente
{ voies(last: 10, before: "startCursor") { ... } }
```

---

## Les fichiers à créer

### 1. `apps/api/src/schema/voie.ts`

```typescript
/**
 * Type GraphQL : Voie
 *
 * Représente une voie (rue, avenue, boulevard...).
 * ~2.5 millions de voies en France.
 */

import { builder } from '../builder.js'

builder.prismaObject('Voie', {
  description: 'Une voie (rue, avenue, boulevard, etc.)',

  fields: (t) => ({
    // ============================================================
    // CHAMPS SCALAIRES
    // ============================================================

    // ID unique (code FANTOIR : commune + numéro de voie)
    id: t.exposeID('id', {
      description: 'ID unique de la voie (ex: 75101_0123)',
    }),

    // Nom de la voie
    nom: t.exposeString('nom', {
      description: 'Nom de la voie (ex: Rue de Rivoli)',
    }),

    // ============================================================
    // RELATIONS
    // ============================================================

    // Relation vers la commune parente
    commune: t.relation('commune', {
      description: 'Commune où se trouve cette voie',
    }),

    // Relation vers les numéros de cette voie
    // ATTENTION : Peut contenir des milliers de numéros !
    numeros: t.relation('numeros', {
      description: 'Numéros de cette voie',
      query: () => ({
        take: 100,  // Limite par défaut
        orderBy: [
          { numero: 'asc' as const },
        ],
      }),
    }),

    // ============================================================
    // CHAMPS CALCULÉS
    // ============================================================

    // Nombre de numéros dans cette voie
    numeroCount: t.int({
      description: 'Nombre de numéros dans cette voie',
      resolve: async (voie, _args, ctx) => {
        return ctx.prisma.numero.count({
          where: { voieId: voie.id },
        })
      },
    }),

    // Adresse formatée avec commune
    fullAddress: t.string({
      description: 'Nom complet avec commune (ex: Rue de Rivoli, Paris 1er)',
      resolve: async (voie, _args, ctx) => {
        const commune = await ctx.prisma.commune.findUnique({
          where: { id: voie.communeId },
          select: { nom: true },
        })
        return `${voie.nom}, ${commune?.nom ?? 'Commune inconnue'}`
      },
    }),
  }),
})
```

### 2. `apps/api/src/schema/numero.ts`

```typescript
/**
 * Type GraphQL : Numero
 *
 * Représente un numéro d'adresse avec ses coordonnées GPS.
 * ~26 millions de numéros en France.
 */

import { builder } from '../builder.js'

builder.prismaObject('Numero', {
  description: 'Un numéro d\'adresse avec coordonnées GPS',

  fields: (t) => ({
    // ============================================================
    // CHAMPS SCALAIRES
    // ============================================================

    id: t.exposeID('id', {
      description: 'ID unique du numéro (ex: 75101_0123_00001)',
    }),

    numero: t.exposeString('numero', {
      description: 'Le numéro lui-même (ex: "1", "42", "100")',
    }),

    // Suffixe optionnel (bis, ter, A, B...)
    suffixe: t.exposeString('suffixe', {
      nullable: true,  // Peut être null
      description: 'Suffixe optionnel (bis, ter, A, B...)',
    }),

    // Coordonnées GPS
    lat: t.exposeFloat('lat', {
      description: 'Latitude (ex: 48.856614)',
    }),

    lon: t.exposeFloat('lon', {
      description: 'Longitude (ex: 2.352222)',
    }),

    // ============================================================
    // RELATIONS
    // ============================================================

    voie: t.relation('voie', {
      description: 'Voie à laquelle appartient ce numéro',
    }),

    // ============================================================
    // CHAMPS CALCULÉS
    // ============================================================

    // Numéro formaté avec suffixe
    displayNumero: t.string({
      description: 'Numéro formaté (ex: "1 bis", "42")',
      resolve: (numero) => {
        return numero.suffixe
          ? `${numero.numero} ${numero.suffixe}`
          : numero.numero
      },
    }),

    // Adresse complète
    fullAddress: t.string({
      description: 'Adresse complète (ex: "1 bis Rue de Rivoli")',
      resolve: async (numero, _args, ctx) => {
        const voie = await ctx.prisma.voie.findUnique({
          where: { id: numero.voieId },
          select: { nom: true },
        })
        const num = numero.suffixe
          ? `${numero.numero} ${numero.suffixe}`
          : numero.numero
        return `${num} ${voie?.nom ?? 'Voie inconnue'}`
      },
    }),

    // URL Google Maps
    googleMapsUrl: t.string({
      description: 'Lien Google Maps vers cette adresse',
      resolve: (numero) => {
        return `https://www.google.com/maps?q=${numero.lat},${numero.lon}`
      },
    }),
  }),
})
```

### 3. Mettre à jour `apps/api/src/schema/index.ts`

```typescript
/**
 * Point d'entrée du schéma GraphQL
 *
 * Importe tous les types et définit les queries.
 */

import { builder } from '../builder.js'

// ============================================================
// IMPORT DE TOUS LES TYPES
// ============================================================

import './departement.js'
import './commune.js'
import './voie.js'    // NOUVEAU
import './numero.js'  // NOUVEAU

// ============================================================
// QUERIES EXISTANTES
// ============================================================

builder.queryField('departements', (t) =>
  t.prismaField({
    type: ['Departement'],
    description: 'Liste de tous les départements',
    resolve: (query, _root, _args, ctx) =>
      ctx.prisma.departement.findMany({
        ...query,
        orderBy: { code: 'asc' },
      }),
  })
)

builder.queryField('departement', (t) =>
  t.prismaField({
    type: 'Departement',
    nullable: true,
    description: 'Un département par son code',
    args: {
      code: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.departement.findUnique({
        ...query,
        where: { code: args.code },
      }),
  })
)

builder.queryField('commune', (t) =>
  t.prismaField({
    type: 'Commune',
    nullable: true,
    description: 'Une commune par son code INSEE',
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.commune.findUnique({
        ...query,
        where: { id: args.id },
      }),
  })
)

// ============================================================
// NOUVELLES QUERIES
// ============================================================

// --- Une voie par ID ---
builder.queryField('voie', (t) =>
  t.prismaField({
    type: 'Voie',
    nullable: true,
    description: 'Une voie par son ID FANTOIR',
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.voie.findUnique({
        ...query,
        where: { id: args.id },
      }),
  })
)

// ============================================================
// RECHERCHE AVEC PAGINATION RELAY
// ============================================================
// prismaConnection() crée automatiquement :
// - Les arguments first, after, last, before
// - La structure edges/pageInfo
// - Les cursors
// ============================================================

builder.queryField('searchVoies', (t) =>
  t.prismaConnection({
    type: 'Voie',
    cursor: 'id',  // Champ utilisé pour le cursor (doit être unique)
    description: 'Recherche de voies par nom (pagination Relay)',

    args: {
      query: t.arg.string({
        required: true,
        description: 'Terme de recherche (ex: "rivoli")',
      }),
      departement: t.arg.string({
        required: false,
        description: 'Filtrer par code département (ex: "75")',
      }),
    },

    // totalCount permet d'afficher "1234 résultats"
    totalCount: async (_connection, args, ctx) => {
      return ctx.prisma.voie.count({
        where: buildVoieWhere(args),
      })
    },

    resolve: async (query, _root, args, ctx) => {
      return ctx.prisma.voie.findMany({
        ...query,  // Contient take, cursor, skip générés par Pothos
        where: buildVoieWhere(args),
        orderBy: { nom: 'asc' },
      })
    },
  })
)

// Helper pour construire la clause WHERE
function buildVoieWhere(args: { query: string; departement?: string | null }) {
  return {
    nom: {
      contains: args.query,
      mode: 'insensitive' as const,
    },
    // Filtre optionnel par département
    ...(args.departement && {
      commune: {
        departementCode: args.departement,
      },
    }),
  }
}

// ============================================================
// RECHERCHE DE COMMUNES (AUSSI PAGINÉE)
// ============================================================

builder.queryField('searchCommunes', (t) =>
  t.prismaConnection({
    type: 'Commune',
    cursor: 'id',
    description: 'Recherche de communes par nom',

    args: {
      query: t.arg.string({ required: true }),
    },

    totalCount: async (_connection, args, ctx) => {
      return ctx.prisma.commune.count({
        where: {
          nom: { contains: args.query, mode: 'insensitive' },
        },
      })
    },

    resolve: async (query, _root, args, ctx) => {
      return ctx.prisma.commune.findMany({
        ...query,
        where: {
          nom: { contains: args.query, mode: 'insensitive' },
        },
        orderBy: { nom: 'asc' },
      })
    },
  })
)

// ============================================================
// EXPORT DU SCHEMA
// ============================================================

export const schema = builder.toSchema()
```

---

## Commandes à exécuter

```bash
# (Créer les nouveaux fichiers voie.ts et numero.ts)

# Relancer l'API
npm run dev:api
```

---

## Checkpoint ✓

### Query 1 : Recherche simple

```graphql
query {
  searchVoies(query: "rivoli", first: 5) {
    totalCount
    edges {
      cursor
      node {
        id
        nom
        fullAddress
        commune {
          nom
          codePostal
        }
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }
}
```

**Résultat attendu :**
```json
{
  "data": {
    "searchVoies": {
      "totalCount": 3,
      "edges": [
        {
          "cursor": "Voie:75101_xxxx",
          "node": {
            "id": "75101_xxxx",
            "nom": "Rue de Rivoli",
            "fullAddress": "Rue de Rivoli, Paris 1er Arrondissement",
            "commune": {
              "nom": "Paris 1er Arrondissement",
              "codePostal": "75001"
            }
          }
        }
      ],
      "pageInfo": {
        "hasNextPage": false,
        "hasPreviousPage": false,
        "startCursor": "Voie:75101_xxxx",
        "endCursor": "Voie:75104_yyyy"
      }
    }
  }
}
```

### Query 2 : Page suivante

Utilise `endCursor` de la réponse précédente :

```graphql
query {
  searchVoies(query: "rue", first: 10, after: "Voie:75101_xxxx") {
    edges {
      node {
        nom
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

### Query 3 : Détail d'une voie avec ses numéros

```graphql
query {
  voie(id: "75101_0123") {
    nom
    numeroCount
    commune {
      nom
    }
    numeros {
      displayNumero
      lat
      lon
      googleMapsUrl
    }
  }
}
```

### Query 4 : Recherche avec filtre département

```graphql
query {
  searchVoies(query: "avenue", first: 10, departement: "75") {
    totalCount
    edges {
      node {
        nom
        commune {
          nom
        }
      }
    }
  }
}
```

---

## Comprendre `prismaConnection()`

```typescript
builder.queryField('searchVoies', (t) =>
  t.prismaConnection({
    type: 'Voie',
    cursor: 'id',

    resolve: async (query, _root, args, ctx) => {
      return ctx.prisma.voie.findMany({
        ...query,  // ← Contient take, cursor, skip
        where: { ... },
        orderBy: { nom: 'asc' },
      })
    },
  })
)
```

### Ce que fait Pothos automatiquement

1. **Ajoute les arguments** : `first`, `after`, `last`, `before`
2. **Transforme le résultat** en format `edges`/`pageInfo`
3. **Génère les cursors** à partir du champ spécifié (`id`)
4. **Calcule `hasNextPage`/`hasPreviousPage`**

### Le paramètre `query`

```typescript
// Ce que contient `query` quand tu fais searchVoies(first: 10, after: "xxx")
{
  take: 11,        // first + 1 (pour savoir s'il y a une page suivante)
  cursor: { id: "xxx" },
  skip: 1,         // Sauter le cursor lui-même
  // + select/include pour les relations demandées
}
```

### Le paramètre `cursor`

```typescript
cursor: 'id'  // Le champ utilisé pour paginer
```

Ce champ doit être :
- **Unique** (sinon doublons possibles)
- **Ordonnable** (sinon ordre incohérent)
- **Stable** (ne change pas dans le temps)

L'`id` est parfait. Évite les champs comme `createdAt` (deux items pourraient avoir la même valeur).

---

## Pièges courants

| Problème | Cause | Solution |
|----------|-------|----------|
| `edges` vide | Pas de données matching | Vérifier les données importées |
| `cursor` invalide | Format incorrect | Le cursor doit être exactement celui retourné |
| Pagination ne marche pas | `...query` oublié | Spreader `query` dans findMany |
| Ordre incohérent | Pas de `orderBy` | Toujours ajouter un `orderBy` stable |
| `totalCount` lent | Pas d'index | Vérifier les index PostgreSQL |

---

## Performance : Index pour la recherche

Notre recherche utilise `contains` (LIKE '%xxx%'). Pour être performant sur 2.5M de lignes, on a besoin de l'index trigramme créé au Step 07.

Vérifier qu'il existe :
```sql
SELECT indexname FROM pg_indexes WHERE tablename = 'voies' AND indexname LIKE '%trgm%';
```

Si manquant :
```bash
cd apps/api
npx prisma db execute --file prisma/fts-indexes.sql
```

---

## Voir le schéma GraphQL généré

Pour debug, tu peux imprimer le schéma SDL :

```typescript
// Dans index.ts (temporairement)
import { printSchema } from 'graphql'
console.log(printSchema(schema))
```

Tu verras tous les types générés, y compris ceux de Relay :
```graphql
type VoieConnection {
  edges: [VoieEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type VoieEdge {
  cursor: String!
  node: Voie!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}
```

---

## Résumé de ce qu'on a construit

| Type | Description | Queries |
|------|-------------|---------|
| Departement | 101 départements | `departements`, `departement(code)` |
| Commune | ~35k communes | `commune(id)`, `searchCommunes` |
| Voie | ~2.5M voies | `voie(id)`, `searchVoies` |
| Numero | ~26M numéros | (via relation voie) |

---

## Prochaine étape

L'API est prête ! Il est temps de la consommer depuis Nuxt.

→ [12-apollo-setup.md](./12-apollo-setup.md) : Configurer Apollo Client dans Nuxt
