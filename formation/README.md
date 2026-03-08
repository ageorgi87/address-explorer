# Formation : Vue 3 + Nuxt 4 + GraphQL

> **Pour qui** : Developpeurs React/Next.js qui veulent apprendre Vue/Nuxt et GraphQL backend
> **Duree** : ~15-20h (a ton rythme)
> **Projet final** : Explorateur de 26M d'adresses francaises

---

## Quick Start

```bash
# Dis a Claude Code :
"On commence la formation, ouvre formation/steps/01-monorepo-init.md"
```

Claude lira le step, executera les commandes, et tu verifieras le checkpoint.

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
