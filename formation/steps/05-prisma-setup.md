# Step 05 : Setup Prisma + PostgreSQL

> **Commit** : `step-05-prisma-setup`
> **Duree** : ~40 min
> **Prerequis** : Step 04 complete, PostgreSQL disponible (Docker recommande)

---

## Objectif

Avoir Prisma installe et connecte a PostgreSQL dans `apps/api`.

---

## C'est quoi Prisma ?

### Le probleme sans ORM

Sans ORM (Object-Relational Mapping), tu ecris du SQL brut :

```typescript
// Sans ORM : SQL brut
const users = await db.query('SELECT * FROM users WHERE email = $1', [email])
// users est de type any, pas de validation, erreurs runtime

// Risques :
// - Typos dans les noms de colonnes (detectees au runtime seulement)
// - SQL injection si mal echappe
// - Types manuels a synchroniser avec la base
// - Migrations SQL ecrites a la main
```

### La solution Prisma

```typescript
// Avec Prisma : API TypeScript
const user = await prisma.user.findUnique({
  where: { email }
})
// user est de type User | null, autocompletion complete

// Avantages :
// - Erreurs de typo a la compilation
// - Pas de SQL injection (queries parametrees)
// - Types generes automatiquement depuis le schema
// - Migrations gerees par Prisma
```

### Comment Prisma fonctionne

```
                 ┌─────────────────────────────────────┐
                 │         schema.prisma               │
                 │  (source unique de verite)          │
                 └─────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
   │ prisma       │ │ prisma       │ │ @prisma/     │
   │ migrate dev  │ │ generate     │ │ client       │
   │              │ │              │ │              │
   │ Cree les     │ │ Genere le    │ │ API TypeScript│
   │ tables SQL   │ │ client TS    │ │ type-safe    │
   └──────────────┘ └──────────────┘ └──────────────┘
          │                │                │
          ▼                ▼                ▼
   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
   │ PostgreSQL   │ │ node_modules/│ │ Ton code     │
   │ (tables)     │ │ .prisma/     │ │ TypeScript   │
   └──────────────┘ └──────────────┘ └──────────────┘
```

### Pourquoi Prisma plutot que d'autres ORM ?

| ORM | Avantages | Inconvenients |
|-----|-----------|---------------|
| **Prisma** | Types generes, schema declaratif, excellent DX | Certaines queries complexes difficiles |
| **TypeORM** | Mature, patterns Active Record/Data Mapper | Types moins precis, config verbose |
| **Drizzle** | Proche du SQL, leger | Plus recent, moins de docs |
| **Sequelize** | Tres mature | JavaScript-first, types moins bons |
| **Knex** | Query builder flexible | Pas un vrai ORM, types manuels |

**Notre choix : Prisma** car :
1. Schema comme source unique de verite (important avec Pothos)
2. Types generes automatiquement
3. Migrations gerees simplement
4. Excellente documentation

---

## Pourquoi PostgreSQL ?

### Les alternatives

| Base | Avantages | Inconvenients |
|------|-----------|---------------|
| **PostgreSQL** | Full-text search, extensions, robuste | Plus lourd a installer |
| **SQLite** | Zero config, fichier local | Pas de full-text FR, limites en prod |
| **MySQL** | Populaire, performant | Full-text moins bon |
| **MongoDB** | Schema flexible | Pas SQL, joins complexes |

### Notre choix : PostgreSQL

Pour ce projet, on a besoin de :
- **Full-text search en francais** : PostgreSQL a un support natif avec stemming (`recherche` trouve `rechercher`, `recherches`, etc.)
- **Index trigrammes** : Pour la recherche partielle (`rivo` trouve `Rivoli`)
- **Performance sur 26M de lignes** : PostgreSQL gere ca sans probleme

SQLite ne supporte pas le full-text search en francais. MongoDB necessiterait des patterns differents.

---

## Options pour PostgreSQL

### Option A : Docker (recommande)

```bash
docker run --name postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=adresse_explorer \
  -p 5432:5432 \
  -d postgres:16
```

