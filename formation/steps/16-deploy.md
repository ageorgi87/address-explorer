# Step 16 : Sécuriser et déployer

> **Commit** : `step-16-deploy`
> **Durée** : ~60 min
> **Prérequis** : Step 15 complété, comptes Railway + Vercel

---

## Objectif

Déployer l'application en production avec les bonnes pratiques de sécurité.

À la fin de ce step :
- Tu as sécurisé ton API GraphQL contre les abus
- L'API est déployée sur Railway
- Le front est déployé sur Vercel
- Tu comprends les risques GraphQL et comment les mitiger

---

## Pourquoi sécuriser GraphQL ?

### Le problème : GraphQL expose trop par défaut

```graphql
# Query malveillante : profondeur infinie
{
  departements {        # Niveau 1
    communes {          # Niveau 2
      voies {           # Niveau 3
        numeros {       # Niveau 4
          voie {        # Niveau 5 - Boucle !
            commune {   # Niveau 6
              departement {  # Niveau 7
                communes {   # Niveau 8
                  # ... infini
                }
              }
            }
          }
        }
      }
    }
  }
}
```

### Comparaison REST vs GraphQL

| Risque | REST | GraphQL |
|--------|------|---------|
| Query profonde | ❌ Impossible | ⚠️ Possible par défaut |
| Over-fetching | ❌ Endpoint retourne toujours pareil | ⚠️ Client demande ce qu'il veut |
| N+1 queries | ⚠️ Possible | ⚠️ Très courant |
| Introspection | ❌ Pas d'équivalent | ⚠️ Schema exposé |
| Coût de query | Prévisible | Variable selon la query |

### Tableau des risques GraphQL

| Risque | Description | Impact | Solution |
|--------|-------------|--------|----------|
| **Query bombing** | Queries très profondes | CPU/mémoire serveur | Depth limit |
| **DOS par complexité** | Trop de relations | Base de données surchargée | Cost analysis |
| **Introspection leak** | Schema exposé en prod | Reconnaissance attaquant | Désactiver introspection |
| **N+1 queries** | Requêtes SQL explosives | Latence, charge DB | DataLoader / Prisma include |
| **Batching attack** | Multiples opérations | Bypass rate limiting | Limiter batch size |

---

## Solutions de sécurité

### Option 1 : graphql-armor (recommandé)

```bash
cd apps/api
npm install @escape.tech/graphql-armor
```

**Pourquoi graphql-armor ?**
- Plugins prêts à l'emploi
- Configuration simple
- Maintenu activement
- Compatible Yoga

### Option 2 : Plugins manuels

Plus de contrôle mais plus de code.

### Tableau comparatif

| Solution | Avantages | Inconvénients |
|----------|-----------|---------------|
| **graphql-armor** | Prêt à l'emploi, testé | Moins flexible |
| **Plugins manuels** | Contrôle total | Plus de code à maintenir |
| **Rate limiting externe** | Découplé | Infrastructure additionnelle |
| **WAF (Cloudflare)** | Protection réseau | Ne comprend pas GraphQL |

---

## Les fichiers à modifier

### 1. Modifier `apps/api/src/index.ts`

