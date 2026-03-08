# Step 07 : Importer les données BAN

> **Commit** : `step-07-ban-import`
> **Durée** : ~45 min
> **Prérequis** : Step 06 complété

---

## Objectif

Importer les ~350 000 adresses de Paris (département 75) dans PostgreSQL.

À la fin de ce step :
- Tu auras un script d'import réutilisable
- Les 4 tables seront remplies avec de vraies données
- Des index full-text seront configurés pour la recherche

---

## La Base Adresse Nationale (BAN)

### Qu'est-ce que c'est ?

La BAN est la base de données officielle des adresses françaises :

| Caractéristique | Valeur |
|-----------------|--------|
| **Éditeur** | DINUM (Direction interministérielle du numérique) |
| **Nombre d'adresses** | ~26 millions |
| **Licence** | Licence Ouverte Etalab 2.0 (open data) |
| **Mise à jour** | Quotidienne |
| **Format** | CSV, un fichier par département |
| **Taille totale** | ~5 Go décompressé |

### Pourquoi utiliser la vraie BAN ?

| Données mockées | Vraies données BAN |
|-----------------|-------------------|
| 10-100 adresses | 350 000 adresses (Paris seul) |
| Pas représentatif | Vrais cas limites |
| Pas de test de perf | Test de performance réel |
| "Ça marche en dev" | "Ça marche en prod" |

**Notre approche** : On commence avec Paris (350k lignes) pour itérer rapidement, puis on pourra importer toute la France (26M lignes) plus tard.

### Format du fichier CSV

```csv
id;id_fantoir;numero;rep;nom_voie;code_postal;code_insee;nom_commune;code_insee_ancienne_commune;nom_ancienne_commune;x;y;lon;lat;type_position;alias;nom_ld;libelle_acheminement;nom_afnor;source_position;source_nom_voie;certification_commune;cad_parcelles
75101_0001_00001;75101_0001;1;;COUR DU COMMERCE SAINT ANDRE;75006;75106;Paris 6e Arrondissement;;;;;2.338721;48.852851;entrée;;;;;BAN;;;;;
```

Les colonnes qui nous intéressent :

| Colonne | Description | Exemple |
|---------|-------------|---------|
| `id` | ID unique du numéro | `75101_0001_00001` |
| `id_fantoir` | ID de la voie | `75101_0001` |
| `numero` | Numéro dans la rue | `1` |
| `rep` | Suffixe (bis, ter...) | `bis` ou vide |
| `nom_voie` | Nom de la voie | `COUR DU COMMERCE...` |
| `code_postal` | Code postal | `75006` |
| `code_insee` | Code INSEE commune | `75106` |
| `nom_commune` | Nom complet | `Paris 6e Arrondissement` |
| `lon` | Longitude | `2.338721` |
| `lat` | Latitude | `48.852851` |

---

## Stratégie d'import

### Pourquoi pas un simple INSERT ?

```typescript
// ❌ Naïf : 350 000 requêtes = ~30 minutes
for (const row of rows) {
  await prisma.numero.create({ data: row })
}
```

**Problèmes** :
1. Chaque INSERT est une transaction séparée
2. Pas de parallélisation
3. Network round-trip à chaque ligne

### Notre stratégie

```
CSV (50MB) → Parse ligne par ligne → Batch en mémoire → INSERT bulk
            (streaming)            (Map pour dédupliquer)  (createMany)
```

**Avantages** :
1. **Streaming** : Pas besoin de charger 50MB en mémoire
2. **Déduplication** : Les communes/voies apparaissent plusieurs fois dans le CSV
3. **Batching** : INSERT par lots de 500-1000

---

## Les fichiers à créer

### 1. Script d'import : `apps/api/scripts/import-ban.ts`

```typescript
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
  npx tsx scripts/import-ban.ts ./data/adresses-13.csv 13    # Marseille
  npx tsx scripts/import-ban.ts ./data/adresses-69.csv 69    # Lyon

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
```

### 2. Index full-text : `apps/api/prisma/fts-indexes.sql`

Ces index ne peuvent pas être déclarés dans `schema.prisma` (limitation de Prisma), donc on les applique manuellement.

