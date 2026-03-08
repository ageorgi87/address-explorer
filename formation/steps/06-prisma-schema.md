# Step 06 : Modéliser le schéma BAN

> **Commit** : `step-06-prisma-schema`
> **Durée** : ~30 min
> **Prérequis** : Step 05 complété

---

## Objectif

Créer les tables pour stocker les adresses françaises avec un schéma optimisé pour :
- La recherche rapide (index)
- Les relations hiérarchiques (Département → Commune → Voie → Numéro)
- La compatibilité avec GraphQL (IDs stables, relations explicites)

À la fin de ce step, tu auras 4 tables vides mais prêtes à recevoir les 26 millions d'adresses.

---

## Pourquoi cette structure ?

### La hiérarchie administrative française

```
France
├── Département (101 au total)
│   ├── 01 - Ain
│   ├── 02 - Aisne
│   ├── ...
│   └── 75 - Paris
│       └── Commune (~35 000 au total en France)
│           ├── 75101 - Paris 1er Arrondissement
│           ├── 75102 - Paris 2ème Arrondissement
│           └── ...
│               └── Voie (~2 500 000 au total)
│                   ├── Rue de Rivoli
│                   └── Avenue des Champs-Élysées
│                       └── Numéro (~26 000 000 au total)
│                           ├── 1 Rue de Rivoli
│                           ├── 1 bis Rue de Rivoli
│                           └── 2 Rue de Rivoli
```

Cette structure est **hiérarchique** (parent → enfants), ce qui se traduit naturellement en relations 1-N en base de données.

---

## Comprendre les identifiants BAN

### Code Département vs Code INSEE vs Code Postal

Ces trois codes sont souvent confondus. Voici leurs différences :

| Code | Exemple | Usage | Unicité |
|------|---------|-------|---------|
| **Code Département** | `75` | Identifier le département | Unique en France |
| **Code INSEE** | `75101` | Identifier la commune (officiel) | Unique en France |
| **Code Postal** | `75001` | Distribution du courrier | Peut être partagé |

**Pourquoi utiliser le Code INSEE plutôt que le Code Postal ?**

```
Code Postal 75001 = Paris 1er, Paris 2ème (partiellement)
Code INSEE 75101 = Paris 1er uniquement
Code INSEE 75102 = Paris 2ème uniquement
```

Le Code Postal est conçu pour le tri postal, pas pour identifier une commune. Plusieurs communes peuvent partager un code postal, et une commune peut avoir plusieurs codes postaux.

### Structure des identifiants BAN

La BAN utilise des identifiants composites très bien pensés :

```
Département : 75
             ↓
Commune    : 75101           (département + arrondissement)
             ↓
Voie       : 75101_0123      (commune + numéro FANTOIR)
             ↓
Numéro     : 75101_0123_00001 (voie + numéro d'adresse)
```

**Avantage** : L'ID contient déjà la hiérarchie. On peut extraire le département de n'importe quel ID en prenant les 2 premiers caractères.

---

## Alternatives de modélisation considérées

### Option A : Une seule table "Adresse" (dénormalisée)

```sql
CREATE TABLE adresses (
  id VARCHAR PRIMARY KEY,
  numero VARCHAR,
  voie VARCHAR,
  commune VARCHAR,
  departement VARCHAR,
  code_postal VARCHAR,
  lat FLOAT,
  lon FLOAT
);
```

| Avantages | Inconvénients |
|-----------|---------------|
| Simple à requêter | Données dupliquées (Paris répété 350k fois) |
| Pas de JOINs | Taille de base x3 |
| Import facile | Incohérence possible |
| | Difficile de lister "toutes les communes de Paris" |

**Verdict** : ❌ Adapté pour un fichier CSV, pas pour une API GraphQL.

### Option B : Normalisation complète (notre choix)

```sql
departements 1 ─────<N communes 1 ─────<N voies 1 ─────<N numeros
```