```typescript
/**
 * Point d'entrée de l'API GraphQL.
 *
 * Architecture :
 *
 * ┌─────────────────────────────────────────────────┐
 * │  Requête GraphQL entrante                       │
 * │              │                                  │
 * │              ▼                                  │
 * │  ┌─────────────────────────────────┐           │
 * │  │  Plugins de sécurité            │           │
 * │  │  - maxDepthPlugin (profondeur)  │           │
 * │  │  - costLimitPlugin (complexité) │           │
 * │  │  - maxTokensPlugin (taille)     │           │
 * │  └─────────────────────────────────┘           │
 * │              │                                  │
 * │              ▼                                  │
 * │  ┌─────────────────────────────────┐           │
 * │  │  GraphQL Yoga                   │           │
 * │  │  - Parse la query               │           │
 * │  │  - Exécute les resolvers        │           │
 * │  │  - Retourne la réponse          │           │
 * │  └─────────────────────────────────┘           │
 * │              │                                  │
 * │              ▼                                  │
 * │  Réponse JSON                                  │
 * └─────────────────────────────────────────────────┘
 */

import { createServer } from 'node:http'
import { createYoga } from 'graphql-yoga'
// ============================================================
// IMPORT GRAPHQL-ARMOR
// ============================================================
// @escape.tech/graphql-armor fournit des plugins de sécurité
// prêts à l'emploi pour GraphQL Yoga.
//
// Alternatives :
// - Écrire ses propres plugins (plus de contrôle)
// - Utiliser un WAF externe (Cloudflare, etc.)
// ============================================================
import {
  costLimitPlugin,
  maxDepthPlugin,
  maxTokensPlugin
} from '@escape.tech/graphql-armor'
import { schema } from './schema/index.js'
import { prisma } from './lib/prisma.js'

// ============================================================
// DÉTECTER L'ENVIRONNEMENT
// ============================================================
// process.env.NODE_ENV est défini par :
// - Ton script npm (cross-env NODE_ENV=production)
// - La plateforme de déploiement (Railway, Vercel)
//
// En production, on veut :
// - Désactiver GraphiQL
// - Masquer les erreurs détaillées
// - Appliquer les protections
// ============================================================

const isProduction = process.env.NODE_ENV === 'production'

const yoga = createYoga({
  schema,

  // Context disponible dans tous les resolvers
  context: () => ({ prisma }),

  // ============================================================
  // GRAPHIQL
  // ============================================================
  // L'explorateur GraphQL interactif.
  // En prod, on le désactive pour ne pas exposer le schema.
  //
  // Alternative : Activer mais avec authentification.
  // ============================================================

  graphiql: !isProduction,

  // ============================================================
  // ERREURS MASQUÉES
  // ============================================================
  // En prod, les erreurs détaillées sont masquées.
  // Le client voit "Internal server error" au lieu du stack trace.
  //
  // Important pour la sécurité : pas d'infos sensibles exposées.
  // ============================================================

  maskedErrors: isProduction,

  // ============================================================
  // PLUGINS DE SÉCURITÉ
  // ============================================================
  // Ces plugins analysent chaque query AVANT exécution.
  // Si une query dépasse les limites, elle est rejetée.
  // ============================================================

  plugins: [
    // ============================================================
    // MAX DEPTH PLUGIN
    // ============================================================
    // Limite la profondeur des queries.
    //
    // Profondeur = nombre de niveaux d'imbrication.
    //
    // { departements { communes { voies } } }
    //        1            2         3
    //
    // Avec n=6, on peut faire 6 niveaux max.
    // Les queries d'introspection sont ignorées (pour les outils).
    // ============================================================

    maxDepthPlugin({
      n: 6,  // Profondeur max
      ignoreIntrospection: true  // Ne pas compter __schema, __type
    }),

    // ============================================================
    // COST LIMIT PLUGIN
    // ============================================================
    // Limite la "complexité" d'une query.
    //
    // Le coût est calculé ainsi :
    // - Chaque objet = objectCost (1 par défaut)
    // - Chaque scalaire = scalarCost (0 par défaut)
    // - Multiplicateur par niveau = depthCostFactor
    //
    // Exemple avec depthCostFactor=1.5 :
    // { departements { communes { nom } } }
    //
    // Si departements retourne 100 items :
    // Coût = 100 objets × 1.5^1 = 150
    //
    // Si communes retourne 3500 items au total :
    // Coût += 3500 × 1.5^2 = 7875
    //
    // Total = 8025 → REJETÉ si maxCost=5000
    // ============================================================

    costLimitPlugin({
      maxCost: 5000,          // Coût max autorisé
      objectCost: 1,          // Coût par objet
      scalarCost: 0,          // Coût par champ scalaire
      depthCostFactor: 1.5    // Multiplicateur par niveau
    }),

    // ============================================================
    // MAX TOKENS PLUGIN
    // ============================================================
    // Limite la taille de la query (nombre de tokens).
    //
    // Token ≈ mot ou symbole dans la query.
    // Protège contre les queries absurdement longues.
    //
    // Exemple : "{ departements { code nom } }" = ~6 tokens
    // ============================================================

    maxTokensPlugin({
      n: 1000  // Tokens max
    })
  ]
})

const server = createServer(yoga)

// ============================================================
// PORT
// ============================================================
// process.env.PORT est défini par la plateforme (Railway, Heroku).
// En dev, on utilise 4000 par défaut.
// ============================================================

const port = process.env.PORT ?? 4000

server.listen(port, () => {
  console.log(`🚀 API running on http://localhost:${port}/graphql`)
  if (isProduction) {
    console.log('🔒 Production mode: GraphiQL disabled, errors masked')
  }
})
```

### 2. Créer les fichiers .env.example

Ces fichiers documentent les variables nécessaires.

**`apps/api/.env.example`**

```env
# ============================================================
# BASE DE DONNÉES
# ============================================================
# URL de connexion PostgreSQL.
# Format : postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA
#
# En local (Docker) :
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/adresse_explorer?schema=public"
#
# Sur Railway :
# Railway fournit automatiquement DATABASE_URL quand tu ajoutes PostgreSQL.
# ============================================================
DATABASE_URL="postgresql://user:pass@localhost:5432/db?schema=public"

