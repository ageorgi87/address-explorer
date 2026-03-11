import { PrismaClient } from '@prisma/client'
import { isDev } from './isDev.js'

// Singleton Prisma pour éviter les connexions multiples en dev (hot-reload)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Créer ou réutiliser l'instance existante
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  // En dev, on log les queries pour debug
  log: isDev ? ['query', 'error', 'warn'] : ['error'],
})

// En dev, stocker dans globalThis pour persister entre les hot-reloads
if (isDev) {
  globalForPrisma.prisma = prisma
}
