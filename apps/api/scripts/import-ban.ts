/**
 * Script d'import de la Base Adresse Nationale (BAN)
 *
 * Usage:
 *   npx tsx scripts/import-ban.ts ./data/adresses-75.csv 75
 *
 * Ce script :
 * 1. Lit le fichier CSV en streaming (ne charge pas tout en mémoire)
 * 2. Déduplique les communes et voies (qui apparaissent plusieurs fois)
 * 3. Insère en base par batches pour éviter les timeouts
 */

import { PrismaClient } from '@prisma/client'
import { createReadStream } from 'fs'
import { createInterface } from 'readline'

const prisma = new PrismaClient()

// ============================================================
// TYPES
// ============================================================
// Structure d'une ligne du CSV BAN
// Tous les champs sont des strings car CSV = texte brut
// ============================================================
interface BanRow {
  id: string              // ID du numéro (ex: "75101_0001_00001")
  id_fantoir: string      // ID de la voie (ex: "75101_0001")
  numero: string          // Numéro (ex: "1", "42")
  rep: string             // Suffixe (ex: "bis", "ter", "")
  nom_voie: string        // Nom de la voie (ex: "Rue de Rivoli")
  code_postal: string     // Code postal (ex: "75001")
  code_insee: string      // Code INSEE (ex: "75101")
  nom_commune: string     // Nom de la commune (ex: "Paris 1er Arrondissement")
  lon: string             // Longitude (ex: "2.352222")
  lat: string             // Latitude (ex: "48.856614")
}