# ============================================================
# ENVIRONNEMENT
# ============================================================
# "development" : GraphiQL actif, erreurs détaillées
# "production" : GraphiQL désactivé, erreurs masquées
# ============================================================
NODE_ENV="development"

# ============================================================
# PORT
# ============================================================
# Port d'écoute du serveur HTTP.
# Railway/Render définissent automatiquement PORT.
# ============================================================
PORT="4000"
```

**`apps/web/.env.example`**

```env
# ============================================================
# API GRAPHQL
# ============================================================
# URL de l'API GraphQL.
#
# IMPORTANT : Le préfixe NUXT_PUBLIC_ est obligatoire pour
# que la variable soit accessible côté client.
#
# En local :
# NUXT_PUBLIC_GRAPHQL_URL="http://localhost:4000/graphql"
#
# En prod (exemple Railway) :
# NUXT_PUBLIC_GRAPHQL_URL="https://mon-api.up.railway.app/graphql"
# ============================================================
NUXT_PUBLIC_GRAPHQL_URL="http://localhost:4000/graphql"
```

### 3. Créer le Dockerfile pour l'API

**`apps/api/Dockerfile`**

```dockerfile
# ============================================================
# DOCKERFILE MULTI-STAGE
# ============================================================
# Stage 1 : Build (node complet + devDeps)
# Stage 2 : Production (node slim + runtime seulement)
#
# Résultat : image plus petite, plus sécurisée.
# ============================================================

# ============================================================
# STAGE 1 : BUILD
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances d'abord
# (optimise le cache Docker)
COPY package*.json ./
COPY prisma ./prisma/

# Installer TOUTES les dépendances (y compris devDeps pour le build)
RUN npm ci

# Générer le client Prisma
# Nécessaire avant le build TypeScript
RUN npx prisma generate

# Copier le code source
COPY . .

# Build TypeScript → JavaScript
RUN npm run build

# ============================================================
# STAGE 2 : PRODUCTION
# ============================================================
FROM node:20-slim

# Prisma a besoin de OpenSSL
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copier seulement ce qui est nécessaire depuis le builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma/
COPY --from=builder /app/dist ./dist/
COPY --from=builder /app/node_modules ./node_modules/

# Script de démarrage (migrations + serveur)
COPY start.sh ./
RUN chmod +x start.sh

# Port exposé (informatif pour Docker)
EXPOSE 4000

# Variables d'environnement par défaut
ENV NODE_ENV=production

# Commande de démarrage
CMD ["./start.sh"]
```

### 4. Créer le script de démarrage

**`apps/api/start.sh`**

```bash
#!/bin/bash
# ============================================================
# SCRIPT DE DÉMARRAGE PRODUCTION
# ============================================================
# Ce script :
# 1. Applique les migrations Prisma
# 2. Démarre le serveur Node.js
#
# Pourquoi un script ?
# - Les migrations doivent s'exécuter AVANT le serveur
# - On veut un seul point d'entrée pour Docker
# ============================================================

set -e  # Arrêter si une commande échoue

echo "🔄 Applying database migrations..."

# ============================================================
# MIGRATIONS PRISMA
# ============================================================
# `prisma migrate deploy` applique les migrations existantes.
# Contrairement à `migrate dev`, il ne crée PAS de nouvelles migrations.
# C'est ce qu'on veut en production.
# ============================================================

