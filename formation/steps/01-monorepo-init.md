# Step 01 : Initialiser le monorepo

> **Commit** : `step-01-monorepo-init`
> **Duree** : ~20 min
> **Prerequis** : Node.js 22+

---

## Objectif

Avoir un monorepo npm workspaces avec `apps/api` et `apps/web`.

---

## Pourquoi separer le front et l'API ?

### L'approche Next.js que tu connais

Dans Next.js Pages Router, tu as tout dans un seul projet :

```
mon-app-next/
├── pages/
│   ├── index.tsx      ← Pages React
│   └── api/
│       └── users.ts   ← API Routes
├── package.json       ← Une seule config
└── node_modules/
```

**Avantages** :
- Simple a demarrer
- Un seul deploiement (Vercel gere tout)
- Types partages automatiquement

**Inconvenients** :
- API limitee (serverless functions, pas de WebSockets natifs, pas de jobs longs)
- Scaling couple (si l'API a besoin de plus de ressources, tu scales aussi le front)
- Lock-in Vercel pour les API Routes complexes

### L'approche de ce projet : separation

```
adresse-explorer/
├── apps/
│   ├── api/           ← Serveur Node.js independant
│   │   └── package.json
│   └── web/           ← Nuxt (equivalent Next)
│       └── package.json
├── package.json       ← Orchestration
└── node_modules/      ← Partage
```

**Pourquoi ce choix ?**

| Critere | API Routes Next | API separee |
|---------|-----------------|-------------|
| **GraphQL** | Possible mais limite | Full control (subscriptions, etc.) |
| **Base de donnees** | Connexions problematiques en serverless | Connexion persistante |
| **Scaling** | Tout ensemble | API et front independants |
| **Deploiement** | Vercel seulement | N'importe ou (Railway, Fly, VPS) |
| **Equipes** | Un seul repo | Repos separes possibles plus tard |

**Pour ce projet** : On veut un vrai serveur GraphQL avec Prisma, des queries complexes, et potentiellement des subscriptions. Les API Routes de Next ne suffisent pas.

---

## Pourquoi un monorepo plutot que deux repos ?

### Option A : Deux repos separes

```
# Repo 1 : github.com/moi/adresse-api
# Repo 2 : github.com/moi/adresse-web
```

**Avantages** :
- Isolation totale
- CI/CD independants
- Permissions granulaires

**Inconvenients** :
- Synchronisation des types difficile (npm publish ou git submodules)
- Deux PRs pour une feature cross-stack
- Versions a maintenir

### Option B : Monorepo (notre choix)

```
# Un seul repo : github.com/moi/adresse-explorer
apps/api/  +  apps/web/
```

**Avantages** :
- **Atomic commits** : Une PR peut modifier API + front
- **Types partages** : Import direct sans publication
- **Refactoring facile** : Renommer un champ GraphQL = une seule PR
- **Dev local simple** : `npm run dev` lance tout

**Inconvenients** :
- CI plus complexe (mais on peut filter par dossier)
- Repo plus gros
- Tous les devs ont acces a tout

**Pour ce projet** : Formation solo, on veut la simplicite du monorepo. En entreprise avec 50 devs, la question se poserait differemment.

---

## Pourquoi npm workspaces plutot que pnpm/yarn/turborepo ?

### Les alternatives

| Outil | Avantages | Inconvenients |
|-------|-----------|---------------|
| **npm workspaces** | Natif, zero config, stable | Moins de features |
| **pnpm workspaces** | Plus rapide, disk efficient | Un outil de plus a installer |
| **Yarn workspaces** | Mature, plug'n'play | Yarn 4 complexe a configurer |
| **Turborepo** | Cache intelligent, parallelisation | Overkill pour 2 apps |
| **Nx** | Tres puissant, generators | Courbe d'apprentissage |

### Notre choix : npm workspaces

**Raisons** :
1. **Zero installation** : npm est deja la
2. **Suffisant** : 2 apps, pas besoin de cache distribue
3. **Standard** : Tout le monde connait npm
4. **Formation** : Moins de concepts a apprendre

Si le projet grossit (10+ packages, CI lent), on migrerait vers Turborepo.

---

## Comment ca marche techniquement ?

### Le `package.json` racine

```json
{
  "name": "adresse-explorer",
  "private": true,
  "workspaces": ["apps/*"],
  "scripts": {
    "dev": "concurrently \"npm run dev -w api\" \"npm run dev -w web\"",
    "dev:api": "npm run dev -w api",
    "dev:web": "npm run dev -w web"
  },
  "devDependencies": {
    "concurrently": "^9.1.0"
  }
}
```

**Explications ligne par ligne** :

- `"private": true` — Empeche la publication accidentelle sur npm. Un monorepo n'est jamais publie directement.

- `"workspaces": ["apps/*"]` — Dit a npm : "Tous les dossiers dans `apps/` sont des packages separes". npm va :
  1. Lire leur `package.json`
  2. Installer leurs deps dans le `node_modules` racine
  3. Creer des symlinks pour qu'ils se "voient"

- `"dev": "concurrently ..."` — Lance API et web en parallele. Sans `concurrently`, tu devrais ouvrir deux terminaux.

- `-w api` — Le flag `-w` (workspace) cible un package par son `name`. Equivalent de `cd apps/api && npm run dev`.

### Le `package.json` de chaque app

```json
{
  "name": "api",
  "private": true,
  "type": "module"
}
```

- `"name": "api"` — Identifiant unique dans le monorepo. C'est ce nom qu'on utilise avec `-w api`.

- `"type": "module"` — Active les imports ESM (`import x from 'y'` au lieu de `require('y')`). Necessaire pour les outils modernes.

### Ou vont les `node_modules` ?

```
adresse-explorer/
├── node_modules/           ← TOUT est ici
│   ├── concurrently/       ← Dep du root
│   ├── vue/                ← Dep de web
│   ├── prisma/             ← Dep de api
│   ├── api -> ../apps/api  ← Symlink !
│   └── web -> ../apps/web  ← Symlink !
└── apps/
    ├── api/                ← Pas de node_modules ici
    └── web/                ← Pas de node_modules ici
```

Les symlinks permettent a `web` d'importer depuis `api` si besoin :
```typescript
// Dans apps/web, si on voulait (on ne le fera pas)
import { schema } from 'api/src/schema'
```

---

## Fichiers a creer

### 1. Structure des dossiers

```bash
mkdir -p apps/api apps/web
```

### 2. `package.json` (racine)

```json
{
  "name": "adresse-explorer",
  "private": true,
  "workspaces": ["apps/*"],
  "scripts": {
    "dev": "concurrently \"npm run dev -w api\" \"npm run dev -w web\"",
    "dev:api": "npm run dev -w api",
    "dev:web": "npm run dev -w web"
  },
  "devDependencies": {
    "concurrently": "^9.1.0"
  }
}
```

### 3. `apps/api/package.json`

```json
{
  "name": "api",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "echo 'API ready - Step 08 will add the real server'"
  }
}
```

### 4. `apps/web/package.json`

```json
{
  "name": "web",
  "private": true,
  "scripts": {
    "dev": "echo 'Web ready - Step 02 will add Nuxt'"
  }
}
```

---

## Commandes a executer

```bash
# A la racine du projet
npm install
```

Cette commande :
1. Lit `workspaces: ["apps/*"]`
2. Trouve `apps/api/package.json` et `apps/web/package.json`
3. Installe toutes les deps au meme endroit
4. Cree les symlinks

---

## Checkpoint

```bash
npm run dev
```

**Tu dois voir** :
```
[0] API ready - Step 08 will add the real server
[1] Web ready - Step 02 will add Nuxt
```

Les deux messages s'affichent grace a `concurrently` qui lance les deux scripts en parallele.

**Verifier les symlinks** :
```bash
ls -la node_modules | grep -E "^l.*api|^l.*web"
```

Tu dois voir :
```
lrwxr-xr-x  api -> ../apps/api
lrwxr-xr-x  web -> ../apps/web
```

---

## Pieges courants

| Probleme | Cause | Solution |
|----------|-------|----------|
| `npm install` dans `apps/api` | Installe dans le mauvais dossier | Toujours `npm install` a la racine |
| `npm ERR! missing script` | `name` du package ne matche pas | Verifier que `name: "api"` dans `apps/api/package.json` |
| Pas de symlinks | npm ancien | Node 22+ inclut npm 10+ qui gere bien les workspaces |
| `Cannot publish private package` | `private: true` manquant | Ajouter dans chaque `package.json` |

---

## Structure finale

```
adresse-explorer/
├── package.json           ← workspaces: ["apps/*"]
├── package-lock.json      ← Genere par npm install
├── node_modules/          ← Partage + symlinks
└── apps/
    ├── api/
    │   └── package.json   ← name: "api"
    └── web/
        └── package.json   ← name: "web"
```

---

## Alternatives non choisies (pour reference)

### Turborepo

Si on avait choisi Turborepo, on aurait :

```json
// turbo.json
{
  "pipeline": {
    "dev": { "cache": false, "persistent": true },
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] }
  }
}
```

**Avantage** : Cache des builds, parallelisation intelligente.
**Pourquoi pas** : Overkill pour 2 apps, un concept de plus a apprendre.

### pnpm workspaces

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
```

**Avantage** : Installation 2-3x plus rapide, moins d'espace disque.
**Pourquoi pas** : Necessite d'installer pnpm (`npm install -g pnpm`).

---

## Prochaine etape

→ [02-nuxt-setup.md](./02-nuxt-setup.md) : Installer Nuxt 4 dans `apps/web`
