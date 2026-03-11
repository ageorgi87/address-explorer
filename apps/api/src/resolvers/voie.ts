import type { Resolvers } from '../generated/graphql.js'

export const voieResolvers: Resolvers = {
  Voie: {
    commune: async (parent, _args, ctx) => {
      const commune = await ctx.prisma.commune.findUnique({
        where: { id: parent.communeId },
      })
      if (!commune) throw new Error(`Commune ${parent.communeId} introuvable`)
      return commune
    },

    numeros: (parent, _args, ctx) => {
      return ctx.prisma.numero.findMany({
        where: { voieId: parent.id },
        orderBy: { numero: 'asc' },
        take: 100,
      })
    },
  },
}
