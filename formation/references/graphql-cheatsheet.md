# GraphQL Cheatsheet

Reference rapide pour l'API GraphQL avec Yoga + Pothos + Prisma.

---

## Queries de base

### Lire une entite

```graphql
query {
  departement(code: "75") {
    code
    nom
  }
}
```

### Lire une liste

```graphql
query {
  departements {
    code
    nom
    communes {
      id
      nom
    }
  }
}
```

### Avec arguments

```graphql
query SearchVoies($search: String!, $first: Int!) {
  searchVoies(search: $search, first: $first) {
    edges {
      node {
        id
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

Variables :
```json
{
  "search": "rivoli",
  "first": 10
}
```

---

## Pagination Relay

### Structure

```graphql
{
  items(first: 10, after: "cursor123") {
    edges {
      cursor
      node {
        id
        name
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
  }
}
```

### Navigation

```graphql
# Page suivante
{ items(first: 10, after: "endCursor") { ... } }

# Page precedente
{ items(last: 10, before: "startCursor") { ... } }
```

---

## Pothos - Definir un type

### Type basique

```typescript
builder.prismaObject('Departement', {
  fields: (t) => ({
    code: t.exposeID('code'),
    nom: t.exposeString('nom')
  })
})
```

### Avec relations

```typescript
builder.prismaObject('Departement', {
  fields: (t) => ({
    code: t.exposeID('code'),
    nom: t.exposeString('nom'),

    // Relation 1-N
    communes: t.relation('communes')
  })
})
```

### Champ computed

```typescript
builder.prismaObject('Commune', {
  fields: (t) => ({
    id: t.exposeID('id'),
    nom: t.exposeString('nom'),

    // Champ calcule (pas dans la DB)
    displayName: t.string({
      resolve: (commune) => `${commune.nom} (${commune.codePostal})`
    })
  })
})
```

---

## Pothos - Definir une query

### Query simple

```typescript
builder.queryField('departement', (t) =>
  t.prismaField({
    type: 'Departement',
    nullable: true,
    args: {
      code: t.arg.string({ required: true })
    },
    resolve: (query, _parent, args) =>
      prisma.departement.findUnique({
        ...query,
        where: { code: args.code }
      })
  })
)
```

### Query liste

```typescript
builder.queryField('departements', (t) =>
  t.prismaField({
    type: ['Departement'],
    resolve: (query) =>
      prisma.departement.findMany({
        ...query,
        orderBy: { code: 'asc' }
      })
  })
)
```

### Query avec pagination Relay

```typescript
builder.queryField('searchVoies', (t) =>
  t.prismaConnection({
    type: 'Voie',
    cursor: 'id',
    args: {
      search: t.arg.string({ required: true })
    },
    resolve: (query, _parent, args) =>
      prisma.voie.findMany({
        ...query,
        where: {
          nom: {
            contains: args.search,
            mode: 'insensitive'
          }
        },
        orderBy: { nom: 'asc' }
      })
  })
)
```

---

## Pothos - Args

### Types d'args

```typescript
t.arg.string()           // String
t.arg.int()              // Int
t.arg.float()            // Float
t.arg.boolean()          // Boolean
t.arg.id()               // ID

// Requis
t.arg.string({ required: true })

// Avec defaut
t.arg.int({ defaultValue: 10 })

// Liste
t.arg.stringList()
```

### Input type

```typescript
const SearchInput = builder.inputType('SearchInput', {
  fields: (t) => ({
    query: t.string({ required: true }),
    limit: t.int({ defaultValue: 10 }),
    departements: t.stringList()
  })
})

builder.queryField('search', (t) =>
  t.field({
    type: ['Result'],
    args: {
      input: t.arg({ type: SearchInput, required: true })
    },
    resolve: (_parent, { input }) => {
      // input.query, input.limit, input.departements
    }
  })
)
```

---

## Prisma - Patterns courants

### FindMany avec filtres

```typescript
prisma.voie.findMany({
  where: {
    nom: { contains: 'rue', mode: 'insensitive' },
    communeId: '75101'
  },
  orderBy: { nom: 'asc' },
  take: 10
})
```

### FindUnique

```typescript
prisma.commune.findUnique({
  where: { id: '75101' }
})

// Ou plusieurs conditions uniques
prisma.commune.findFirst({
  where: {
    nom: 'Paris',
    departementCode: '75'
  }
})
```

### Include relations

```typescript
prisma.commune.findUnique({
  where: { id: '75101' },
  include: {
    departement: true,
    voies: {
      take: 10,
      orderBy: { nom: 'asc' }
    }
  }
})
```

### Select specifique

```typescript
prisma.commune.findMany({
  select: {
    id: true,
    nom: true,
    _count: {
      select: { voies: true }
    }
  }
})
```

---

## Full-text search PostgreSQL

### Dans le schema Prisma

```prisma
model Voie {
  id   String @id
  nom  String

  @@index([nom(ops: raw("gin_trgm_ops"))], type: Gin)
}
```

### Query avec search

```typescript
// Recherche basique
prisma.voie.findMany({
  where: {
    nom: { contains: 'rivoli', mode: 'insensitive' }
  }
})

// Recherche avec similarite (PostgreSQL)
prisma.$queryRaw`
  SELECT * FROM voies
  WHERE nom % ${search}
  ORDER BY similarity(nom, ${search}) DESC
  LIMIT 10
`
```

---

## Debug

### Logger Prisma

```typescript
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
})
```

### Voir le SQL genere

```typescript
const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' }
  ]
})

prisma.$on('query', (e) => {
  console.log('Query:', e.query)
  console.log('Duration:', e.duration, 'ms')
})
```

### GraphiQL

En dev, ouvrir `http://localhost:4000/graphql` pour l'explorateur interactif.

---

## Erreurs courantes

| Erreur | Cause | Solution |
|--------|-------|----------|
| `Cannot return null for non-nullable field` | Champ requis retourne null | Ajouter `nullable: true` ou verifier la data |
| `Unknown argument` | Arg pas declare | Ajouter dans `args: {}` |
| `Expected Iterable, but did not find one` | Type liste mais retourne objet | Verifier `type: ['X']` vs `type: 'X'` |
| N+1 queries | Relations sans optimization | Utiliser `...query` de Pothos |
