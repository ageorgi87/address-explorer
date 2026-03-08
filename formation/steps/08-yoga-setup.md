# Step 08 : Setup GraphQL Yoga

> **Commit** : `step-08-yoga-setup`
> **Durée** : ~20 min
> **Prérequis** : Step 07 complété

---

## Objectif

Avoir un serveur GraphQL fonctionnel sur `http://localhost:4000/graphql`.

À la fin de ce step :
- L'API répond aux requêtes GraphQL
- GraphiQL (IDE interactif) est accessible dans le navigateur
- Tu comprends la différence entre GraphQL et REST

---

## Pourquoi GraphQL ?

### Le problème avec REST

Imaginons qu'on veut afficher une page de commune avec ses voies :

**Approche REST :**
```
GET /api/communes/75101                    → { id, nom, codePostal }
GET /api/communes/75101/voies?limit=20     → [{ id, nom }, ...]
GET /api/communes/75101/departement        → { code, nom }
```

**Problèmes :**
1. **3 requêtes HTTP** pour une seule page
2. **Over-fetching** : `/communes/75101` renvoie peut-être 20 champs alors qu'on en veut 3
3. **Under-fetching** : Il faut une requête supplémentaire pour les voies
4. **N+1 problème** : Si on veut les 20 communes d'un département, c'est 21 requêtes

**Approche GraphQL :**
```graphql
query {
  commune(id: "75101") {
    id
    nom
    codePostal
    departement {
      code
      nom
    }
    voies(first: 20) {
      id
      nom
    }
  }
}
```

**Avantages :**
1. **1 seule requête** pour tout
2. **Exactement les champs demandés**, pas plus
3. **Relations incluses** dans la même requête
4. **Typé** : Le client sait exactement ce qu'il va recevoir

### Comparaison REST vs GraphQL

| Aspect | REST | GraphQL |
|--------|------|---------|
| Endpoints | Multiples (`/users`, `/posts`) | Un seul (`/graphql`) |
| Méthodes | GET, POST, PUT, DELETE | POST (ou GET pour queries) |
| Réponse | Fixée par le backend | Demandée par le client |
| Documentation | Swagger/OpenAPI | Introspection native |
| Versions | `/v1/users`, `/v2/users` | Deprecation de champs |
| Over-fetching | Fréquent | Impossible |
| Under-fetching | Fréquent | Impossible |

---

## Pourquoi GraphQL Yoga ?

### Les alternatives

| Serveur | Avantages | Inconvénients |
|---------|-----------|---------------|
| **Apollo Server** | Très populaire, écosystème riche | Plus lourd, startup lent |
| **Express + graphql-http** | Léger | Configuration manuelle |
| **Mercurius** (Fastify) | Très performant | Lié à Fastify |
| **GraphQL Yoga** | Moderne, standard, rapide | Moins connu qu'Apollo |

### Pourquoi on choisit Yoga