| Avantages | Inconvénients |
|-----------|---------------|
| Données normalisées | JOINs nécessaires |
| Pas de duplication | Schéma plus complexe |
| Intégrité référentielle | Import en plusieurs passes |
| Navigation hiérarchique | |
| Parfait pour GraphQL | |

**Verdict** : ✅ C'est ce qu'on va faire.

### Option C : Modèle hybride (JSON pour les numeros)

```sql
CREATE TABLE voies (
  id VARCHAR PRIMARY KEY,
  nom VARCHAR,
  numeros JSONB  -- Tous les numéros en JSON
);
```

| Avantages | Inconvénients |
|-----------|---------------|
| Moins de tables | Pas d'index sur les numéros |
| Lecture rapide d'une voie complète | PostgreSQL uniquement |
| | Recherche "numéro 42" très lente |

**Verdict** : ❌ Intéressant pour certains cas, mais on veut pouvoir chercher par numéro.

---

## Le schéma Prisma complet

### Fichier à modifier : `apps/api/prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================
// DÉPARTEMENT
// ============================================================
// Niveau le plus haut de la hiérarchie
// 101 départements en France (métropole + outre-mer)
//
// Le code est utilisé comme ID car il est :
// - Unique
// - Stable (ne change jamais)
// - Court (2-3 caractères)
// - Signifiant (75 = Paris)
// ============================================================
model Departement {
  code     String    @id    // "75", "13", "2A" (Corse)
  nom      String           // "Paris", "Bouches-du-Rhône"

  // Relation 1-N : un département a plusieurs communes
  communes Commune[]

  // Nom de la table en minuscules (convention SQL)
  @@map("departements")
}

// ============================================================
// COMMUNE
// ============================================================
// ~35 000 communes en France
//
// L'ID est le code INSEE (unique nationalement)
// Différent du code postal ! (voir explications plus haut)
// ============================================================
model Commune {
  id              String      @id    // Code INSEE : "75101"
  nom             String             // "Paris 1er Arrondissement"
  codePostal      String             // "75001" (pour l'affichage)

  // Clé étrangère vers Departement
  departementCode String
  departement     Departement @relation(fields: [departementCode], references: [code])

  // Relation 1-N : une commune a plusieurs voies
  voies           Voie[]

  // INDEX : Accélère les requêtes fréquentes
  // Sans index : scan de 35k lignes à chaque fois
  // Avec index : accès direct en O(log n)
  @@index([departementCode])  // WHERE departement_code = '75'
  @@index([nom])              // WHERE nom LIKE 'Paris%'

  @@map("communes")
}

// ============================================================
// VOIE
// ============================================================
// ~2.5 millions de voies en France
//
// L'ID est le code FANTOIR : commune + numéro de voie
// Ex: "75101_0123" = voie 123 de Paris 1er
// ============================================================
model Voie {
  id        String   @id    // "75101_0123"
  nom       String          // "Rue de Rivoli"

  // Clé étrangère vers Commune
  communeId String
  commune   Commune  @relation(fields: [communeId], references: [id])

  // Relation 1-N : une voie a plusieurs numéros
  numeros   Numero[]

  // INDEX : Essentiels pour la recherche
  @@index([communeId])  // Toutes les voies d'une commune
  @@index([nom])        // Recherche par nom de voie

  @@map("voies")
}

// ============================================================
// NUMÉRO
// ============================================================
// ~26 millions de numéros en France
//
// C'est l'adresse complète avec coordonnées GPS
// Le suffixe peut être : bis, ter, A, B, ...
// ============================================================
model Numero {
  id      String  @id     // "75101_0123_00001"
  numero  String          // "1", "42", "100"
  suffixe String?         // "bis", "ter", "A", null

  // Coordonnées GPS (projection WGS84)
  lat     Float           // 48.856614 (latitude)
  lon     Float           // 2.352222 (longitude)

  // Clé étrangère vers Voie
  voieId  String
  voie    Voie    @relation(fields: [voieId], references: [id])

  // INDEX : Pour lister les numéros d'une voie
  @@index([voieId])

  @@map("numeros")
}
```

---

## Comprendre chaque élément du schéma

### Les relations Prisma

```prisma
// Côté "parent" (un département a plusieurs communes)
communes Commune[]

