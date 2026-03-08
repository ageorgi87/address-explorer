# Step 03 : Comprendre ref, computed et la reactivite Vue

> **Commit** : `step-03-vue-reactivity`
> **Duree** : ~40 min
> **Prerequis** : Step 02 complete

---

## Objectif

Comprendre la difference fondamentale entre la reactivite React et Vue en creant un compteur interactif.

---

## La grande difference philosophique : React vs Vue

**C'est la chose la plus importante a comprendre avant de coder en Vue.**

### Comment React fonctionne

Quand l'etat change, React **re-execute tout le composant** :

```tsx
function Counter() {
  console.log('Counter re-rendered!')  // S'affiche A CHAQUE changement d'etat

  const [count, setCount] = useState(0)

  // Cette fonction est RECREE a chaque render
  const increment = () => setCount(c => c + 1)

  // Ce calcul est REFAIT a chaque render (sans useMemo)
  const doubled = count * 2

  return <button onClick={increment}>{count} × 2 = {doubled}</button>
}
```

**Consequences** :
- Tu dois utiliser `useMemo` pour eviter les recalculs couteux
- Tu dois utiliser `useCallback` pour stabiliser les fonctions (sinon elles changent de reference)
- Tu dois utiliser `React.memo` pour eviter les re-renders d'enfants
- Les "Rules of Hooks" existent car les hooks sont appeles a chaque render

### Comment Vue fonctionne

Le composant s'execute **une seule fois** lors du montage :

```vue
<script setup>
console.log('Setup executed!')  // S'affiche UNE SEULE FOIS

const count = ref(0)

// Cette fonction est CREEE une seule fois
const increment = () => count.value++

// Ce calcul est memoïse automatiquement
const doubled = computed(() => count.value * 2)
</script>

<template>
  <button @click="increment">{{ count }} × 2 = {{ doubled }}</button>
</template>
```

**Consequences** :
- Pas besoin de `useMemo` : `computed()` memoïse automatiquement
- Pas besoin de `useCallback` : les fonctions ne sont pas recreees
- Pas besoin de `React.memo` : Vue ne re-rend que les parties du DOM qui ont change
- Pas de "Rules of Hooks" : tu peux utiliser `ref()` dans des conditions

### Visualiser la difference

```
REACT : Changement d'etat
┌─────────────────────────────────────┐
│ 1. setCount(1)                      │
│ 2. React re-execute TOUT Counter()  │
│ 3. Toutes les variables recalculees │
│ 4. Virtual DOM compare l'ancien     │
│ 5. DOM mis a jour (diff)            │
└─────────────────────────────────────┘

VUE : Changement d'etat
┌─────────────────────────────────────┐
│ 1. count.value = 1                  │
│ 2. Vue detecte via Proxy            │
│ 3. SEULS les computed dependants    │
│    sont recalcules                  │
│ 4. SEULS les noeuds DOM lies a      │
│    count sont mis a jour            │
└─────────────────────────────────────┘
```

---

## Pourquoi `.value` est necessaire

C'est la question que tout dev React se pose. Voici l'explication technique.

### Le probleme : JavaScript ne peut pas intercepter les primitives

```javascript
let x = 5
x = 10  // JavaScript ne fournit AUCUN mecanisme pour detecter ce changement
```

Il n'existe pas de `Object.observe()` ou de getter/setter sur les variables primitives.

### La solution Vue : wrapper dans un objet

```javascript
// Ce que ref() fait sous le capot (simplifie)
function ref(initialValue) {
  return new Proxy(
    { value: initialValue },
    {
      get(target, prop) {
        if (prop === 'value') {
          track(target, prop)  // Vue enregistre qui lit cette valeur
          return target.value
        }
      },
      set(target, prop, newValue) {
        if (prop === 'value') {
          target.value = newValue
          trigger(target, prop)  // Vue notifie tous les dependants
          return true
        }
      }
    }
  )
}
```

**Le Proxy JavaScript** permet d'intercepter les lectures et ecritures sur un objet. Vue utilise ce mecanisme pour :
1. **Track** : Enregistrer quels composants/computed lisent quelle valeur
2. **Trigger** : Notifier ces dependants quand la valeur change

### Dans le template : auto-unwrap

Vue sait que dans le template tu veux la valeur, pas l'objet ref :

```vue
<template>
  <!-- Vue unwrappe automatiquement -->
  <p>{{ count }}</p>        <!-- Affiche 5, pas { value: 5 } -->
  <p>{{ count.value }}</p>  <!-- Inutile et verbeux -->
</template>
```

### Dans le script : `.value` obligatoire

```vue
<script setup>
const count = ref(5)

// Dans le script, tu manipules l'objet ref
console.log(count)        // Ref { value: 5 }
console.log(count.value)  // 5

count.value++             // Obligatoire pour modifier
count++                   // ERREUR : essaie d'incrementer l'objet
</script>
```

