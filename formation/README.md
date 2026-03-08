# Formation : Vue 3 + Nuxt 4 + GraphQL

> **Pour qui** : Developpeurs React/Next.js qui veulent apprendre Vue/Nuxt et GraphQL backend
> **Duree** : ~15-20h (a ton rythme)
> **Projet final** : Explorateur de 26M d'adresses francaises

---

## Philosophie de la formation

Cette formation n'est PAS un tutoriel "copie-colle et ca marche". C'est une **formation pedagogique** ou chaque concept est explique en profondeur.

### Ce que tu vas apprendre a chaque step

Pour chaque etape, on couvre systematiquement :

1. **Le "Pourquoi"** — Pourquoi on fait ce choix technique ?
2. **Les alternatives** — Quelles autres options existent et pourquoi on ne les choisit pas ?
3. **Comparaison React/Next.js** — Comment tu ferais en React et pourquoi Vue/Nuxt fait differemment ?
4. **Comment ca marche** — L'implementation technique avec explications ligne par ligne
5. **Les pieges courants** — Les erreurs classiques et comment les eviter

### Exemple : Step 01 - Monorepo

Au lieu de juste faire `mkdir apps && npm init`, on explique :

- **Pourquoi separer front et API ?** Comparaison avec les API Routes de Next.js, limites du serverless, scaling independant
- **Pourquoi un monorepo ?** Atomic commits, types partages, vs deux repos separes
- **Pourquoi npm workspaces ?** Comparaison avec pnpm, Yarn, Turborepo, Nx
- **Comment ca marche ?** Le role de `workspaces: ["apps/*"]`, les symlinks, ou vont les node_modules

---

## Instructions pour Claude Code

> **IMPORTANT** : Ces instructions definissent comment Claude Code doit executer chaque step.

### Mode d'execution

Quand l'utilisateur demande de faire un step :

1. **Lire le fichier du step** en entier
2. **Expliquer le contexte** avant toute action :
   - Quel est l'objectif ?
   - Pourquoi on fait ca ? (pas juste "comment")
   - Quelles alternatives existent et pourquoi ce choix ?
   - Comparaison avec React/Next.js si pertinent
3. **Expliquer chaque fichier** avant de le creer :
   - Son role dans l'architecture
   - Chaque ligne ou bloc important
   - Les choix de conception
4. **Expliquer chaque commande** avant de l'executer :
   - Ce qu'elle fait techniquement
   - Pourquoi c'est necessaire
5. **Verifier le checkpoint** et expliquer ce qu'on observe

### Ce que Claude Code ne doit PAS faire

- ❌ Executer les commandes sans expliquer
- ❌ Creer les fichiers sans detailler leur contenu
- ❌ Sauter les sections "Pourquoi" des steps
- ❌ Resumer ou accelerer pour "gagner du temps"

### Ce que Claude Code DOIT faire

- ✅ Traiter chaque step comme une **mini-lecon**
- ✅ Faire des paralleles avec React/Next.js
- ✅ Expliquer les choix techniques et leurs trade-offs
- ✅ Repondre aux questions de l'utilisateur avant de continuer
- ✅ S'assurer que l'utilisateur comprend avant de passer au checkpoint

### Exemple de dialogue attendu

```
Utilisateur : "Fais le step 1"

Claude Code :
"## Step 01 : Initialiser le monorepo

### Objectif
On va creer une structure monorepo avec npm workspaces...

### Pourquoi separer front et API ?
En Next.js, tu as l'habitude d'avoir tout dans un seul projet avec les API Routes...
[Explication des limites]
[Comparaison avec notre approche]

### Pourquoi un monorepo plutot que 2 repos ?
[Explication des trade-offs]

### Pourquoi npm workspaces ?
[Comparaison des outils]

### Maintenant, je vais creer les fichiers :

1. **package.json racine** - Il declare les workspaces...
   [Explication de chaque champ]

[Continue avec explications...]
```

---

## Quick Start

```bash
# Dis a Claude Code :
"Je veux faire le step 1"
```

Claude lira le step, t'expliquera tout en detail, et executera les commandes une fois que tu as compris.

---

## Stack

| Couche     | Outil           | Tu connais            |
| ---------- | --------------- | --------------------- |
| Front      | **Nuxt 4**      | Next.js Pages Router  |
| UI         | **Vue 3**       | React                 |
| API        | **GraphQL Yoga**| REST / Apollo Client  |
| Schema     | **Pothos**      | -                     |
| ORM        | **Prisma**      | -                     |
| DB         | **PostgreSQL**  | -                     |

---

## Progression