```sql
-- ============================================================
-- INDEX FULL-TEXT POUR LA RECHERCHE
-- ============================================================
-- Ces index accélèrent les recherches textuelles de manière spectaculaire
-- Sans index : scan séquentiel de 2.5M de lignes (~5 secondes)
-- Avec index : lookup direct (~5 millisecondes)
-- ============================================================

-- ============================================================
-- 1. INDEX GIN FULL-TEXT (tsvector)
-- ============================================================
-- Utilise le stemming français : "rivoli" trouve "RIVOLI", "rivolis"
-- GIN (Generalized Inverted Index) = index inversé comme un moteur de recherche
-- ============================================================

-- Index full-text sur les noms de voies
-- 'french' = configuration de stemming pour le français
CREATE INDEX IF NOT EXISTS voies_nom_fts
ON voies USING GIN (to_tsvector('french', nom));

-- Index full-text sur les noms de communes
CREATE INDEX IF NOT EXISTS communes_nom_fts
ON communes USING GIN (to_tsvector('french', nom));

-- ============================================================
-- 2. INDEX TRIGRAMME (pg_trgm)
-- ============================================================
-- Permet les recherches partielles : "riv" trouve "Rivoli"
-- Utilise la similarité de trigrammes (séquences de 3 caractères)
-- "riv" → {"riv"}, "Rivoli" → {"riv", "ivo", "vol", "oli"}
-- Match car "riv" est dans les deux sets
-- ============================================================

-- Activer l'extension pg_trgm (incluse dans PostgreSQL)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Index trigramme sur les noms de voies
-- gin_trgm_ops = opérateur pour la recherche par similarité
CREATE INDEX IF NOT EXISTS voies_nom_trgm
ON voies USING GIN (nom gin_trgm_ops);

-- Index trigramme sur les noms de communes
CREATE INDEX IF NOT EXISTS communes_nom_trgm
ON communes USING GIN (nom gin_trgm_ops);

-- ============================================================
-- POURQUOI DEUX TYPES D'INDEX ?
-- ============================================================
-- | Type       | Trouve "rivoli" | Trouve "riv" | Typos |
-- |------------|-----------------|--------------|-------|
-- | Full-text  | ✅               | ❌            | ❌     |
-- | Trigramme  | ✅               | ✅            | ✅     |
--
-- Le full-text est plus rapide pour les mots complets.
-- Le trigramme est plus flexible (préfixes, fautes de frappe).
-- On garde les deux pour offrir le meilleur des deux mondes.
-- ============================================================
```

---

## Commandes à exécuter

### 1. Préparer les données

```bash
cd apps/api

# Créer le dossier data (ignoré par git)
mkdir -p data

# Télécharger le CSV de Paris (~15MB compressé, ~50MB décompressé)
curl -o data/adresses-75.csv.gz \
  https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-75.csv.gz

# Décompresser
gunzip data/adresses-75.csv.gz

# Vérifier la taille
ls -lh data/adresses-75.csv
# → ~50MB
```

### 2. Appliquer les index full-text

```bash
# Exécuter le SQL directement sur la base
npx prisma db execute --file prisma/fts-indexes.sql
```

### 3. Lancer l'import

```bash
# Import Paris (~2-3 minutes selon ta machine)
npx tsx scripts/import-ban.ts ./data/adresses-75.csv 75
```

---

## Checkpoint ✓

### 1. Output console attendu

```
📦 Import du département 75
📄 Fichier : ./data/adresses-75.csv

✅ Parsing terminé : 356,789 lignes
   - 21 communes
   - 6,234 voies
   - 356,789 numéros

📍 Insertion département...
🏘️  Insertion communes...
🛣️  Insertion voies...
   6234/6234
📍 Insertion numéros...
   356789/356789

✅ Import terminé !
```

### 2. Vérifier avec Prisma Studio

```bash
npx prisma studio
```

| Table | Lignes attendues |
|-------|------------------|
| departements | 1 |
| communes | ~21 (les arrondissements) |
| voies | ~6 000 |
| numeros | ~350 000 |

### 3. Tester une requête

```bash
npx prisma db execute --stdin <<SQL
SELECT COUNT(*) as total FROM numeros;
SQL
```

Résultat : `~356000`

---

## Comprendre les choix techniques

### Pourquoi le streaming (`createInterface`) ?

```typescript
// ❌ Charger tout en mémoire
const data = fs.readFileSync('file.csv', 'utf-8')  // 50MB en RAM
const lines = data.split('\n')                      // 50MB de plus (copie)
// Total : ~100MB pour un fichier de 50MB

// ✅ Lire ligne par ligne
const rl = createInterface({ input: createReadStream('file.csv') })
for await (const line of rl) {
  // Chaque ligne fait ~200 bytes
  // Node.js garde ~quelques KB en buffer
}
// Total : ~quelques KB, quel que soit la taille du fichier
```

