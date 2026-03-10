import { prisma } from './lib/prisma.js'

// ============================================
// TEST DE CONNEXION
// ============================================

async function main() {
  try {
    // Tester la connexion
    await prisma.$connect()
    console.log('✅ Connecté à PostgreSQL')

    // Afficher des infos sur la base
    const result = await prisma.$queryRaw<[{ version: string }]>`SELECT version()`
    console.log('📦 Version PostgreSQL:', result[0].version.split(',')[0])

    // Compter les enregistrements de test
    const count = await prisma.test.count()
    console.log(`📊 ${count} enregistrement(s) dans la table "tests"`)

    // Créer un enregistrement de test
    const testRecord = await prisma.test.create({
      data: { name: 'Premier test' }
    })
    console.log('✨ Enregistrement créé:', testRecord)

    // Lister tous les enregistrements
    const allTests = await prisma.test.findMany()
    console.log('📋 Tous les tests:', allTests)

  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
