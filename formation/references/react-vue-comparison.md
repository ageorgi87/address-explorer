# Comparaison React ↔ Vue

Reference rapide pour devs React qui apprennent Vue.

---

## Reactivite

| Concept | React | Vue 3 |
|---------|-------|-------|
| State primitif | `const [x, setX] = useState(0)` | `const x = ref(0)` |
| State objet | `const [obj, setObj] = useState({})` | `const obj = reactive({})` |
| Mettre a jour | `setX(x + 1)` ou `setX(prev => prev + 1)` | `x.value++` |
| Lire | `{x}` | `{{ x }}` (auto-unwrap) |
| Dans le script | `x` directement | `x.value` |

### Pourquoi `.value` ?

```javascript
// JavaScript ne peut pas intercepter ca :
let x = 5
x = 10  // Pas d'event

// Vue wrappe dans un objet :
const x = ref(5)  // { value: 5 }
x.value = 10      // Proxy detecte le changement
```

---

## Computed / Memo

| Concept | React | Vue 3 |
|---------|-------|-------|
| Valeur derivee | `useMemo(() => x * 2, [x])` | `computed(() => x.value * 2)` |
| Deps | Manuelles `[x, y]` | Auto-detectees |
| Recalcul | A chaque render si deps changent | Uniquement si deps changent |

```typescript
// React - deps manuelles
const doubled = useMemo(() => count * 2, [count])

// Vue - deps auto
const doubled = computed(() => count.value * 2)
```

---

## Effects / Watch

| Concept | React | Vue 3 |
|---------|-------|-------|
| Au mount | `useEffect(() => {}, [])` | `onMounted(() => {})` |
| Au unmount | `useEffect(() => cleanup, [])` | `onUnmounted(() => {})` |
| Quand X change | `useEffect(() => {}, [x])` | `watch(x, () => {})` |
| A chaque render | `useEffect(() => {})` | Pas d'equivalent (inutile) |

```typescript
// React
useEffect(() => {
  console.log('count changed:', count)
}, [count])

// Vue
watch(count, (newVal, oldVal) => {
  console.log('count changed:', newVal)
})
```

---

## Composants

| Concept | React | Vue 3 |
|---------|-------|-------|
| Definition | `function MyComponent() {}` | `<script setup>` dans `.vue` |
| Props | `function Comp({ title })` | `defineProps<{ title: string }>()` |
| Children | `{ children }` | `<slot />` |
| Events | `onClick={handler}` | `@click="handler"` |
| Emit | `onCustomEvent(data)` | `emit('customEvent', data)` |

### Props

```tsx
// React
interface Props { title: string; count?: number }
function Card({ title, count = 0 }: Props) {
  return <div>{title}: {count}</div>
}
```

```vue
<!-- Vue -->
<script setup lang="ts">
interface Props { title: string; count?: number }
const props = withDefaults(defineProps<Props>(), { count: 0 })
</script>

<template>
  <div>{{ title }}: {{ count }}</div>
</template>
```

### Events

```tsx
// React - callback props
<Button onClick={() => console.log('clicked')} />

// Dans Button.tsx
function Button({ onClick }) {
  return <button onClick={onClick}>Click</button>
}
```

```vue
<!-- Vue - emit -->
<Button @click="console.log('clicked')" />

<!-- Dans Button.vue -->
<script setup>
const emit = defineEmits<{ click: [] }>()
</script>

<template>
  <button @click="emit('click')">Click</button>
</template>
```

---

## Formulaires

| Concept | React | Vue 3 |
|---------|-------|-------|
| Input controle | `value={x} onChange={e => setX(e.target.value)}` | `v-model="x"` |
| Checkbox | `checked={x} onChange={...}` | `v-model="x"` |
| Select | `value={x} onChange={...}` | `v-model="x"` |

```tsx
// React - controlled
<input value={name} onChange={e => setName(e.target.value)} />
```

```vue
<!-- Vue - v-model -->
<input v-model="name" />
```

---

## Conditional Rendering

