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
    communeCount: (parent, _args, ctx) => {
      return ctx.prisma.commune.count({
        where: { departementCode: parent.code },
      })
    },

    communes: (parent, _args, ctx) => {
      return ctx.prisma.commune.findMany({
        where: { departementCode: parent.code },
        orderBy: { nom: 'asc' },
      })
    },
  },
}