1. **100% conforme** à la spec GraphQL-over-HTTP
2. **Plus performant** qu'Apollo Server (benchmarks)
3. **GraphiQL inclus** (IDE interactif)
4. **Zero-config** : Fonctionne avec n'importe quel framework HTTP
5. **Maintenu par The Guild** (les experts GraphQL de l'écosystème)

```typescript
// Apollo Server - plus verbeux
import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'

const server = new ApolloServer({ typeDefs, resolvers })
const { url } = await startStandaloneServer(server, { listen: { port: 4000 } })

// GraphQL Yoga - plus simple
import { createYoga, createSchema } from 'graphql-yoga'
import { createServer } from 'node:http'

const yoga = createYoga({ schema })
createServer(yoga).listen(4000)
```

---

## Les fichiers à créer/modifier

### 1. Mettre à jour `apps/api/package.json`

Ajouter les dépendances GraphQL :

```json
{
  "name": "api",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "@prisma/client": "^6.2.0",
    "graphql": "^16.9.0",
    "graphql-yoga": "^5.10.0"
  },
  "devDependencies": {
    "@types/node": "^22.10.0",
    "prisma": "^6.2.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0"
  }
}
```

### 2. Créer `apps/api/src/index.ts`

```typescript
/**
 * Serveur GraphQL Yoga
 *
 * Ce fichier est le point d'entrée de l'API.
 * Pour l'instant, on utilise un schéma SDL (string) simple.
 * Dans le step suivant, on passera à Pothos (code-first).
 */

import { createYoga, createSchema } from 'graphql-yoga'
import { createServer } from 'node:http'

// ============================================================
// SCHEMA
// ============================================================
// Le schéma GraphQL définit :
// - Les types de données disponibles (Query, Mutation, types custom)
// - Les champs de chaque type
// - Les arguments acceptés
//
// C'est comme un contrat entre le client et le serveur.
// ============================================================

const schema = createSchema({
  // typeDefs : Définition du schéma en SDL (Schema Definition Language)
  // /* GraphQL */ est un tag pour l'autocomplétion dans VSCode
  typeDefs: /* GraphQL */ `
    """
    Type racine pour toutes les lectures.
    Chaque champ est un "endpoint" possible.
    """
    type Query {
      """
      Message de bienvenue pour tester que l'API fonctionne.
      """
      hello: String!

      """
      Heure actuelle du serveur (utile pour debug).
      """
      serverTime: String!

      """
      Informations sur l'API.
      """
      apiInfo: ApiInfo!
    }

    """
    Métadonnées sur l'API.
    """
    type ApiInfo {
      name: String!
      version: String!
      description: String!
    }
  `,

  // resolvers : Fonctions qui retournent les valeurs
  // La structure miroir celle du typeDefs
  resolvers: {
    Query: {
      // Chaque resolver reçoit (parent, args, context, info)
      // Pour les query root, parent est toujours undefined
      hello: () => 'Bienvenue sur l\'API Adresse Explorer !',

      serverTime: () => new Date().toISOString(),

      apiInfo: () => ({
        name: 'Adresse Explorer API',
        version: '0.1.0',
        description: 'API GraphQL pour explorer les 26 millions d\'adresses françaises',
      }),
    },
  },
})

// ============================================================
// SERVEUR
// ============================================================
// Yoga est un "handler" HTTP qui répond aux requêtes GraphQL.
// On l'attache à un serveur HTTP Node.js standard.
// ============================================================

const yoga = createYoga({
  schema,

  // GraphiQL : IDE interactif pour tester les queries
  // En production, on le désactiverait
  graphiql: {
    title: 'Adresse Explorer API',
    defaultQuery: `# Bienvenue sur l'API Adresse Explorer !
# Essaie cette query :

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

  // Logging pour le debug
  logging: 'debug',
})

// Créer le serveur HTTP standard de Node.js
const server = createServer(yoga)

// Port configurable via variable d'environnement
const PORT = process.env.PORT || 4000

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   🚀 Serveur GraphQL démarré !                          ║
║                                                          ║
║   GraphiQL : http://localhost:${PORT}/graphql              ║
║                                                          ║
║   Essaie cette query dans GraphiQL :                    ║
║                                                          ║
║   query {                                               ║
║     hello                                               ║
║     serverTime                                          ║
║   }                                                     ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
`)
})
```

---

## Comprendre le schéma GraphQL

### Structure d'un schéma

```graphql
# TYPES RACINE (obligatoires)
type Query {        # Lectures (GET en REST)
  ...
}
type Mutation {     # Écritures (POST/PUT/DELETE en REST)
  ...
}
type Subscription { # Temps réel (WebSocket)
  ...
}

# TYPES CUSTOM
type User {
  id: ID!
  name: String!
  email: String
}
```

### Types scalaires de base

| Type GraphQL | Équivalent TypeScript | Exemple |
|--------------|----------------------|---------|
| `String` | `string` | `"Paris"` |
| `Int` | `number` (entier) | `75` |
| `Float` | `number` (décimal) | `48.856614` |
| `Boolean` | `boolean` | `true` |
| `ID` | `string` (unique) | `"75101"` |

### Modificateurs

```graphql
String    # Nullable (peut être null)
String!   # Non-null (obligatoire)
[String]  # Liste nullable de strings nullables
[String!] # Liste nullable de strings non-null
[String!]!# Liste non-null de strings non-null
```

**Comparaison TypeScript :**
```typescript
String    →  string | null
String!   →  string
[String]  →  (string | null)[] | null
[String!] →  string[] | null
[String!]!→  string[]
```

### Resolvers

Chaque champ du schéma a un resolver qui retourne sa valeur :

```typescript
const resolvers = {
  Query: {
    // Resolver simple : retourne directement une valeur
    hello: () => 'Hello',

    // Resolver avec arguments
    user: (parent, args, context, info) => {
      // parent  : objet parent (null pour Query)
      // args    : arguments passés { id: "123" }
      // context : contexte partagé (db, user, etc.)
      // info    : métadonnées de la query
      return database.users.find(args.id)
    },
  },

  // Resolvers pour un type custom
  User: {
    // Si le champ existe sur l'objet parent, pas besoin de resolver
    // Sinon, on définit comment le calculer
    fullName: (parent) => `${parent.firstName} ${parent.lastName}`,
  },
}
```

