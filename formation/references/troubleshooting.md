# Troubleshooting

Solutions aux problemes courants.

---

## Erreurs Nuxt

### `useAsyncData` retourne `null`

**Symptome** : `data.value` est toujours `null`

**Causes possibles** :

1. **API pas lancee**
   ```bash
   # Verifier que l'API tourne
   curl http://localhost:4000/graphql
   ```

2. **Pas de `await`**
   ```typescript
   // ❌ Mauvais
   const { data } = useAsyncData('key', fetchFn)

   // ✅ Bon
   const { data } = await useAsyncData('key', fetchFn)
   ```

3. **Erreur silencieuse**
   ```typescript
   const { data, error } = await useAsyncData('key', fetchFn)
   console.log(error.value)  // Voir l'erreur
   ```

---

### `ref is not defined`

**Symptome** : Erreur au chargement de la page

**Solution** : Relancer le serveur de dev

```bash
# Arret (Ctrl+C) puis
npm run dev:web
```

Les auto-imports sont regeneres au demarrage.

---

### Composant pas trouve

**Symptome** : `[Vue warn]: Failed to resolve component: MyComponent`

**Verifier** :
1. Le fichier est dans `app/components/`
2. Le nom du fichier = nom du composant (`SearchBar.vue` → `<SearchBar />`)
3. Pas de faute de frappe

---

### HMR ne fonctionne pas

**Symptome** : Les changements ne se refletent pas

**Solutions** :

1. Forcer le refresh : `Ctrl+Shift+R`
2. Relancer le serveur
3. Supprimer le cache :
   ```bash
   rm -rf apps/web/.nuxt
   npm run dev:web
   ```

---

## Erreurs Prisma

### `Connection refused`

**Symptome** : `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solutions** :

1. **PostgreSQL pas demarre**
   ```bash
   # Docker
   docker start postgres

   # Ou verifier le service
   brew services start postgresql  # macOS
   ```

2. **Mauvaise URL**
   ```bash
   # Verifier .env
   cat .env | grep DATABASE_URL
   ```

---

### `database does not exist`

**Symptome** : `error: database "xxx" does not exist`

**Solution** :

```bash
# Creer la base
createdb adresse_explorer

# Ou avec Docker, elle est creee automatiquement
docker run --name postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=adresse_explorer \
  -p 5432:5432 -d postgres:16
```

---

### `Cannot find module '@prisma/client'`

**Symptome** : Import error au runtime

**Solution** :

```bash
cd apps/api
npx prisma generate
```

---

### Migration echoue

**Symptome** : `Error: P3006 Migration failed to apply`

**Solutions** :

1. **Reset complet** (perd les donnees)
   ```bash
   npx prisma migrate reset
   ```

2. **Voir l'etat**
   ```bash
   npx prisma migrate status
   ```

3. **Appliquer manuellement**
   ```bash
   npx prisma db push
   ```

---

## Erreurs GraphQL

### `Cannot query field "x" on type "Query"`

**Symptome** : La query GraphQL echoue

**Causes** :

1. **Champ pas expose**
   ```typescript
   // Verifier que le champ est dans le schema
   builder.queryField('monChamp', ...)
   ```

2. **Typo dans la query**
   ```graphql
   # Verifier l'orthographe
   { departements { nom } }  # pas "departemants"
   ```

3. **Schema pas regenere**
   ```bash
   # Relancer l'API
   npm run dev:api
   ```

---

### N+1 queries

**Symptome** : L'API est lente, beaucoup de requetes SQL

**Diagnostic** :

```typescript
const prisma = new PrismaClient({
  log: ['query']
})
```

**Solution** : Utiliser `...query` de Pothos

```typescript
// ✅ Pothos optimise automatiquement
resolve: (query, _parent, args) =>
  prisma.departement.findMany({
    ...query,  // Inclut les relations necessaires
    where: { ... }
  })
```

---

### CORS error

**Symptome** : `Access-Control-Allow-Origin` error dans la console

**Solution** :

```typescript
// Dans l'API Yoga
const yoga = createYoga({
  cors: {
    origin: ['http://localhost:3000', 'https://ton-site.com'],
    credentials: true
  }
})
```

---

## Erreurs TypeScript

### Types Prisma pas a jour

**Symptome** : TypeScript ne reconnait pas les champs

**Solution** :

```bash
cd apps/api
npx prisma generate
```

---

### `any` partout dans GraphQL

**Symptome** : Pas d'autocompletion dans les resolvers

**Solution** : Generer les types Pothos

```bash
# Le schema est type-safe par defaut avec Pothos
# Verifier que le builder est bien configure
```

---

## Erreurs de deploiement

### Railway - Build fail

**Verifier** :

1. `package.json` a un script `build`
2. Dockerfile est correct
3. Variables d'environnement configurees

```bash
# Test local
docker build -t api .
docker run -e DATABASE_URL="..." api
```

---

### Vercel - 500 error

**Verifier** :

1. Variables d'environnement dans Vercel dashboard
2. `NUXT_PUBLIC_GRAPHQL_URL` pointe vers la bonne API
3. L'API est accessible publiquement

```bash
# Test l'API
curl https://ton-api.up.railway.app/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __typename }"}'
```

---

## Performance

### Page lente au premier chargement

**Causes possibles** :

1. **Query trop large**
   ```graphql
   # Eviter de charger toutes les relations
   { departements { communes { voies { numeros { ... } } } } }

   # Charger progressivement
   { departements { code, nom } }
   ```

2. **Pas de pagination**
   ```graphql
   # Utiliser first/after
   { voies(first: 20) { edges { node { ... } } } }
   ```

3. **Index manquant**
   ```prisma
   model Voie {
     nom String
     @@index([nom])  // Accelere les recherches
   }
   ```

---

### Hydration mismatch

**Symptome** : Warning `Hydration text content mismatch`

**Causes** :

1. **Date/heure** - Utiliser `<ClientOnly>` pour les dates dynamiques
2. **Random** - Eviter `Math.random()` dans le rendu
3. **Extensions navigateur** - Tester en navigation privee

---

## Debug general

### Voir les requetes reseau

1. DevTools > Network
2. Filtrer par "graphql"
3. Cliquer sur une requete > Preview

### Console Vue

```typescript
// Dans un composant
console.log(toRaw(monRef.value))  // Voir la valeur sans le Proxy
```

### Prisma Studio

```bash
cd apps/api
npx prisma studio
# Ouvre http://localhost:5555
```

### GraphiQL

Ouvrir `http://localhost:4000/graphql` pour tester les queries interactivement.