---

## ref() vs reactive() : quand utiliser quoi

Vue offre deux facons de creer de l'etat reactif.

### ref() : pour tout

```typescript
const count = ref(0)              // Nombre
const name = ref('Alice')         // String
const user = ref({ name: 'Bob' }) // Objet
const items = ref([1, 2, 3])      // Array

// Acces avec .value
count.value++
user.value.name = 'Charlie'
items.value.push(4)
```

### reactive() : pour les objets complexes

```typescript
const state = reactive({
  count: 0,
  user: { name: 'Alice' },
  items: [1, 2, 3]
})

// Acces DIRECT, pas de .value
state.count++
state.user.name = 'Charlie'
state.items.push(4)
```

### Tableau de decision

| Situation | Utiliser | Raison |
|-----------|----------|--------|
| Valeur primitive (number, string, boolean) | `ref()` | Pas le choix, reactive ne fonctionne pas sur les primitives |
| Un seul objet avec plusieurs proprietes | `reactive()` | Plus naturel, pas de `.value` |
| Valeur qui peut etre remplacee entierement | `ref()` | `ref.value = newObj` fonctionne |
| Retour d'un composable | `ref()` | Permet de destructurer sans perdre la reactivite |
| Quand tu hesites | `ref()` | Fonctionne pour tout |

### Le piege de reactive() avec la destructuration

```typescript
const state = reactive({ count: 0, name: 'Alice' })

// ❌ PIEGE : perd la reactivite !
const { count, name } = state
count++  // Ne declenche PAS de mise a jour

// ✅ Avec ref, la destructuration fonctionne
const countRef = ref(0)
const { value } = countRef  // Mais la tu perds aussi...

// ✅ La bonne facon avec reactive
const state = reactive({ count: 0 })
state.count++  // Sans destructurer
```

**Recommandation pour la formation** : utilise `ref()` pour tout. C'est plus simple et coherent.

---

## computed() : le useMemo sans tableau de dependances

### En React : tu dois lister les dependances

```tsx
const doubled = useMemo(() => count * 2, [count])
//                                        ^^^^^^^ Tu dois les lister

// Si tu oublies une dependance, le calcul n'est pas mis a jour
const buggy = useMemo(() => count + offset, [count])
//                                           ^^^^^^^ offset manquant !
```

### En Vue : les dependances sont auto-detectees

```typescript
const count = ref(0)
const offset = ref(10)

// Vue SAIT que doubled depend de count.value ET offset.value
// Car il trace les acces via les getters Proxy
const doubled = computed(() => count.value + offset.value)

// Changer n'importe lequel declenche un recalcul
count.value++   // doubled recalcule
offset.value++  // doubled recalcule aussi
```

### Comment Vue detecte les dependances

```
1. Tu appelles computed(() => count.value * 2)
2. Vue execute la fonction une premiere fois
3. Pendant l'execution, Vue voit que count.value est LU
   (via le getter du Proxy)
4. Vue enregistre : "ce computed depend de count"
5. Quand count change, Vue sait qu'il faut recalculer ce computed
```

C'est pour ca qu'on dit que Vue a un systeme de **tracking** automatique.

### Computed est lazy et cached

```typescript
const expensive = computed(() => {
  console.log('Calcul lourd...')
  return data.value.reduce((sum, item) => sum + item.price, 0)
})

// Le calcul n'est PAS fait tant qu'on ne lit pas expensive.value
console.log('Avant')          // "Avant"
console.log(expensive.value)  // "Calcul lourd..." puis le resultat
console.log(expensive.value)  // Resultat direct, PAS de "Calcul lourd..."
//                               Car le cache est utilise
```

---

## Equivalences completes React ↔ Vue 3

| React (ce que tu connais) | Vue 3 (equivalent) | Difference cle |
|---------------------------|--------------------|--------------------|
| `useState('')` | `ref('')` | Vue : `.value` dans le JS, direct dans le template |
| `useState({})` | `reactive({})` | Vue : pas de `.value`, mutation directe |
| `useMemo(() => x, [dep])` | `computed(() => x)` | Vue : dependances auto-detectees, pas de tableau |
| `useEffect(() => {}, [dep])` | `watch(dep, () => {})` | Vue : watch est lazy par defaut |
| `useEffect(() => {}, [])` | `onMounted(() => {})` | Lifecycle hook explicite |
| `useCallback(() => {})` | `const fn = () => {}` | Pas besoin en Vue |
| `setCount(c => c + 1)` | `count.value++` | Mutation directe OK en Vue |
| `{count}` dans JSX | `{{ count }}` dans template | Auto-unwrap des refs |
| `{condition && <Comp />}` | `<Comp v-if="condition" />` | Directive template Vue |
| `items.map(i => <Item />)` | `<Item v-for="i in items" />` | Directive template Vue |