### Module 1 : Setup
| Step | Fichier | Concept cle | Duree |
|------|---------|-------------|-------|
| 01 | [01-monorepo-init.md](steps/01-monorepo-init.md) | npm workspaces | 15min |
| 02 | [02-nuxt-setup.md](steps/02-nuxt-setup.md) | Structure Nuxt 4 | 20min |

### Module 2 : Vue basics
| Step | Fichier | Concept cle | Duree |
|------|---------|-------------|-------|
| 03 | [03-vue-reactivity.md](steps/03-vue-reactivity.md) | ref vs useState | 30min |
| 04 | [04-composable.md](steps/04-composable.md) | Composables = Hooks | 20min |

### Module 3 : Database
| Step | Fichier | Concept cle | Duree |
|------|---------|-------------|-------|
| 05 | [05-prisma-setup.md](steps/05-prisma-setup.md) | Prisma + PostgreSQL | 30min |
| 06 | [06-prisma-schema.md](steps/06-prisma-schema.md) | Modeles + migrations | 30min |
| 07 | [07-ban-import.md](steps/07-ban-import.md) | Import 350k adresses | 45min |

### Module 4 : GraphQL API
| Step | Fichier | Concept cle | Duree |
|------|---------|-------------|-------|
| 08 | [08-yoga-setup.md](steps/08-yoga-setup.md) | GraphQL Yoga server | 20min |
| 09 | [09-pothos-setup.md](steps/09-pothos-setup.md) | Code-first schema | 30min |
| 10 | [10-graphql-types.md](steps/10-graphql-types.md) | prismaObject | 30min |
| 11 | [11-graphql-queries.md](steps/11-graphql-queries.md) | Pagination Relay | 40min |

### Module 5 : Front + API
| Step | Fichier | Concept cle | Duree |
|------|---------|-------------|-------|
| 12 | [12-apollo-setup.md](steps/12-apollo-setup.md) | Apollo dans Nuxt | 20min |
| 13 | [13-first-query.md](steps/13-first-query.md) | useAsyncData | 40min |
| 14 | [14-search.md](steps/14-search.md) | v-model + debounce | 30min |

### Module 6 : Features
| Step | Fichier | Concept cle | Duree |
|------|---------|-------------|-------|
| 15 | [15-dynamic-route.md](steps/15-dynamic-route.md) | /communes/[id] | 30min |
| 16 | [16-map.md](steps/16-map.md) | ClientOnly + MapLibre | 40min |

### Module 7 : Production
| Step | Fichier | Concept cle | Duree |
|------|---------|-------------|-------|
| 17 | [17-deploy.md](steps/17-deploy.md) | Railway + Vercel | 45min |

---

## Comment utiliser cette formation

### Avec Claude Code (recommande)

1. **Ouvre un step** : `"Ouvre formation/steps/01-monorepo-init.md"`
2. **Lis le contexte** : Claude t'explique le "pourquoi" avant le "comment"
3. **Execute** : `"Execute ce step"` - Claude cree les fichiers et lance les commandes
4. **Verifie** : Suis le checkpoint pour valider
5. **Commit** : `"Commit ce step"` - Claude commit avec le message suggere
6. **Suivant** : `"Step suivant"`

### En autonomie

Chaque fichier est auto-suffisant. Tu peux lire et executer toi-meme.

---

## Prerequis

- [ ] Node.js 22+
- [ ] PostgreSQL (local ou Docker)
- [ ] Git
- [ ] VSCode avec extensions Vue/Volar

```bash
# Verifier Node
node -v  # v22.x.x

# PostgreSQL via Docker (option simple)
docker run --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres
```

---

## Structure du projet final

```
adresse-explorer/
├── formation/          ← Tu es ici
│   ├── README.md
│   └── steps/
│       ├── 01-monorepo-init.md
│       ├── 02-nuxt-setup.md
│       └── ...
├── apps/
│   ├── api/            ← GraphQL Yoga + Prisma
│   └── web/            ← Nuxt 4
├── package.json        ← Monorepo root
└── .env
```

---

## Ressources complementaires

- [Comparaison React ↔ Vue](./references/react-vue-comparison.md)
- [Cheatsheet GraphQL](./references/graphql-cheatsheet.md)
- [Troubleshooting](./references/troubleshooting.md)

---

## Credits

Formation basee sur les [bonnes pratiques 2025-2026](https://deepdocs.dev/technical-documentation-best-practices/) :
- Progressive disclosure
- Code copy-paste ready
- Checkpoints verifiables
- Comparaisons systematiques avec ce que tu connais

Sources : [DeepDocs](https://deepdocs.dev/technical-documentation-best-practices/), [Draft.dev](https://draft.dev/learn/technical-tutorials), [Kriasoft Folder Conventions](https://github.com/kriasoft/Folder-Structure-Conventions)