npx prisma migrate deploy

echo "✅ Migrations applied"
echo "🚀 Starting server..."

# ============================================================
# DÉMARRER LE SERVEUR
# ============================================================
# Le fichier compilé est dans dist/index.js
# ============================================================

node dist/index.js
```

### 5. Configurer le front pour Vercel

**`apps/web/vercel.json`** (optionnel, Vercel détecte Nuxt automatiquement)

```json
{
  "framework": "nuxtjs",
  "buildCommand": "nuxt build",
  "outputDirectory": ".output"
}
```

---

## Déploiement Railway (API)

### 1. Créer le projet Railway

```bash
# Installer Railway CLI
npm install -g @railway/cli

# Se connecter
railway login

# À la racine du monorepo
railway init
```

### 2. Configurer Railway

Dans le dashboard Railway :

1. **Ajouter PostgreSQL**
   - New → Database → PostgreSQL
   - Railway crée automatiquement `DATABASE_URL`

2. **Configurer le service API**
   - New → GitHub repo (ou Empty project)
   - Root Directory : `apps/api`
   - Build Command : `npm run build`
   - Start Command : `./start.sh`

3. **Variables d'environnement**
   - `DATABASE_URL` : fourni automatiquement par Railway PostgreSQL
   - `NODE_ENV` : `production`
   - `PORT` : laisse Railway le définir

### 3. Déployer

```bash
cd apps/api
railway up
```

Ou connecter à GitHub pour déploiement automatique.

---

## Déploiement Vercel (Front)

### 1. Connecter le projet

```bash
# Installer Vercel CLI
npm install -g vercel

# À la racine de apps/web
cd apps/web
vercel
```

### 2. Configurer Vercel

Dans le dashboard Vercel :

1. **Framework Preset** : Nuxt.js (détecté auto)
2. **Root Directory** : `apps/web`
3. **Variables d'environnement** :
   - `NUXT_PUBLIC_GRAPHQL_URL` : URL de ton API Railway

### 3. Déployer

```bash
vercel --prod
```

---

## Comprendre les plugins de sécurité

### maxDepthPlugin visualisé

```graphql
# Profondeur 1
{ departements { nom } }

# Profondeur 3 - OK avec limite 6
{
  departements {        # 1
    communes {          # 2
      voies { nom }     # 3
    }
  }
}

# Profondeur 7 - BLOQUÉ avec limite 6
{
  departements {        # 1
    communes {          # 2
      voies {           # 3
        numeros {       # 4
          voie {        # 5
            commune {   # 6
              departement { nom }  # 7 ❌ REJETÉ
            }
          }
        }
      }
    }
  }
}
```

**Message d'erreur :**
```json
{
  "errors": [{
    "message": "Query is too deep. Maximum depth is 6, found 7."
  }]
}
```

### costLimitPlugin visualisé

```graphql
# Coût estimé
# objectCost=1, depthCostFactor=1.5

{
  departements {         # 100 départements × 1.5^1 = 150
    communes {           # 3500 communes × 1.5^2 = 7875
      nom                # scalaire, coût 0
    }
  }
}

# Total : 150 + 7875 = 8025
# Si maxCost=5000 → ❌ REJETÉ
```

**Message d'erreur :**
```json
{
  "errors": [{
    "message": "Query is too expensive. Maximum cost is 5000, found 8025."
  }]
}
```

---

## Commandes à exécuter

### Tester la sécurité en local

```bash
# Terminal 1 : Lancer l'API en mode production
NODE_ENV=production npm run dev:api
```

```bash
# Terminal 2 : Tester une query trop profonde
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ departements { communes { voies { numeros { voie { commune { departement { nom } } } } } } } }"
  }'
```

**Tu dois voir** : Erreur "Query is too deep"

### Déployer

```bash
# API sur Railway
cd apps/api
railway up

# Front sur Vercel
cd apps/web
vercel --prod
```

---

## Checkpoint ✓

### 1. Sécurité locale

1. Lance l'API en mode prod : `NODE_ENV=production npm run dev:api`
2. GraphiQL doit être désactivé (`http://localhost:4000/graphql` → pas d'interface)
3. Test query trop profonde → erreur

