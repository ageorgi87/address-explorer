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

### Mode d'execution en 2 PHASES

Quand l'utilisateur demande de faire un step, Claude Code doit suivre **2 phases distinctes** :

---

#### PHASE 1 : PRESENTATION (pas de code !)

1. **Lire le fichier du step** en entier
2. **Presenter la theorie** :
   - Quel est l'objectif ?
   - Pourquoi on fait ca ? (pas juste "comment")
   - Quelles alternatives existent et pourquoi ce choix ?
   - Comparaison avec React/Next.js si pertinent
   - Expliquer les concepts cles avec des exemples
3. **ATTENDRE la validation de l'utilisateur** avant de passer a la phase 2
   - Demander : "Tu veux que je passe a l'implementation ?" ou similaire
   - Repondre aux questions si l'utilisateur en a

**AUCUN FICHIER NE DOIT ETRE CREE/MODIFIE PENDANT LA PHASE 1**

---

#### PHASE 2 : IMPLEMENTATION (apres validation)

Une fois que l'utilisateur a dit "ok", "c'est bon", "go", etc. :

Pour **CHAQUE tache** de l'implementation, suivre ce cycle :

1. **Expliquer** ce qu'on va faire, comment, et pourquoi
2. **Coder** (creer/modifier le fichier)
3. **Passer a la tache suivante**

Exemple de cycle pour une tache :
```
"### Tache 1 : Modifier index.vue

**Ce qu'on va faire** : Ajouter un compteur reactif
**Comment** : Utiliser ref() pour l'etat et computed() pour les valeurs derivees
**Pourquoi** : Demontrer la difference avec useState/useMemo de React

[Code le fichier]

### Tache 2 : ..."
```

A la fin de toutes les taches :
- **Executer les commandes** necessaires (npm install, etc.)
- **Verifier le checkpoint** et expliquer ce qu'on observe

---

#### PHASE 3 : COMMIT ET PUSH (avant le step suivant)

**IMPORTANT** : Toujours commit et push avant de passer au step suivant.

**Convention de nommage des commits** (Conventional Commits) :

```
<type>(<scope>): <description courte>

<corps optionnel : details des changements>

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

**Types autorises** :
- `feat` : nouvelle fonctionnalite
- `fix` : correction de bug
- `docs` : documentation uniquement
- `refactor` : refactoring sans changement de comportement
- `chore` : maintenance (deps, config)

**Scopes recommandes** :
- `web` : apps/web (Nuxt)
- `api` : apps/api (GraphQL)
- `formation` : fichiers de formation
- `monorepo` : configuration racine

**Exemples** :
```bash
# Step 03-04
feat(web): add Vue reactivity demo and useCounter composable

# Step 05
feat(api): setup Prisma with PostgreSQL connection

# Step 08
feat(api): add GraphQL Yoga server with health endpoint
```

---

### Ce que Claude Code ne doit PAS faire

- ❌ **Creer ou modifier des fichiers pendant la phase 1**
- ❌ Executer les commandes sans expliquer
- ❌ Sauter les sections "Pourquoi" des steps
- ❌ Resumer ou accelerer pour "gagner du temps"
- ❌ Passer a l'implementation sans validation explicite de l'utilisateur

### Ce que Claude Code DOIT faire

- ✅ **Separer clairement presentation et implementation**
- ✅ **Attendre "ok" ou equivalent avant de coder**
- ✅ Traiter chaque step comme une **mini-lecon**
- ✅ Faire des paralleles avec React/Next.js
- ✅ Expliquer les choix techniques et leurs trade-offs
- ✅ Repondre aux questions de l'utilisateur avant de continuer

### Exemple de dialogue attendu

```
Utilisateur : "Fais le step 3"

Claude Code (PHASE 1 - presentation) :
"## Step 03 : Comprendre la reactivite Vue

### Objectif
Comprendre la difference fondamentale entre React et Vue...

### La grande difference philosophique
En React, quand l'etat change, tout le composant est re-execute...
En Vue, le composant s'execute UNE SEULE FOIS...

### Pourquoi .value est necessaire
JavaScript ne peut pas intercepter les primitives...
Vue utilise un Proxy pour wrapper la valeur...

### Equivalences React ↔ Vue
| React | Vue |
| useState | ref() |
| useMemo | computed() |
...

---

Tu as des questions ? Sinon, je passe a l'implementation."

Utilisateur : "ok"

Claude Code (PHASE 2 - implementation) :
"### Tache 1 : Modifier index.vue

**Ce qu'on va faire** : Remplacer la page de bienvenue par un compteur interactif
**Comment** : Utiliser ref() pour count et multiplier, computed() pour doubled et tripled
**Pourquoi** : Demontrer que Vue detecte automatiquement les dependances (pas de tableau [deps])

[Cree/modifie le fichier]

### Tache 2 : Verifier le checkpoint

**Ce qu'on va faire** : Lancer le serveur et tester dans le navigateur
**Comment** : npm run dev:web puis ouvrir localhost:3000
**Pourquoi** : Valider que la reactivite fonctionne (console.log dans computed)

[Execute les commandes]"
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