// ============================================================
// FONCTION PRINCIPALE
// ============================================================
async function importDepartement(csvPath: string, deptCode: string) {
  console.log(`\n📦 Import du département ${deptCode}`)
  console.log(`📄 Fichier : ${csvPath}\n`)

  // Maps pour dédupliquer (une commune/voie peut apparaître N fois)
  // On utilise Map plutôt que Object pour :
  // - Garantir l'unicité des clés
  // - Performance O(1) en lecture/écriture
  // - Itération dans l'ordre d'insertion
  const communes = new Map<string, { nom: string; codePostal: string }>()
  const voies = new Map<string, { nom: string; communeId: string }>()

  // Les numéros sont tous uniques, on peut utiliser un array
  const numeros: Array<{
    id: string
    numero: string
    suffixe: string | null
    lat: number
    lon: number
    voieId: string
  }> = []

  // ============================================================
  // PHASE 1 : PARSING STREAMING
  // ============================================================
  // createInterface + for await = lecture ligne par ligne
  // Mémoire utilisée : ~quelques KB (pas 50MB)
  // ============================================================
  const rl = createInterface({
    input: createReadStream(csvPath),
    crlfDelay: Infinity,  // Gère \r\n et \n uniformément
  })

  let headers: string[] = []
  let lineCount = 0

  for await (const line of rl) {
    // Première ligne = en-têtes
    if (lineCount === 0) {
      headers = line.split(';')
      lineCount++
      continue
    }

    // Parse la ligne en objet
    const values = line.split(';')
    const row = Object.fromEntries(
      headers.map((h, i) => [h, values[i] || ''])
    ) as unknown as BanRow

    // Ignorer les lignes invalides
    if (!row.code_insee || !row.nom_commune) {
      lineCount++
      continue
    }

    // --- Collecter les communes (dédupliquées par Map) ---
    // La même commune apparaît sur chaque ligne de ses adresses
    communes.set(row.code_insee, {
      nom: row.nom_commune,
      codePostal: row.code_postal,
    })

    // --- Collecter les voies (dédupliquées par Map) ---
    if (row.id_fantoir && row.nom_voie) {
      voies.set(row.id_fantoir, {
        nom: row.nom_voie,
        communeId: row.code_insee,
      })
    }

    // --- Collecter les numéros (tous uniques) ---
    if (row.id && row.id_fantoir) {
      numeros.push({
        id: row.id,
        numero: row.numero,
        suffixe: row.rep || null,  // "" → null
        lat: parseFloat(row.lat) || 0,
        lon: parseFloat(row.lon) || 0,
        voieId: row.id_fantoir,
      })
    }

    // Feedback de progression
    lineCount++
    if (lineCount % 50000 === 0) {
      process.stdout.write(`\r⏳ Lu ${lineCount.toLocaleString()} lignes...`)
    }
  }

  console.log(`\r✅ Parsing terminé : ${lineCount.toLocaleString()} lignes`)
  console.log(`   - ${communes.size} communes`)
  console.log(`   - ${voies.size} voies`)
  console.log(`   - ${numeros.length.toLocaleString()} numéros\n`)

  // ============================================================
  // PHASE 2 : INSERTION EN BASE
  // ============================================================
  // ORDRE IMPORTANT : Parents avant enfants (contraintes FK)
  // Département → Communes → Voies → Numéros
  // ============================================================

  // --- 1. Département ---
  // upsert = insert ou update si existe déjà
  console.log('📍 Insertion département...')
  await prisma.departement.upsert({
    where: { code: deptCode },
    create: {
      code: deptCode,
      nom: getDepartementNom(deptCode),  // "Paris" pour 75
    },
    update: {},  // Ne rien changer si existe
  })

  // --- 2. Communes ---
  // createMany avec skipDuplicates évite les erreurs si réexécuté
  console.log('🏘️  Insertion communes...')
  const communeData = [...communes.entries()].map(([id, c]) => ({
    id,
    nom: c.nom,
    codePostal: c.codePostal,
    departementCode: deptCode,
  }))
  await prisma.commune.createMany({
    data: communeData,
    skipDuplicates: true,
  })

  // --- 3. Voies ---
  // On insère par batch de 500 pour éviter les timeouts
  console.log('🛣️  Insertion voies...')
  const voieData = [...voies.entries()].map(([id, v]) => ({
    id,
    nom: v.nom,
    communeId: v.communeId,
  }))

  const VOIE_BATCH_SIZE = 500
  for (let i = 0; i < voieData.length; i += VOIE_BATCH_SIZE) {
    await prisma.voie.createMany({
      data: voieData.slice(i, i + VOIE_BATCH_SIZE),
      skipDuplicates: true,
    })
    process.stdout.write(
      `\r   ${Math.min(i + VOIE_BATCH_SIZE, voieData.length)}/${voieData.length}`
    )
  }
  console.log()

  // --- 4. Numéros ---
  // Plus gros volume : batch de 1000, feedback tous les 10k
  console.log('📍 Insertion numéros...')
  const NUMERO_BATCH_SIZE = 1000
  for (let i = 0; i < numeros.length; i += NUMERO_BATCH_SIZE) {
    await prisma.numero.createMany({
      data: numeros.slice(i, i + NUMERO_BATCH_SIZE),
      skipDuplicates: true,
    })
    if (i % 10000 === 0) {
      process.stdout.write(
        `\r   ${i.toLocaleString()}/${numeros.length.toLocaleString()}`
      )
    }
  }
  console.log(`\r   ${numeros.length.toLocaleString()}/${numeros.length.toLocaleString()}`)

  console.log('\n✅ Import terminé !')
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Retourne le nom du département à partir de son code
 * (Simplifié - en production on utiliserait une table de référence)
 */
function getDepartementNom(code: string): string {
  const noms: Record<string, string> = {
    '01': 'Ain',
    '02': 'Aisne',
    '03': 'Allier',
    '06': 'Alpes-Maritimes',
    '13': 'Bouches-du-Rhône',
    '31': 'Haute-Garonne',
    '33': 'Gironde',
    '34': 'Hérault',
    '44': 'Loire-Atlantique',
    '59': 'Nord',
    '67': 'Bas-Rhin',
    '68': 'Haut-Rhin',
    '69': 'Rhône',
    '75': 'Paris',
    '78': 'Yvelines',
    '91': 'Essonne',
    '92': 'Hauts-de-Seine',
    '93': 'Seine-Saint-Denis',
    '94': 'Val-de-Marne',
    '95': "Val-d'Oise",
    // ... ajouter selon besoin
  }
  return noms[code] || `Département ${code}`
}

// ============================================================
// POINT D'ENTRÉE
// ============================================================
const [, , csvPath, deptCode] = process.argv

if (!csvPath || !deptCode) {
  console.log(`
Usage: npx tsx scripts/import-ban.ts <csv-path> <dept-code>

Exemples:
  npx tsx scripts/import-ban.ts ./data/adresses-75.csv 75    # Paris
  npx tsx scripts/import-ban.ts ./data/adresses-67.csv 67    # Bas-Rhin
  npx tsx scripts/import-ban.ts ./data/adresses-68.csv 68    # Haut-Rhin

Le fichier CSV doit être téléchargé depuis :
  https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/
`)
  process.exit(1)
}

importDepartement(csvPath, deptCode)
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Erreur:', e.message)
    await prisma.$disconnect()
    process.exit(1)
  })