| Concept | React | Vue 3 |
|---------|-------|-------|
| If | `{condition && <X />}` | `<X v-if="condition" />` |
| If-else | `{condition ? <A /> : <B />}` | `v-if` / `v-else` |
| Show/hide | `style={{ display: x ? 'block' : 'none' }}` | `v-show="x"` |

```tsx
// React
{isLoading ? <Spinner /> : <Content />}
{items.length > 0 && <List items={items} />}
```

```vue
<!-- Vue -->
<Spinner v-if="isLoading" />
<Content v-else />

<List v-if="items.length > 0" :items="items" />
```

---

## Listes

| Concept | React | Vue 3 |
|---------|-------|-------|
| Map | `{items.map(i => <X key={i.id} />)}` | `<X v-for="i in items" :key="i.id" />` |
| Index | `items.map((i, idx) => ...)` | `v-for="(i, idx) in items"` |

```tsx
// React
{users.map(user => (
  <UserCard key={user.id} user={user} />
))}
```

```vue
<!-- Vue -->
<UserCard v-for="user in users" :key="user.id" :user="user" />
```

---

## Hooks / Composables

| Concept | React | Vue 3 |
|---------|-------|-------|
| Nom | Hook | Composable |
| Convention | `useXxx` | `useXxx` |
| Regles | Rules of Hooks | Aucune |
| Import | Manuel | Auto-import Nuxt |

```typescript
// React hook
export function useCounter(initial = 0) {
  const [count, setCount] = useState(initial)
  const increment = useCallback(() => setCount(c => c + 1), [])
  return { count, increment }
}

// Vue composable
export function useCounter(initial = 0) {
  const count = ref(initial)
  const increment = () => count.value++
  return { count, increment }
}
```

**Difference majeure** : Le composable Vue s'execute UNE fois, le hook React s'execute a chaque render.

---

## Routing (Next Pages ↔ Nuxt)

| Concept | Next.js Pages Router | Nuxt |
|---------|---------------------|------|
| Structure | `pages/` | `pages/` (ou `app/pages/`) |
| Dynamic | `[id].tsx` | `[id].vue` |
| Params | `useRouter().query.id` | `useRoute().params.id` |
| Navigate | `router.push('/x')` | `navigateTo('/x')` |
| Link | `<Link href="/x">` | `<NuxtLink to="/x">` |

---

## Data Fetching

| Concept | Next.js Pages Router | Nuxt |
|---------|---------------------|------|
| SSR fetch | `getServerSideProps` | `useAsyncData` |
| Static fetch | `getStaticProps` | `useAsyncData` avec cache |
| Client fetch | `useSWR` / `useQuery` | `useFetch` / `useAsyncData` |

```typescript
// Next.js
export async function getServerSideProps() {
  const data = await fetchData()
  return { props: { data } }
}

// Nuxt
const { data } = await useAsyncData('key', () => fetchData())
```

---

## SEO

| Concept | Next.js | Nuxt |
|---------|---------|------|
| Title | `<Head><title>...</title></Head>` | `useSeoMeta({ title: '...' })` |
| Meta | `<Head><meta ... /></Head>` | `useSeoMeta({ description: '...' })` |

```tsx
// Next.js
import Head from 'next/head'
<Head>
  <title>{title}</title>
  <meta name="description" content={desc} />
</Head>
```

```typescript
// Nuxt
useSeoMeta({
  title,
  description: desc
})
```

---

## Client-only

| Concept | Next.js | Nuxt |
|---------|---------|------|
| Pas de SSR | `dynamic(() => import('./X'), { ssr: false })` | `<ClientOnly><X /></ClientOnly>` |
| Fallback | `loading: () => <Spinner />` | `<template #fallback>` |

---

## Ce qui n'existe pas en Vue

| React | Vue | Raison |
|-------|-----|--------|
| `useCallback` | - | Fonctions stables par defaut |
| `React.memo` | - | Reactivite granulaire |
| `useMemo` deps | - | Auto-tracking |
| `key` pour reset | - | Utiliser `v-if` ou `:key` |
| Rules of Hooks | - | Pas de re-execution |
