import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: 'src/schema/*.ts',

  generates: {
    'src/generated/graphql.ts': {
      plugins: ['typescript', 'typescript-resolvers'],
      config: {
        // Mapper les types GraphQL vers les types Prisma
        mappers: {
          Departement: '@prisma/client#Departement as DepartementModel',
          Commune: '@prisma/client#Commune as CommuneModel',
          Voie: '@prisma/client#Voie as VoieModel',
        },
        // Type du contexte
        contextType: './context.js#GraphQLContext',
        // Utiliser des types stricts
        useIndexSignature: true,
        // Éviter les Maybe<T> partout
        avoidOptionals: {
          field: true,
          inputValue: false,
          object: false,
        },
      },
    },
  },
}

export default config
