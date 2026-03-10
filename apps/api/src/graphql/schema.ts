/**
 * Schéma GraphQL avec Pothos
 *
 * Ce fichier configure le builder Pothos et construit le schéma.
 * Les types GraphQL seront définis dans ./types/ au fur et à mesure.
 */

import SchemaBuilder from '@pothos/core'
import PrismaPlugin from '@pothos/plugin-prisma'
import RelayPlugin from '@pothos/plugin-relay'

import type PrismaTypes from '@pothos/plugin-prisma/generated'
import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'

// ============================================================
// TYPES DU BUILDER
// ============================================================

interface BuilderTypes {
  // Types Prisma générés par `prisma generate`
  PrismaTypes: PrismaTypes

  // Contexte disponible dans tous les resolvers (3ème argument)
  Context: {
    prisma: typeof prisma
  }

  // Types scalaires GraphQL
  Scalars: {
    ID: { Input: string; Output: string }
  }
}

// ============================================================
// BUILDER POTHOS
// ============================================================

export const builder = new SchemaBuilder<BuilderTypes>({
  plugins: [PrismaPlugin, RelayPlugin],

  // Configuration du plugin Prisma
  prisma: {
    client: (ctx) => ctx.prisma,
    dmmf: Prisma.dmmf,
    exposeDescriptions: true,
    filterConnectionTotalCount: true,
  },

  // Configuration du plugin Relay (pagination par curseurs)
  relay: {
    cursorType: 'String',
    encodeGlobalID: (typename, id) => `${typename}:${id}`,
    decodeGlobalID: (globalID) => {
      const [typename, id] = globalID.split(':')
      return { typename, id }
    },
  },
})

// ============================================================
// TYPE QUERY (racine)
// ============================================================

builder.queryType({
  description: 'Requêtes de lecture',
})

// ============================================================
// QUERIES DE TEST
// ============================================================

builder.queryField('hello', (t) =>
  t.string({
    description: 'Message de bienvenue',
    resolve: () => 'Bienvenue sur l\'API Adresse Explorer !',
  })
)

builder.queryField('serverTime', (t) =>
  t.string({
    description: 'Heure du serveur (ISO 8601)',
    resolve: () => new Date().toISOString(),
  })
)

// Type custom pour les infos API
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
      description: 'API GraphQL pour explorer les adresses françaises',
    }),
  })
)

// ============================================================
// CONSTRUCTION DU SCHÉMA
// ============================================================
// builder.toSchema() compile toutes les définitions en un schéma GraphQL
// ============================================================

export const schema = builder.toSchema()