**Avantages** :
- Isole du systeme
- Version exacte controlee
- Facile a supprimer/recreer
- Meme setup pour toute l'equipe

**Verifier que ca tourne** :
```bash
docker ps | grep postgres
# Doit afficher le container avec status "Up"
```

### Option B : PostgreSQL local

**macOS** :
```bash
brew install postgresql@16
brew services start postgresql@16
createdb adresse_explorer
```

**Ubuntu/Debian** :
```bash
sudo apt install postgresql-16
sudo -u postgres createdb adresse_explorer
```

**Windows** :
Telecharger depuis [postgresql.org/download/windows](https://www.postgresql.org/download/windows/)

### Option C : Cloud (pour plus tard)

- **Neon** : Serverless, tier gratuit genereux
- **Supabase** : PostgreSQL + Auth + API
- **Railway** : Simple, bon pour le deploiement

On utilisera Railway au Step 17 pour le deploiement.

---

## Structure du projet API

Avant de creer les fichiers, comprends la structure :

```
apps/api/
├── prisma/
│   ├── schema.prisma       ← Definition des tables
│   └── migrations/         ← Historique SQL (genere)
│       └── 20240101_init/
│           └── migration.sql
├── src/
│   ├── index.ts            ← Point d'entree
│   └── lib/
│       └── prisma.ts       ← Instance Prisma partagee
├── package.json
└── tsconfig.json
```

---

## Fichiers a creer

### 1. `apps/api/package.json` (remplacer le contenu)

```json
{
  "name": "api",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:studio": "prisma studio",
    "db:push": "prisma db push",
    "db:reset": "prisma migrate reset"
  },
  "dependencies": {
    "@prisma/client": "^6.2.0"
  },
  "devDependencies": {
    "@types/node": "^22.10.0",
    "prisma": "^6.2.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0"
  }
}
```

**Explication des scripts** :

| Script | Usage | Quand l'utiliser |
|--------|-------|------------------|
| `dev` | Demarre avec hot-reload | Developpement quotidien |
| `db:generate` | Regenere le client TypeScript | Apres modif du schema |
| `db:migrate` | Cree et applique une migration | Quand tu changes le schema |
| `db:migrate:deploy` | Applique les migrations existantes | En production |
| `db:studio` | Interface web pour voir les donnees | Debug, exploration |
| `db:push` | Sync le schema sans migration | Prototype rapide |
| `db:reset` | Supprime tout et recommence | Quand tu veux repartir de zero |

### 2. `apps/api/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Points importants** :

- `module: "NodeNext"` : Pour utiliser les imports ESM (`import` au lieu de `require`)
- `strict: true` : TypeScript strict, attrape plus d'erreurs
- `outDir: "dist"` : Les fichiers compiles vont dans `dist/`

### 3. `apps/api/prisma/schema.prisma`

```prisma
// ============================================
// GENERATORS
// ============================================

// Genere le client TypeScript dans node_modules/.prisma/client
generator client {
  provider = "prisma-client-js"
}

// ============================================
// DATASOURCE
// ============================================

// Connexion PostgreSQL via variable d'environnement
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// MODELE DE TEST
// ============================================

// Un modele simple pour verifier que tout fonctionne
// On le remplacera par les vrais modeles au Step 06
model Test {
  id        Int      @id @default(autoincrement())
  name      String
  createdAt DateTime @default(now())

  // @@map renomme la table en SQL (convention snake_case)
  @@map("tests")
}
```

**Syntaxe Prisma expliquee** :

```prisma
model User {
  id        Int      @id @default(autoincrement())  // Cle primaire auto-incrementee
  email     String   @unique                        // Contrainte unique
  name      String?                                 // Nullable (? = optionnel)
  createdAt DateTime @default(now())                // Valeur par defaut
  posts     Post[]                                  // Relation 1-N

  @@map("users")                                    // Nom de table SQL
  @@index([email])                                  // Index pour la perf
}
```

### 4. `.env` (a la racine du monorepo)

```env
# ============================================
# DATABASE
# ============================================

# Format : postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/adresse_explorer?schema=public"

# Decomposition :
# - postgres:postgres = user:password (par defaut avec Docker)
# - localhost:5432 = host:port (port PostgreSQL standard)
# - adresse_explorer = nom de la base
# - schema=public = schema PostgreSQL (par defaut)
```

**Pourquoi a la racine ?** Prisma et dotenv cherchent le `.env` en remontant les dossiers. Le mettre a la racine permet a `apps/api` de le trouver.

### 5. `apps/api/src/lib/prisma.ts`

```typescript
import { PrismaClient } from '@prisma/client'

// ============================================
// SINGLETON PRISMA
// ============================================

// On cree une instance unique pour eviter :
// - Trop de connexions a la base
// - Memory leaks en dev avec le hot-reload

// En dev, le hot-reload recree les modules
// On stocke l'instance dans globalThis pour la reutiliser
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Creer ou reutiliser l'instance
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
```

**Pourquoi ce pattern singleton ?**

Sans ce pattern, chaque hot-reload en dev cree une nouvelle connexion :
```
Hot-reload 1 → PrismaClient() → connexion 1
Hot-reload 2 → PrismaClient() → connexion 2
Hot-reload 3 → PrismaClient() → connexion 3
...
→ "too many connections" error
```

Avec le singleton :
```
Hot-reload 1 → globalThis.prisma = PrismaClient()
Hot-reload 2 → globalThis.prisma existe, reutilise
Hot-reload 3 → globalThis.prisma existe, reutilise
→ Une seule connexion
```

### 6. `apps/api/src/index.ts`

```typescript
import { prisma } from './lib/prisma.js'

// ============================================
// TEST DE CONNEXION
// ============================================

async function main() {
  try {
    // Tester la connexion
    await prisma.$connect()
    console.log('✅ Connecte a PostgreSQL')

    // Afficher des infos sur la base
    const result = await prisma.$queryRaw<[{ version: string }]>`SELECT version()`
    console.log('📦 Version PostgreSQL:', result[0].version.split(',')[0])

    // Compter les enregistrements de test
    const count = await prisma.test.count()
    console.log(`📊 ${count} enregistrement(s) dans la table "tests"`)

    // Creer un enregistrement de test
    const testRecord = await prisma.test.create({
      data: { name: 'Premier test' }
    })
    console.log('✨ Enregistrement cree:', testRecord)

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
```

---

## Commandes a executer

### 1. Demarrer PostgreSQL (si Docker)

```bash
# Si le container existe deja
docker start postgres

# Sinon, le creer
docker run --name postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=adresse_explorer \
  -p 5432:5432 \
  -d postgres:16
```

### 2. Installer les dependances

```bash
# A la racine du monorepo
npm install
```

### 3. Generer le client Prisma

```bash
cd apps/api
npx prisma generate
```

Cette commande :
1. Lit `prisma/schema.prisma`
2. Genere `node_modules/.prisma/client/`
3. Cree les types TypeScript pour tes modeles

### 4. Creer la premiere migration

```bash
npx prisma migrate dev --name init
```

Cette commande :
1. Compare le schema avec la base
2. Genere un fichier SQL dans `prisma/migrations/`
3. Execute le SQL sur la base
4. Regenere le client

**Tu verras** :
```
Applying migration `20240115123456_init`

The following migration(s) have been created and applied:

migrations/
  └─ 20240115123456_init/
    └─ migration.sql

✔ Generated Prisma Client
```

### 5. Tester la connexion

```bash
npm run dev
```

---

## Checkpoint

### Console attendue

```
✅ Connecte a PostgreSQL
📦 Version PostgreSQL: PostgreSQL 16.x
📊 0 enregistrement(s) dans la table "tests"
✨ Enregistrement cree: { id: 1, name: 'Premier test', createdAt: 2024-... }
📋 Tous les tests: [ { id: 1, name: 'Premier test', createdAt: 2024-... } ]
```

### Verifier avec Prisma Studio

```bash
cd apps/api
npx prisma studio
```

Ouvre `http://localhost:5555` dans ton navigateur.

**Tu dois voir** :
- La table `tests` dans la sidebar
- L'enregistrement "Premier test" dans la table
- Tu peux ajouter/modifier/supprimer des enregistrements directement

### Verifier le fichier de migration

```bash
cat apps/api/prisma/migrations/*/migration.sql
```

Tu verras le SQL genere :
```sql
CREATE TABLE "tests" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tests_pkey" PRIMARY KEY ("id")
);
```

---

## Pieges courants

| Probleme | Cause | Solution |
|----------|-------|----------|
| `Connection refused` | PostgreSQL pas demarre | `docker start postgres` ou verifier le service |
| `database "adresse_explorer" does not exist` | Base pas creee | `docker exec -it postgres createdb adresse_explorer` |
| `Cannot find module '@prisma/client'` | Client pas genere | `npx prisma generate` |
| `.env` pas lu | Mauvais emplacement | `.env` doit etre a la racine du monorepo |
| `P1001: Can't reach database server` | Mauvais host/port | Verifier `DATABASE_URL` dans `.env` |
| `password authentication failed` | Mauvais mot de passe | Verifier `postgres:postgres` dans l'URL |
| Types pas a jour apres modif schema | Client pas regenere | `npx prisma generate` |

---

## Comprendre le workflow Prisma

### Workflow de developpement

```
1. Tu modifies schema.prisma
      │
      ▼
2. npx prisma migrate dev --name describe_change
      │
      ├─── Genere migrations/TIMESTAMP_describe_change/migration.sql
      ├─── Execute le SQL sur la base
      └─── Regenere le client TypeScript
      │
      ▼
3. Tu utilises les nouveaux types dans ton code
```

### Workflow de production

```
1. Tu as les fichiers de migration dans Git
      │
      ▼
2. npx prisma migrate deploy
      │
      └─── Execute UNIQUEMENT les migrations pas encore appliquees
           (ne genere rien de nouveau)
      │
      ▼
3. L'application demarre avec le schema a jour
```

### Difference entre les commandes

| Commande | Quand l'utiliser | Ce qu'elle fait |
|----------|------------------|-----------------|
| `migrate dev` | Dev | Cree ET applique la migration |
| `migrate deploy` | Prod | Applique les migrations existantes |
| `db push` | Prototype | Sync sans creer de migration |
| `generate` | Apres modif | Regenere le client TypeScript |
| `studio` | Debug | Interface web pour les donnees |
| `migrate reset` | Reset | Supprime tout et recommence |

---

## Structure finale

```
adresse-explorer/
├── .env                          ← DATABASE_URL ici
├── apps/
│   ├── api/
│   │   ├── prisma/
│   │   │   ├── schema.prisma     ← Definition des modeles
│   │   │   └── migrations/       ← Historique SQL
│   │   │       └── 20240115_init/
│   │   │           └── migration.sql
│   │   ├── src/
│   │   │   ├── index.ts          ← Point d'entree
│   │   │   └── lib/
│   │   │       └── prisma.ts     ← Singleton Prisma
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/
└── package.json
```

---

## Pour aller plus loin

### Logging avance

```typescript
const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
  ],
})

// Ecouter les queries
prisma.$on('query', (e) => {
  console.log('Query:', e.query)
  console.log('Params:', e.params)
  console.log('Duration:', e.duration, 'ms')
})
```

### Middleware Prisma

```typescript
// Logger toutes les operations
prisma.$use(async (params, next) => {
  const before = Date.now()
  const result = await next(params)
  const after = Date.now()

  console.log(`${params.model}.${params.action} took ${after - before}ms`)

  return result
})
```

---

## Prochaine etape

→ [06-prisma-schema.md](./06-prisma-schema.md) : Modeliser Departement, Commune, Voie, Numero pour les adresses BAN
