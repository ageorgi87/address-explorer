import { PrismaClient } from '@prisma/client'

// ============================================
// SINGLETON PRISMA
// ============================================

// On crée une instance unique pour éviter :
// - Trop de connexions à la base
// - Memory leaks en dev avec le hot-reload

// En dev, le hot-reload recrée les modules
// On stocke l'instance dans globalThis pour la réutiliser
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Créer ou réutiliser l'instance
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  // Logging : affiche les queries en dev
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],
})

// En dev, stocker dans globalThis pour le hot-reload
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
