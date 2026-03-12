# GeoQuiz Web

Frontend de l'application GeoQuiz, un quiz géographique interactif.

## Stack

| Technologie | Rôle |
|-------------|------|
| Nuxt 3 | Framework Vue full-stack |
| Vue 3 | Framework UI (Composition API) |
| TypeScript | Langage |
| Tailwind CSS | Styles utilitaires |
| Nuxt UI | Composants UI |
| MapLibre GL | Cartes interactives |
| Apollo Client | Client GraphQL |

## Configuration

L'application se connecte à l'API GraphQL. Par défaut : `http://localhost:4000/graphql`.

Pour modifier l'URL de l'API, créer un fichier `.env` :

```env
NUXT_PUBLIC_GRAPHQL_URL="https://api.example.com/graphql"
```

## Lancement

```bash
# Développement (hot reload)
pnpm dev

# Production
pnpm build && pnpm preview
```

L'application sera disponible sur `http://localhost:3000`.

## Fonctionnalités

### Page d'accueil (`/`)

- Recherche de communes avec autocomplétion (debounced)
- Statistiques : nombre de départements et communes
- Accordéon des départements avec lazy loading des communes

### Page Quiz (`/communes/[codeInsee]`)

- Affichage de la commune sélectionnée
- Quiz interactif : trouver l'emplacement d'adresses sur la carte
- Système de scoring basé sur la distance (Haversine)
- 10 questions par partie
- Écran de résultats avec rating

## Architecture

```
app/
├── assets/css/       # Styles globaux (variables CSS, glassmorphism)
├── components/       # Composants Vue
│   ├── AddressMap/   # Carte simple avec markers
│   ├── Quiz/         # Composants du quiz
│   │   ├── config/   # Configuration (map, quiz)
│   │   └── lib/      # Fonctions utilitaires (scoring, distance)
│   └── *.vue         # Composants partagés
├── pages/            # Routes automatiques (file-based routing)
└── queries/          # Queries GraphQL avec types
```

### Conventions

- **Imports absolus** : utiliser `~/` pour tous les imports cross-feature
- **Composants client** : suffixe `.client.vue` pour les composants browser-only (MapLibre)
- **Lib functions** : une fonction par fichier, JSDoc en tête de fichier
- **Auto-imports** : `ref`, `computed`, `watch`, `onMounted` sont auto-importés par Nuxt

## Composants principaux

| Composant | Description |
|-----------|-------------|
| `QuizGame` | Orchestrateur du quiz (state, scoring) |
| `QuizMap` | Carte interactive avec click pour deviner |
| `QuizQuestion` | Affichage de l'adresse à trouver |
| `QuizResult` | Résultat après validation (distance, points) |
| `QuizFinal` | Écran de fin avec score total |
| `GlassCard` | Composant UI glassmorphism |
| `DepartementAccordion` | Liste des départements avec lazy loading |

## Design System

L'application utilise un design glassmorphism en dark mode.

### Variables CSS (`assets/css/main.css`)

```css
--geo-bg: #0f0f1a;           /* Fond principal */
--geo-primary: #6366f1;       /* Couleur primaire (indigo) */
--geo-success: #10b981;       /* Succès (emerald) */
--geo-border: rgba(255,255,255,0.1);  /* Bordures glass */
```

### Classes utilitaires

- `.glass` : effet glassmorphism (backdrop-blur + bordure)
- `.gradient-text` : texte avec dégradé coloré
- `.score-pop` : animation d'apparition du score

## Scripts

```bash
pnpm dev          # Développement
pnpm build        # Build de production
pnpm preview      # Prévisualiser le build
pnpm typecheck    # Vérification TypeScript
pnpm lint         # Linter ESLint
```

## Carte

La carte utilise MapLibre GL avec le style CARTO Voyager (léger et lisible).

### Ajouter un nouveau style de carte

Modifier `components/Quiz/config/mapConfig.ts` :

```typescript
export const CUSTOM_STYLE = {
  version: 8,
  sources: { /* ... */ },
  layers: [ /* ... */ ]
}
```

## Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `NUXT_PUBLIC_GRAPHQL_URL` | URL de l'API GraphQL | `http://localhost:4000/graphql` |
