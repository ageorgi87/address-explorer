# GeoQuiz

Quiz géographique interactif pour tester vos connaissances des adresses françaises.

## Aperçu

GeoQuiz est une application full-stack qui permet aux utilisateurs de localiser des adresses sur une carte interactive. L'application utilise les données de la Base Adresse Nationale (BAN) pour proposer des quiz sur les communes françaises.

**Fonctionnalités principales :**
- Recherche de communes avec autocomplétion
- Navigation par départements avec lazy loading
- Quiz interactif : devinez l'emplacement d'une adresse sur la carte
- Système de scoring basé sur la distance (formule de Haversine)
- Interface glassmorphism moderne en dark mode

## Stack technique

| Couche | Technologies |
|--------|-------------|
| **Frontend** | Nuxt 3, Vue 3, TypeScript, Tailwind CSS, Nuxt UI |
| **Cartes** | MapLibre GL JS, CARTO Voyager |
| **API** | GraphQL Yoga, Node.js |
| **Base de données** | PostgreSQL, Prisma ORM |
| **Monorepo** | pnpm workspaces |

## Prérequis

- Node.js 20+
- pnpm 9+
- PostgreSQL 15+

## Installation

```bash
# Cloner le repository
git clone https://github.com/ageorgi87/address-explorer.git
cd address-explorer

# Installer les dépendances
pnpm install

# Configurer les variables d'environnement
cp apps/api/.env.example apps/api/.env
# Éditer apps/api/.env avec votre DATABASE_URL
```

## Lancement en développement

```bash
# Terminal 1 : API GraphQL (port 4000)
pnpm --filter api dev

# Terminal 2 : Frontend Nuxt (port 3000)
pnpm --filter web dev
```

Ou en une commande :

```bash
pnpm dev
```

## Base de données

```bash
# Appliquer les migrations
pnpm --filter api db:push

# Importer les données BAN (optionnel)
pnpm --filter api db:seed
```

## Applications

| App | Description | Documentation |
|-----|-------------|---------------|
| [apps/api](./apps/api) | API GraphQL avec Yoga et Prisma | [README](./apps/api/README.md) |
| [apps/web](./apps/web) | Frontend Nuxt 3 avec quiz interactif | [README](./apps/web/README.md) |

## Scripts disponibles

```bash
pnpm dev          # Lancer toutes les apps en dev
pnpm build        # Build de production
pnpm lint         # Linter (ESLint + Prettier)
pnpm typecheck    # Vérification TypeScript
```

## Licence

MIT
