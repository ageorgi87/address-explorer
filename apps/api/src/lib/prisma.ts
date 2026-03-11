/**
 * Singleton Prisma - évite les connexions multiples en dev (hot-reload)
 */

import { PrismaClient } from "@prisma/client";
import { isDev } from "./isDev.js";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isDev ? ["query", "error", "warn"] : ["error"],
  });

if (isDev) {
  globalForPrisma.prisma = prisma;
}