**Avec la France entière (26M lignes, 5GB)**, la version naive crasherait avec "JavaScript heap out of memory". Le streaming fonctionne sans problème.

### Pourquoi `Map` plutôt qu'un `Object` ?

```typescript
// ❌ Object - risques
const communes = {}
communes['constructor'] = 'Paris'  // Collision avec prototype!
communes['__proto__'] = 'Lyon'     // Danger de sécurité!

// ✅ Map - safe
const communes = new Map()
communes.set('constructor', 'Paris')  // Aucun problème
communes.set('__proto__', 'Lyon')     // Aucun risque
```

`Map` est aussi légèrement plus performant pour les insertions/lectures fréquentes.

### Pourquoi `createMany` + `skipDuplicates` ?

```typescript
// ❌ N requêtes (lent)
for (const item of items) {
  await prisma.voie.create({ data: item })
}

// ❌ Une requête mais crash si doublon
await prisma.voie.createMany({ data: items })
// Error: Unique constraint failed

// ✅ Une requête, ignore les doublons
await prisma.voie.createMany({
  data: items,
  skipDuplicates: true
})
// INSERT INTO voies (...) ON CONFLICT DO NOTHING
```

`skipDuplicates` est crucial pour pouvoir **réexécuter l'import** sans erreur (idempotence).

### Pourquoi batching par 500/1000 ?

```typescript
// ❌ Tout d'un coup - timeout ou mémoire
await prisma.numero.createMany({ data: numeros })  // 350k lignes

// ✅ Par petits lots
for (let i = 0; i < numeros.length; i += 1000) {
  await prisma.numero.createMany({
    data: numeros.slice(i, i + 1000)
  })
}
```

| Taille batch | Avantages | Inconvénients |
|--------------|-----------|---------------|
| 100 | Très sûr | 3500 requêtes (lent) |
| 1000 | Bon équilibre | 350 requêtes |
| 10000 | Peu de requêtes | Risque timeout |
| Tout | 1 requête | Timeout probable |

**1000** est un bon compromis empirique.

---

## Pièges courants

| Problème | Cause | Solution |
|----------|-------|----------|
| `ENOENT` | Fichier CSV pas trouvé | Vérifier le chemin (`ls data/`) |
| `Timeout` | Batch trop gros | Réduire à 500 |
| `pg_trgm not found` | Extension pas installée | Vérifier droits superuser sur PostgreSQL |
| `Foreign key constraint` | Ordre d'insertion incorrect | Parent avant enfant |
| `Unique constraint` | ID dupliqué | `skipDuplicates: true` |
| Import très lent | Pas d'index | Créer les index **après** l'import |
| `JavaScript heap out of memory` | Pas de streaming | Utiliser `createInterface` |

---

## Optimisations avancées (optionnel)

### Pour importer toute la France (26M lignes)

1. **Désactiver les index pendant l'import** :
```sql
-- Avant import
DROP INDEX IF EXISTS voies_nom_fts;
DROP INDEX IF EXISTS voies_nom_trgm;

-- Après import
CREATE INDEX voies_nom_fts ON voies USING GIN (to_tsvector('french', nom));
CREATE INDEX voies_nom_trgm ON voies USING GIN (nom gin_trgm_ops);
```

2. **Utiliser COPY au lieu de INSERT** :
```sql
COPY numeros FROM '/path/to/numeros.csv' DELIMITER ';' CSV HEADER;
```
(Nécessite un fichier pré-formaté et des droits PostgreSQL spéciaux)

3. **Paralléliser par département** :
```bash
# 8 départements en parallèle
parallel -j8 "npx tsx scripts/import-ban.ts data/adresses-{}.csv {}" ::: 01 02 03 04 05 06 07 08
```

---

## Ajouter data/ au .gitignore

Les données BAN ne doivent pas être commitées (50MB par département) :

```bash
# À la racine du projet
echo "apps/api/data/" >> .gitignore
```

---

## Résumé

| Aspect | Notre choix | Pourquoi |
|--------|-------------|----------|
| Lecture | Streaming | Mémoire constante |
| Déduplication | Map | O(1), pas de collision |
| Insertion | Batch 500-1000 | Équilibre perf/stabilité |
| Doublon | skipDuplicates | Import idempotent |
| Recherche | GIN + pg_trgm | Full-text + préfixes |

---

## Prochaine étape

→ [08-yoga-setup.md](./08-yoga-setup.md) : Créer le serveur GraphQL pour exposer ces données