### 2. Déploiement API

1. URL Railway accessible
2. GraphQL répond : `curl https://ton-api.up.railway.app/graphql -d '{"query":"{__typename}"}'`
3. GraphiQL désactivé en prod

### 3. Déploiement Front

1. URL Vercel accessible
2. Recherche fonctionne (appelle l'API Railway)
3. Pages communes avec cartes

### 4. Test end-to-end

1. Ouvre `https://ton-front.vercel.app`
2. Recherche "rivoli"
3. Clique sur un résultat
4. La carte s'affiche avec les markers

---

## Pièges courants

| Problème | Cause | Solution |
|----------|-------|----------|
| CORS error | API n'autorise pas le domaine | Yoga accepte tout par défaut, vérifier |
| Build Vercel échoue | Dépendances manquantes | Vérifier `package.json` |
| Prisma erreur | Client pas généré | `postinstall: prisma generate` |
| Variables non lues | Mauvais préfixe | `NUXT_PUBLIC_` obligatoire pour le client |
| Migrations échouent | DB pas accessible | Vérifier DATABASE_URL |
| Port déjà utilisé | Railway définit PORT | Utiliser `process.env.PORT` |

---

## Checklist finale

- [ ] graphql-armor installé et configuré
- [ ] Introspection désactivée en prod (GraphiQL off)
- [ ] Variables d'environnement documentées (.env.example)
- [ ] Dockerfile fonctionnel et testé
- [ ] Migrations exécutées au démarrage (start.sh)
- [ ] API déployée sur Railway
- [ ] Front déployé sur Vercel
- [ ] CORS configuré (si nécessaire)
- [ ] Test end-to-end réussi

---

## Pour aller plus loin

### Monitoring

| Service | Usage | Gratuit |
|---------|-------|---------|
| **Sentry** | Error tracking | Oui (limite) |
| **Axiom** | Logs | Oui (limite) |
| **Grafana Cloud** | Métriques | Oui (limite) |
| **Apollo Studio** | GraphQL analytics | Oui (limite) |

### Rate Limiting

```typescript
// Avec graphql-rate-limit
import { createRateLimitDirective } from 'graphql-rate-limit'

const rateLimitDirective = createRateLimitDirective({
  identifyContext: (ctx) => ctx.req.ip,  // Par IP
})

// Dans le schema :
// type Query {
//   searchVoies(search: String!): [Voie!]! @rateLimit(limit: 10, duration: 60)
// }
```

### Cache Redis

```typescript
import { createRedisCache } from '@envelop/response-cache-redis'

const cache = createRedisCache({
  redis: new Redis(process.env.REDIS_URL),
})

// Plugin pour Yoga
responseCache({
  cache,
  ttl: 60 * 1000,  // 1 minute
})
```

---

## Félicitations !

Tu as complété la formation. Tu sais maintenant :

- ✅ Structurer un monorepo Nuxt + API
- ✅ Utiliser la réactivité Vue (`ref`, `computed`, `watch`)
- ✅ Créer des composables (hooks Vue)
- ✅ Modéliser et importer des données avec Prisma
- ✅ Construire une API GraphQL avec Yoga + Pothos
- ✅ Connecter Nuxt à GraphQL avec Apollo
- ✅ Gérer le SSR avec `useAsyncData`
- ✅ Créer des routes dynamiques
- ✅ Intégrer des composants client-only (carte)
- ✅ Sécuriser et déployer en production

---

## Ressources

| Sujet | Documentation |
|-------|---------------|
| Nuxt | [nuxt.com/docs](https://nuxt.com/docs) |
| Vue 3 | [vuejs.org/guide](https://vuejs.org/guide/introduction.html) |
| GraphQL | [graphql.org/learn](https://graphql.org/learn/) |
| Pothos | [pothos-graphql.dev](https://pothos-graphql.dev/) |
| Prisma | [prisma.io/docs](https://www.prisma.io/docs) |
| Railway | [docs.railway.app](https://docs.railway.app) |
| Vercel | [vercel.com/docs](https://vercel.com/docs) |
| GraphQL Armor | [escape.tech/graphql-armor](https://escape.tech/graphql-armor) |