---

## Commandes à exécuter

```bash
# À la racine du monorepo
npm install

# Lancer l'API (avec hot-reload)
npm run dev:api
```

---

## Checkpoint ✓

### 1. Console

```
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   🚀 Serveur GraphQL démarré !                          ║
║                                                          ║
║   GraphiQL : http://localhost:4000/graphql              ║
...
```

### 2. GraphiQL

Ouvre `http://localhost:4000/graphql` dans ton navigateur.

Execute cette query :

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

**Résultat attendu :**

```json
{
  "data": {
    "hello": "Bienvenue sur l'API Adresse Explorer !",
    "serverTime": "2024-01-15T10:30:00.000Z",
    "apiInfo": {
      "name": "Adresse Explorer API",
      "version": "0.1.0",
      "description": "API GraphQL pour explorer les 26 millions d'adresses françaises"
    }
  }
}
```

### 3. Test avec curl

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ hello }"}'
```

**Résultat :**
```json
{"data":{"hello":"Bienvenue sur l'API Adresse Explorer !"}}
```

---

## Comprendre GraphiQL

GraphiQL est l'IDE intégré pour tester les queries GraphQL :

| Fonctionnalité | Description |
|----------------|-------------|
| **Autocomplétion** | `Ctrl+Space` pour voir les champs disponibles |
| **Documentation** | Panneau "Docs" à droite (basé sur l'introspection) |
| **Historique** | Panneau "History" pour retrouver les queries passées |
| **Variables** | Panneau "Variables" en bas pour les arguments |
| **Pretty print** | `Ctrl+Shift+P` pour formater |

### Explorer le schéma

Clique sur "Docs" à droite, puis explore :
- `Query` → voir tous les points d'entrée
- Chaque type → voir ses champs

C'est la **documentation auto-générée** à partir du schéma !

---

## SDL-first vs Code-first

On vient d'écrire le schéma en SDL (Schema Definition Language) :

```typescript
const schema = createSchema({
  typeDefs: `
    type Query {
      hello: String!
    }
  `,
  resolvers: {
    Query: {
      hello: () => 'Hello',
    },
  },
})
```

### Problème : Deux sources de vérité

```typescript
// typeDefs dit : String!
// resolvers dit : () => 'Hello'
// Mais rien ne vérifie que c'est cohérent !

typeDefs: `
  type Query {
    user: User!  # Attend un User
  }
`,
resolvers: {
  Query: {
    user: () => 'coucou',  // ❌ Retourne une String, pas d'erreur !
  },
},
```

TypeScript ne vérifie PAS que les resolvers correspondent au schéma.

### Solution : Code-first avec Pothos

```typescript
// Une seule source de vérité : TypeScript
builder.queryField('hello', (t) =>
  t.string({
    resolve: () => 'Hello',  // TypeScript vérifie que c'est bien un string
  })
)
```

**On passera à Pothos dans le step suivant.**

---

## Pièges courants

| Problème | Cause | Solution |
|----------|-------|----------|
| Port 4000 occupé | Autre process | `lsof -i :4000` puis `kill <PID>` |
| GraphiQL vide | Schema invalide | Vérifier les erreurs dans la console |
| `Cannot POST /graphql` | GET au lieu de POST | Utiliser GraphiQL ou curl avec POST |
| Erreur CORS | Navigateur bloqué | Ajouter `cors: true` dans Yoga |
| `Cannot read property 'x' of null` | Resolver retourne null | Vérifier le type nullable |

---

## Anatomie d'une requête GraphQL

```graphql
query GetCommuneWithVoies($id: ID!, $first: Int = 10) {
  commune(id: $id) {
    id
    nom
    voies(first: $first) {
      edges {
        node {
          id
          nom
        }
      }
    }
  }
}
```

| Partie | Description |
|--------|-------------|
| `query` | Type d'opération (query, mutation, subscription) |
| `GetCommuneWithVoies` | Nom de l'opération (optionnel mais recommandé) |
| `($id: ID!, $first: Int = 10)` | Déclaration des variables avec types et defaults |
| `commune(id: $id)` | Champ avec argument |
| `{ id nom ... }` | Selection set (champs demandés) |

Les variables sont passées séparément (en JSON) :
```json
{
  "id": "75101",
  "first": 20
}
```

---

## Prochaine étape

Le problème actuel : le schéma SDL n'est pas vérifié par TypeScript.

→ [09-pothos-setup.md](./09-pothos-setup.md) : Passer à Pothos pour un schéma 100% TypeScript