---

## Fichier a modifier

### `apps/web/app/pages/index.vue`

```vue
<script setup lang="ts">
// ============================================
// ETAT REACTIF
// ============================================

// React : const [count, setCount] = useState(0)
// Vue : ref() retourne un objet { value: 0 }
const count = ref(0)

// Pour comprendre : log l'objet ref
console.log('count object:', count)        // Ref { value: 0 }
console.log('count value:', count.value)   // 0

// ============================================
// VALEUR CALCULEE (COMPUTED)
// ============================================

// React : const doubled = useMemo(() => count * 2, [count])
// Vue : pas de tableau de dependances, Vue les detecte automatiquement
const doubled = computed(() => {
  console.log('doubled recalculated!')  // S'affiche UNIQUEMENT quand count change
  return count.value * 2
})

// Exemple avec plusieurs dependances
const multiplier = ref(3)
const tripled = computed(() => count.value * multiplier.value)
// Vue sait que tripled depend de count ET multiplier

// ============================================
// FONCTIONS
// ============================================

// React : const increment = useCallback(() => setCount(c => c + 1), [])
// Vue : pas besoin de useCallback, la fonction n'est PAS recree
function increment() {
  count.value++  // Mutation directe, pas de fonction setter
}

function decrement() {
  count.value--
}

function reset() {
  count.value = 0
}

// ============================================
// SEO (equivalent de <Head> en Next.js)
// ============================================
useSeoMeta({
  title: 'Comprendre la reactivite Vue',
  description: 'Step 03 de la formation Vue/Nuxt'
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 p-8">
    <h1 class="text-3xl font-bold text-gray-900">
      Explorateur d'adresses
    </h1>

    <!-- ============================================ -->
    <!-- COMPTEUR INTERACTIF                         -->
    <!-- ============================================ -->
    <div class="mt-8 p-6 bg-white rounded-lg shadow max-w-md">
      <h2 class="text-lg font-semibold text-gray-700">
        Compteur reactif
      </h2>

      <div class="mt-4 flex items-center gap-4">
        <!--
          @click = onClick en React
          Syntaxe courte pour v-on:click
        -->
        <button
          class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
          @click="decrement"
        >
          -
        </button>

        <!--
          {{ count }} = { count } en JSX
          MAIS Vue auto-unwrappe les refs !
          Pas besoin de {{ count.value }}
        -->
        <span class="text-2xl font-mono w-16 text-center">
          {{ count }}
        </span>

        <button
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          @click="increment"
        >
          +
        </button>

        <button
          class="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          @click="reset"
        >
          Reset
        </button>
      </div>

      <!--
        computed() se met a jour automatiquement
        Ouvre la console : "doubled recalculated!" n'apparait
        QUE quand count change
      -->
      <p class="mt-4 text-gray-600">
        Double (computed) : <span class="font-mono font-bold">{{ doubled }}</span>
      </p>

      <p class="mt-2 text-gray-600">
        Triple (computed) : <span class="font-mono font-bold">{{ tripled }}</span>
      </p>

      <!-- Modifier le multiplicateur -->
      <div class="mt-4 flex items-center gap-2">
        <label class="text-sm text-gray-500">Multiplicateur :</label>
        <!--
          v-model = value + onChange combines
          En React : value={multiplier} onChange={e => setMultiplier(e.target.value)}
          En Vue   : v-model="multiplier" (une seule directive)
        -->
        <input
          v-model.number="multiplier"
          type="number"
          min="1"
          max="10"
          class="w-16 px-2 py-1 border rounded text-center"
        >
      </div>
    </div>

    <!-- ============================================ -->
    <!-- COMPARAISON DE CODE                         -->
    <!-- ============================================ -->
    <div class="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
      <div class="p-4 bg-white rounded-lg shadow">
        <h3 class="font-semibold text-red-600 mb-3">React</h3>
        <pre class="text-xs bg-gray-100 p-3 rounded overflow-x-auto leading-relaxed"><code>import { useState, useMemo, useCallback } from 'react'

function Counter() {
  const [count, setCount] = useState(0)
  const [multiplier, setMultiplier] = useState(3)

  // Dependances manuelles obligatoires
  const doubled = useMemo(
    () => count * 2,
    [count]
  )

  const tripled = useMemo(
    () => count * multiplier,
    [count, multiplier]  // Oublier une dep = bug
  )

  // useCallback pour stabiliser la reference
  const increment = useCallback(
    () => setCount(c => c + 1),
    []
  )

  return (
    &lt;button onClick={increment}&gt;
      {count} × 2 = {doubled}
    &lt;/button&gt;
  )
}</code></pre>
      </div>

      <div class="p-4 bg-white rounded-lg shadow">
        <h3 class="font-semibold text-green-600 mb-3">Vue 3</h3>
        <pre class="text-xs bg-gray-100 p-3 rounded overflow-x-auto leading-relaxed"><code>// Pas d'imports ! Auto-importes par Nuxt

const count = ref(0)
const multiplier = ref(3)

// Dependances auto-detectees
const doubled = computed(
  () => count.value * 2
)

const tripled = computed(
  () => count.value * multiplier.value
)

// Pas besoin de useCallback
function increment() {
  count.value++
}

// Dans le template :
// &lt;button @click="increment"&gt;
//   {{ count }} × 2 = {{ doubled }}
// &lt;/button&gt;</code></pre>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- CE QUI N'EXISTE PAS EN VUE                  -->
    <!-- ============================================ -->
    <div class="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-3xl">
      <h3 class="font-semibold text-yellow-800 mb-2">
        Ce que tu n'as plus besoin de faire en Vue
      </h3>
      <ul class="text-sm text-yellow-700 space-y-1">
        <li>❌ <code>useMemo</code> → <code>computed()</code> memoïse automatiquement</li>
        <li>❌ <code>useCallback</code> → Les fonctions ne sont pas recreees</li>
        <li>❌ <code>React.memo</code> → Vue ne re-rend que les noeuds DOM concernes</li>
        <li>❌ Tableau de dependances <code>[dep1, dep2]</code> → Auto-tracking</li>
        <li>❌ <code>setCount(c => c + 1)</code> → <code>count.value++</code> directement</li>
      </ul>
    </div>
  </div>
</template>
```