// Côté "enfant" (une commune appartient à un département)
departementCode String                // Colonne dans la table
departement     Departement @relation(fields: [departementCode], references: [code])
```

**Comparaison avec SQL pur :**

```sql
-- Ce que Prisma génère automatiquement :
ALTER TABLE communes
ADD CONSTRAINT fk_communes_departement
FOREIGN KEY (departement_code) REFERENCES departements(code);
```

### Le champ virtuel vs la colonne réelle

```prisma
departementCode String      // ← Colonne RÉELLE (stockée en base)
departement     Departement // ← Champ VIRTUEL (calculé par Prisma)
```

En base de données, seul `departement_code` existe. Le champ `departement` est une "vue" que Prisma construit à la volée quand tu fais un `include`.

### Pourquoi `@id` et pas `@id @default(cuid())` ?

```prisma
// ❌ ID généré (comme souvent dans les apps classiques)
model User {
  id String @id @default(cuid())  // "clg1234abc..."
}

// ✅ ID naturel (BAN)
model Commune {
  id String @id  // "75101" - déjà unique et signifiant
}
```

La BAN fournit des identifiants **stables et signifiants**. Les utiliser directement :
- Évite une table de correspondance
- Rend les URLs lisibles (`/communes/75101` vs `/communes/clg1234abc`)
- Permet de valider les données à l'import

### Les index : pourquoi et comment

```prisma
@@index([departementCode])  // Index B-tree par défaut
```

**Sans index :**
```
SELECT * FROM communes WHERE departement_code = '75'
→ Scan séquentiel de 35 000 lignes
→ ~50ms
```

**Avec index :**
```
SELECT * FROM communes WHERE departement_code = '75'
→ Lookup B-tree direct
→ ~1ms
```

**Règle** : Créer un index sur chaque champ utilisé dans `WHERE`, `ORDER BY`, ou `JOIN`.

### `@@map` : convention de nommage

```prisma
model Departement {
  @@map("departements")  // Table = "departements" (minuscules, pluriel)
}
```

| Sans @@map | Avec @@map |
|------------|------------|
| Table `Departement` | Table `departements` |
| PascalCase | snake_case pluriel |
| Convention TypeScript | Convention SQL |

---

## Les migrations Prisma

### Comment ça marche

```
schema.prisma  →  prisma migrate dev  →  SQL  →  PostgreSQL
(source)           (génère)              (applique)
```

Prisma compare ton `schema.prisma` actuel avec l'état de la base, puis génère le SQL nécessaire pour synchroniser.

### Exécuter la migration

```bash
cd apps/api

