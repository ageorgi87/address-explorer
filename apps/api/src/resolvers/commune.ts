import type { Resolvers } from '../generated/graphql.js'

export const communeResolvers: Resolvers = {
  Query: {
    commune: (_parent, args, ctx) => {
      return ctx.prisma.commune.findUnique({
        where: { id: args.codeInsee },
      })
    },

    communes: (_parent, args, ctx) => {
      return ctx.prisma.commune.findMany({
        where: {
          ...(args.departementCode && { departementCode: args.departementCode }),
          ...(args.codePostal && { codePostal: args.codePostal }),
        },
        orderBy: { nom: 'asc' },
        take: 100,
      })
    },
  },

  Commune: {
    departement: async (parent, _args, ctx) => {
      const dept = await ctx.prisma.departement.findUnique({
        where: { code: parent.departementCode },
      })
      if (!dept) throw new Error(`Département ${parent.departementCode} introuvable`)
      return dept
    },

    voieCount: (parent, _args, ctx) => {
      return ctx.prisma.voie.count({
        where: { communeId: parent.id },
      })
    },

    voies: (parent, _args, ctx) => {
      return ctx.prisma.voie.findMany({
        where: { communeId: parent.id },
        take: 100,
        orderBy: { nom: 'asc' },
      })
    },
  },
}
