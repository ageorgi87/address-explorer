# API GraphQL - Adresse Explorer

API GraphQL pour explorer les adresses françaises (BAN).

## Stack

| Outil | Rôle |
|-------|------|
| GraphQL Yoga | Serveur GraphQL |
| Prisma | ORM / accès base de données |
| GraphQL Code Generator | Génération des types TypeScript |
| PostgreSQL | Base de données |

## Structure

```
src/
├── index.ts          # Point d'entrée du serveur
├── lib/
│   ├── prisma.ts     # Client Prisma (singleton)
│   ├── isDev.ts      # Constante isDev
│   └── graphiql.ts   # Config GraphiQL
├── schema/           # Définitions GraphQL (template strings TS)
│   ├── departement.ts
│   ├── commune.ts
│   └── voie.ts
├── resolvers/        # Implémentation des resolvers
│   ├── departement.ts
│   ├── commune.ts
│   └── voie.ts
└── generated/        # Fichiers générés (ne pas éditer)
    ├── context.ts    # Type du contexte GraphQL
    └── graphql.ts    # Types générés depuis les schemas
```

## Workflow de développement

### Ajouter/modifier un type GraphQL

1. Modifier le fichier `.ts` correspondant dans `src/schema/`
2. Regénérer les types : `npm run codegen`
3. Implémenter/adapter les resolvers dans `src/resolvers/`
4. TypeScript te guide : les erreurs indiquent ce qui manque

### Ajouter un nouveau type

1. Créer `src/schema/montype.ts` avec `export const montypeTypeDefs = /* GraphQL */ \`...\``
2. Créer `src/resolvers/montype.ts`
3. Importer dans `src/index.ts`
4. `npm run codegen`

## Scripts

```bash
# Développement (hot reload)
npm run dev

# Générer les types TypeScript
npm run codegen

# Build production
npm run build
```

## Scripts Prisma

```bash
# Générer le client Prisma
npm run db:generate

# Créer une migration
npm run db:migrate

# Ouvrir Prisma Studio (GUI)
npm run db:studio
```

## Architecture Schema-First

Le schema GraphQL (dans `src/schema/*.ts`) est la **source de vérité**.

```
schema/*.ts  →  codegen  →  generated/graphql.ts  →  resolvers/*.ts
     ↑                                                      ↓
 Tu écris ici                                        TypeScript te guide
```

### Pourquoi schema-first ?

- Le schema est lisible (SDL standard)
- Imports explicites (pas de glob)
- Types TypeScript générés automatiquement
- Mappers Prisma pour lier GraphQL aux types DB

## Configuration

### codegen.ts

```typescript
const config: CodegenConfig = {
  schema: 'src/schema/*.ts',
  generates: {
    'src/generated/graphql.ts': {
      plugins: ['typescript', 'typescript-resolvers'],
      config: {
        mappers: {
          Departement: '@prisma/client#Departement as DepartementModel',
          Commune: '@prisma/client#Commune as CommuneModel',
          Voie: '@prisma/client#Voie as VoieModel',
        },
        contextType: './context.js#GraphQLContext',
      },
    },
  },
}
```

### Variables d'environnement

```env
DATABASE_URL=postgresql://...
PORT=4000
NODE_ENV=development
```