# Générer et appliquer la migration
npx prisma migrate dev --name create_ban_schema
```

**Ce qui se passe :**
1. Prisma lit `schema.prisma`
2. Compare avec la base (vide pour l'instant)
3. Génère le SQL dans `prisma/migrations/TIMESTAMP_create_ban_schema/migration.sql`
4. Applique le SQL à PostgreSQL
5. Met à jour le `@prisma/client`

### Le SQL généré

Après la migration, regarde le fichier généré :

```bash
cat apps/api/prisma/migrations/*/migration.sql
```

Tu verras quelque chose comme :

```sql
-- CreateTable
CREATE TABLE "departements" (
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "departements_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "communes" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "codePostal" TEXT NOT NULL,
    "departementCode" TEXT NOT NULL,

    CONSTRAINT "communes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voies" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "communeId" TEXT NOT NULL,

    CONSTRAINT "voies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "numeros" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "suffixe" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lon" DOUBLE PRECISION NOT NULL,
    "voieId" TEXT NOT NULL,

    CONSTRAINT "numeros_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "communes_departementCode_idx" ON "communes"("departementCode");

-- CreateIndex
CREATE INDEX "communes_nom_idx" ON "communes"("nom");

-- CreateIndex
CREATE INDEX "voies_communeId_idx" ON "voies"("communeId");

-- CreateIndex
CREATE INDEX "voies_nom_idx" ON "voies"("nom");

-- CreateIndex
CREATE INDEX "numeros_voieId_idx" ON "numeros"("voieId");

-- AddForeignKey
ALTER TABLE "communes" ADD CONSTRAINT "communes_departementCode_fkey"
    FOREIGN KEY ("departementCode") REFERENCES "departements"("code")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voies" ADD CONSTRAINT "voies_communeId_fkey"
    FOREIGN KEY ("communeId") REFERENCES "communes"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "numeros" ADD CONSTRAINT "numeros_voieId_fkey"
    FOREIGN KEY ("voieId") REFERENCES "voies"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
```

---

## Vérifier avec Prisma Studio

```bash
cd apps/api
npx prisma studio
```

Ouvre `http://localhost:5555`. Tu dois voir 4 tables vides :

| Table | Lignes |
|-------|--------|
| departements | 0 |
| communes | 0 |
| voies | 0 |
| numeros | 0 |

---

## Checkpoint ✓

### 1. Migration créée

```bash
ls apps/api/prisma/migrations/
# → YYYYMMDDHHMMSS_create_ban_schema/
```

### 2. Prisma Studio montre 4 tables

Ouvre `http://localhost:5555` :
- ✅ Table `departements`
- ✅ Table `communes`
- ✅ Table `voies`
- ✅ Table `numeros`

### 3. Le client Prisma est typé

Crée un fichier de test temporaire :

```typescript
// apps/api/test-types.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// L'autocomplétion doit fonctionner :
prisma.departement.  // → findMany, findUnique, create, ...
prisma.commune.      // → findMany, findUnique, create, ...
prisma.voie.         // → findMany, findUnique, create, ...
prisma.numero.       // → findMany, findUnique, create, ...
```

Si l'autocomplétion ne fonctionne pas, relance `npx prisma generate`.

---

## Pièges courants

| Problème | Cause | Solution |
|----------|-------|----------|
| `Foreign key constraint failed` | Insertion dans le mauvais ordre | Toujours insérer parents avant enfants |
| `Unique constraint failed` | ID déjà existant | Utiliser `upsert` ou `skipDuplicates` |
| `Column 'x' cannot be null` | Champ obligatoire manquant | Vérifier les données source |
| Migration échoue | Conflit avec état précédent | `npx prisma migrate reset` (⚠️ perd les données) |
| Types pas à jour | Client pas régénéré | `npx prisma generate` |

---

## Bonnes pratiques Prisma

### 1. Un fichier = une responsabilité

```
prisma/
├── schema.prisma      # Modèles uniquement
├── migrations/        # Généré automatiquement
└── seed.ts            # Données de test (optionnel)
```

### 2. Nommer explicitement les index

```prisma
// ❌ Index anonyme
@@index([nom])

// ✅ Index nommé (plus facile à debug)
@@index([nom], name: "communes_nom_idx")
```

### 3. Documenter les choix non-évidents

```prisma
model Numero {
  suffixe String?  // "bis", "ter", "A"... ou null si pas de suffixe
                   // La BAN utilise le champ "rep" (répétition)
}
```

---

## Résumé des décisions

| Décision | Pourquoi |
|----------|----------|
| 4 tables normalisées | Évite la duplication, permet la navigation GraphQL |
| IDs naturels (code INSEE, etc.) | URLs lisibles, pas de table de correspondance |
| Index sur FK et nom | Performance des requêtes fréquentes |
| `@@map` en snake_case | Convention SQL standard |
| Pas d'`@default` sur les IDs | Les IDs viennent de la BAN |

---

## Prochaine étape

→ [07-ban-import.md](./07-ban-import.md) : Importer les 350 000 adresses de Paris
