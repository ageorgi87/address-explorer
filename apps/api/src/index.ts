/**
 * Point d'entrée du serveur GraphQL
 *
 * Ce fichier ne fait que lancer le serveur.
 * La logique du schéma est dans ./graphql/schema.ts
 */

import { createYoga } from 'graphql-yoga'
import { createServer } from 'node:http'

import { schema } from './graphql/schema.js'
import { prisma } from './lib/prisma.js'

// ============================================================
// SERVEUR YOGA
// ============================================================

const yoga = createYoga({
  schema,

  // Contexte injecté dans chaque resolver
  context: () => ({ prisma }),

  // GraphiQL (IDE interactif)
  graphiql: {
    title: 'Adresse Explorer API',
    defaultQuery: `# Schéma géré par Pothos (100% TypeScript)

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
║   🚀 GraphQL API démarrée !                              ║
║                                                          ║
║   GraphiQL : http://localhost:${PORT}/graphql               ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
`)
})