---

## Checkpoint

### 1. Lancer le serveur

```bash
npm run dev:web
```

### 2. Ouvrir le navigateur

Ouvre `http://localhost:3000`

**Tu dois voir** :
- Le compteur avec boutons +, -, Reset
- La valeur "Double" qui se met a jour
- La valeur "Triple" avec son multiplicateur ajustable
- Les deux blocs de code comparatifs

### 3. Ouvrir la console du navigateur

1. F12 (ou Cmd+Option+I sur Mac)
2. Onglet "Console"
3. Clique sur + plusieurs fois

**Tu dois voir** :
- "doubled recalculated!" s'affiche UNIQUEMENT quand count change
- Pas de "Counter re-rendered!" a chaque clic (car Vue ne re-execute pas le composant)

### 4. Tester le multiplicateur

1. Change la valeur du multiplicateur (input)
2. La valeur "Triple" se met a jour automatiquement
3. Vue a detecte que `tripled` depend de `multiplier`

---

## Pieges courants

| Probleme | Cause | Solution |
|----------|-------|----------|
| `count++` ne fait rien | Oubli de `.value` | `count.value++` |
| `{{ count.value }}` dans template | `.value` inutile dans template | `{{ count }}` suffit (auto-unwrap) |
| `computed` ne se met pas a jour | Tu n'as pas lu `.value` dans la fonction | `computed(() => count.value * 2)` pas `count * 2` |
| Tu cherches a eviter un re-render | Reflexe React | Vue ne fait pas de re-render complet |
| `v-model` avec number | Input renvoie un string | Ajouter `.number` : `v-model.number="multiplier"` |

---

## Exercice : comprendre le tracking

Ajoute ce code et observe la console :

```vue
<script setup>
const a = ref(1)
const b = ref(2)
const c = ref(3)

// Ce computed depend de a ET b, mais PAS de c
const sum = computed(() => {
  console.log('sum computed!')
  return a.value + b.value
})

function incrementA() { a.value++ }
function incrementB() { b.value++ }
function incrementC() { c.value++ }
</script>

<template>
  <div>
    <p>Sum: {{ sum }}</p>
    <button @click="incrementA">a++</button>
    <button @click="incrementB">b++</button>
    <button @click="incrementC">c++ (ne declenche pas sum)</button>
  </div>
</template>
```

**Observation** : Cliquer sur "c++" ne log PAS "sum computed!" car Vue sait que `sum` ne depend pas de `c`.

---

## Pour aller plus loin : watch vs computed

| `computed` | `watch` |
|------------|---------|
| Retourne une valeur | Execute un effet de bord |
| Lazy (calcule uniquement si lu) | Execute immediatement ou sur changement |
| Equivaut a `useMemo` | Equivaut a `useEffect` |

```typescript
// computed : pour calculer une valeur derivee
const fullName = computed(() => `${firstName.value} ${lastName.value}`)

// watch : pour des effets de bord (API call, log, etc.)
watch(searchQuery, async (newQuery) => {
  const results = await fetch(`/api/search?q=${newQuery}`)
  // ...
})
```

On verra `watch` en detail dans les steps suivants.

---

## Prochaine etape

→ [04-composable.md](./04-composable.md) : Extraire la logique dans un composable (equivalent d'un hook React)
