# GeoQuiz API

API GraphQL pour l'application GeoQuiz, exposant les données géographiques françaises.

## Stack

| Technologie | Rôle |
|-------------|------|
| Node.js 20+ | Runtime |
| GraphQL Yoga | Serveur GraphQL |
| Prisma | ORM |
| PostgreSQL | Base de données |
| TypeScript | Langage |

## Configuration

Créer un fichier `.env` à la racine de `apps/api` :

```env
DATABASE_URL="postgresql://user:password@localhost:5432/geoquiz"
```

## Lancement

```bash
# Développement (hot reload)
pnpm dev

# Production
pnpm build && pnpm start
```

L'API sera disponible sur `http://localhost:4000/graphql` avec GraphiQL en mode développement.

## Base de données

### Migrations

```bash
# Appliquer le schéma Prisma à la base
pnpm db:push

# Générer le client Prisma
pnpm db:generate
```

### Modèles

| Modèle | Description |
|--------|-------------|
| `Departement` | Département français (code, nom) |
| `Commune` | Commune avec code postal et lien vers département |
| `Voie` | Rue/avenue/etc. appartenant à une commune |
| `Numero` | Numéro d'adresse avec coordonnées GPS (lat, lon) |

### Import des données

Les données proviennent de la [Base Adresse Nationale (BAN)](https://adresse.data.gouv.fr/).

## Schema GraphQL

### Queries principales

```graphql
# Liste des départements avec nombre de communes
query {
  departements {
    code
    nom
    communeCount
  }
}

# Détails d'une commune avec ses voies et adresses
query {
  commune(codeInsee: "67482") {
    nom
    codePostal
    voies {
      nom
      numeros {
        numero
        lat
        lon
      }
    }
  }
}

# Recherche de communes
query {
  searchCommunes(search: "Stras", first: 10) {
    id
    nom
    codePostal
  }
}
```

## Architecture Schema-First

Le schema GraphQL est la source de vérité. Les types TypeScript sont générés automatiquement.

```
src/
├── config/          # Configuration (GraphiQL)
├── generated/       # Types générés (ne pas éditer)
├── lib/             # Utilitaires (prisma client)
├── resolvers/       # Resolvers GraphQL par domaine
├── schema/          # Définitions de types GraphQL (SDL)
└── index.ts         # Point d'entrée du serveur
```

### Ajouter un nouveau type GraphQL

1. Créer le fichier de schéma dans `src/schema/montype.ts`
2. Créer le resolver correspondant dans `src/resolvers/montype.ts`
3. Importer et merger dans `src/index.ts`
4. Regénérer les types : `pnpm codegen`

## Scripts

```bash
pnpm dev          # Développement avec hot reload
pnpm build        # Build de production
pnpm start        # Lancer le build
pnpm codegen      # Générer les types TypeScript
pnpm db:generate  # Générer le client Prisma
pnpm db:push      # Appliquer le schéma à la base
pnpm db:studio    # Ouvrir Prisma Studio (GUI)
```

## Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `DATABASE_URL` | URL de connexion PostgreSQL | - |
| `PORT` | Port du serveur | 4000 |
| `NODE_ENV` | Environnement | development |
