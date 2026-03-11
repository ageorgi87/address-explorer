import { createYoga } from "graphql-yoga";
import { createServer } from "node:http";
import { mergeTypeDefs, mergeResolvers } from "@graphql-tools/merge";
import { makeExecutableSchema } from "@graphql-tools/schema";

import { prisma } from "./lib/prisma.js";
import { isDev } from "./lib/isDev.js";
import { GRAPHIQL_CONFIG } from "./lib/graphiql.js";
import type { GraphQLContext } from "./generated/context.js";

// Schema
import { departementTypeDefs } from "./schema/departement.js";
import { communeTypeDefs } from "./schema/commune.js";
import { voieTypeDefs } from "./schema/voie.js";

// Resolvers
import { departementResolvers } from "./resolvers/departement.js";
import { communeResolvers } from "./resolvers/commune.js";
import { voieResolvers } from "./resolvers/voie.js";

const typeDefs = mergeTypeDefs([
  departementTypeDefs,
  communeTypeDefs,
  voieTypeDefs,
]);

const resolvers = mergeResolvers([
  departementResolvers,
  communeResolvers,
  voieResolvers,
]);

// Créer le schema exécutable
const schema = makeExecutableSchema({ typeDefs, resolvers });

const yoga = createYoga<GraphQLContext>({
  schema,
  context: () => ({ prisma }),
  graphiql: GRAPHIQL_CONFIG,
});

const server = createServer(yoga);
const port = process.env.PORT || 4000;

server.listen(port, () => {
  if (isDev) {
    console.log(`GraphQL API: http://localhost:${port}/graphql`);
  }
});
