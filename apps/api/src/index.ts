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
        description: 'API GraphQL pour explorer les adresses françaises',
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
║   🚀 Serveur GraphQL démarré !                           ║
║                                                          ║
║   GraphiQL : http://localhost:${PORT}/graphql               ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
`)
})
