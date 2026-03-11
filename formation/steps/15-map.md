# Step 15 : Carte MapLibre

> **Commit** : `step-15-map`
> **Durée** : ~45 min
> **Prérequis** : Step 14 complété

---

## Objectif

Afficher une carte interactive avec les adresses de la commune.

À la fin de ce step :
- Tu as un composant carte fonctionnel avec MapLibre
- Tu comprends `<ClientOnly>` vs `dynamic({ ssr: false })`
- Tu maîtrises `onMounted`, `onUnmounted`, et `watch`
- Tu sais gérer les composants qui utilisent `window`

---

## Pourquoi certains composants sont "client-only" ?

### Le problème du SSR

```
SSR (Server-Side Rendering)
┌────────────────────────────────────────────┐
│  Node.js (serveur)                         │
│                                            │
│  ❌ Pas de `window`                        │
│  ❌ Pas de `document`                      │
│  ❌ Pas de `navigator`                     │
│  ❌ Pas de DOM                             │
│                                            │
│  MapLibre fait :                           │
│  const canvas = document.createElement()  │
│  → 💥 ReferenceError: document undefined  │
└────────────────────────────────────────────┘
```

### Solutions

**Next.js : dynamic import avec ssr: false**
```tsx
import dynamic from 'next/dynamic'

// Le composant est chargé uniquement côté client
const Map = dynamic(
  () => import('./Map'),
  {
    ssr: false,
    loading: () => <p>Chargement de la carte...</p>
  }
)

// Utilisation normale ensuite
<Map center={[2.35, 48.85]} />
```

**Nuxt : composant `<ClientOnly>`**
```vue
<template>
  <!-- Le contenu est ignoré en SSR -->
  <ClientOnly>
    <AddressMap :addresses="addresses" />

    <!-- Slot fallback pour le SSR -->
    <template #fallback>
      <div class="h-[400px] bg-gray-100 flex items-center justify-center">
        Chargement de la carte...
      </div>
    </template>
  </ClientOnly>
</template>
```

### Tableau comparatif

| Aspect | Next.js | Nuxt |
|--------|---------|------|
| Syntaxe | `dynamic(() => import(), { ssr: false })` | `<ClientOnly>` |
| Type | HOC (Higher Order Component) | Composant wrapper |
| Import | Import dynamique | Import normal |
| Fallback | `loading: () => <...>` | `<template #fallback>` |
| Code splitting | Automatique | Manuel si voulu |
| Lisibilité | Moins lisible | Plus déclaratif |

---

## Lifecycle Vue vs React

### Vue : hooks séparés

```typescript
// onMounted = après le premier render DOM
onMounted(() => {
  console.log('Composant monté')
  // DOM accessible ici
})

// onUnmounted = avant destruction
onUnmounted(() => {
  console.log('Composant détruit')
  // Cleanup ici
})

// watch = observer les changements
watch(source, (newVal, oldVal) => {
  console.log('Valeur changée')
})
```

### React : useEffect combiné

```tsx
useEffect(() => {
  // Mount
  console.log('Composant monté')

  // Cleanup (unmount)
  return () => {
    console.log('Composant détruit')
  }
}, [])  // [] = une seule fois

// Watch équivalent
useEffect(() => {
  console.log('Valeur changée')
}, [dependency])  // Dépendance explicite
```

### Tableau comparatif lifecycle

| React | Vue 3 | Quand |
|-------|-------|-------|
| `useEffect(() => {}, [])` | `onMounted()` | Après premier render |
| `useEffect return cleanup` | `onUnmounted()` | Avant destruction |
| `useEffect(() => {}, [dep])` | `watch(dep, () => {})` | Quand dep change |
| - | `onBeforeMount()` | Juste avant render |
| - | `onBeforeUnmount()` | Juste avant destruction |
| `useLayoutEffect` | `onMounted` (sync) | Layout synchrone |
| - | `watchEffect()` | Auto-track deps |

---

## Template ref vs useRef

### React : useRef

```tsx
function Map() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      // containerRef.current = l'élément DOM
      new maplibregl.Map({
        container: containerRef.current
      })
    }
  }, [])

  return <div ref={containerRef} />
}
```

### Vue : ref + template ref

```vue
<script setup>
// Même nom que l'attribut ref dans le template
const mapContainer = ref<HTMLElement | null>(null)

onMounted(() => {
  if (mapContainer.value) {
    // mapContainer.value = l'élément DOM
    new maplibregl.Map({
      container: mapContainer.value
    })
  }
})
</script>

<template>
  <!-- ref="mapContainer" lie à la ref du même nom -->
  <div ref="mapContainer" />
</template>
```

**Différences clés :**
- React : `ref.current` pour accéder
- Vue : `ref.value` pour accéder
- Vue : le nom de la ref JS doit matcher l'attribut `ref` du template

---

## Installation

```bash
cd apps/web
npm install maplibre-gl
```

MapLibre est un fork open-source de Mapbox GL JS. Gratuit, sans clé API.

---

## Les fichiers à créer

### 1. Créer `apps/web/app/components/AddressMap.vue`

```vue
<script setup lang="ts">
/**
 * Carte interactive avec MapLibre GL.
 *
 * Lifecycle :
 *
 * ┌───────────────────────────────────────────────┐
 * │  onMounted                                    │
 * │     │                                         │
 * │     ▼                                         │
 * │  Créer la carte MapLibre                      │
 * │     │                                         │
 * │     ▼                                         │
 * │  Ajouter les markers initiaux                 │
 * │     │                                         │
 * │     ▼                                         │
 * │  watch(addresses)                             │
 * │     │                                         │
 * │     ▼  (quand addresses change)               │
 * │  Supprimer anciens markers                    │
 * │  Ajouter nouveaux markers                     │
 * │  Ajuster la vue                               │
 * │     │                                         │
 * │     ▼                                         │
 * │  onUnmounted                                  │
 * │     │                                         │
 * │     ▼                                         │
 * │  Cleanup : markers.remove(), map.remove()     │
 * └───────────────────────────────────────────────┘
 */

// ============================================================
// IMPORT MAPLIBRE
// ============================================================
// Import "classique" car MapLibre n'est pas auto-importé.
// Le CSS est nécessaire pour le style des contrôles.
// ============================================================

import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

// ============================================================
// TYPES
// ============================================================

interface Address {
  id: string
  lat: number
  lon: number
  label: string
}

// ============================================================
// PROPS
// ============================================================
// defineProps définit les props acceptées.
// Le type est inféré automatiquement.
//
// Equivalent React :
// interface Props {
//   addresses: Address[]
//   center?: [number, number]
//   zoom?: number
// }
// function AddressMap({ addresses, center, zoom }: Props)
// ============================================================

const props = defineProps<{
  addresses: Address[]
  center?: [number, number]  // [longitude, latitude]
  zoom?: number
}>()

// ============================================================
// REFS
// ============================================================
// Trois refs pour gérer :
// 1. Le conteneur DOM
// 2. L'instance de la carte
// 3. Les markers pour le cleanup
// ============================================================

// Ref template : lié à ref="mapContainer" dans le template
// Sera peuplé après le mount avec l'élément DOM
const mapContainer = ref<HTMLElement | null>(null)

// Ref pour stocker l'instance MapLibre
// On en a besoin pour ajouter des markers, etc.
const map = ref<maplibregl.Map | null>(null)

// Ref pour stocker les markers
// Nécessaire pour les supprimer lors du cleanup ou update
const markers = ref<maplibregl.Marker[]>([])

// ============================================================
// ON MOUNTED
// ============================================================
// Equivalent React :
// useEffect(() => {
//   const map = new maplibregl.Map({...})
//   return () => map.remove()
// }, [])
//
// Différence : Vue sépare mount et unmount en hooks distincts.
// Plus clair pour comprendre le lifecycle.
// ============================================================

onMounted(() => {
  // Guard : le container doit exister
  // En théorie toujours vrai après mount, mais TypeScript veut une vérif
  if (!mapContainer.value) return

  // ============================================================
  // CRÉER LA CARTE
  // ============================================================
  // MapLibre a besoin d'un élément DOM comme container.
  // Le style vient d'un serveur de tuiles (ici Stadia Maps).
  //
  // Alternatives de styles gratuits :
  // - Stadia : https://tiles.stadiamaps.com/styles/
  // - MapTiler : https://www.maptiler.com/maps/
  // - OpenFreeMap : https://openfreemap.org/
  // ============================================================

  map.value = new maplibregl.Map({
    container: mapContainer.value,

    // Style de la carte (tuiles + style visuel)
    // Stadia Maps est gratuit avec un usage raisonnable
    style: 'https://tiles.stadiamaps.com/styles/alidade_smooth.json',

    // Centre initial : Paris par défaut
    // Format : [longitude, latitude] (attention à l'ordre !)
    center: props.center ?? [2.3522, 48.8566],

    // Niveau de zoom initial (0-22)
    zoom: props.zoom ?? 12
  })

  // ============================================================
  // AJOUTER LES CONTRÔLES
  // ============================================================
  // NavigationControl = boutons zoom +/- et rotation
  // ============================================================

  map.value.addControl(new maplibregl.NavigationControl())

  // Ajouter les markers initiaux
  addMarkers(props.addresses)
})

// ============================================================
// ON UNMOUNTED
// ============================================================
// Cleanup obligatoire pour éviter les memory leaks !
// MapLibre crée des ressources GPU (WebGL context).
// Si on ne les libère pas, ça peut crasher le navigateur.
//
// Equivalent React :
// useEffect(() => {
//   ...
//   return () => {
//     markers.forEach(m => m.remove())
//     map.remove()
//   }
// }, [])
// ============================================================

onUnmounted(() => {
  // Supprimer tous les markers
  markers.value.forEach(m => m.remove())
  markers.value = []

  // Détruire la carte (libère les ressources WebGL)
  map.value?.remove()
  map.value = null
})

// ============================================================
// WATCH ADDRESSES
// ============================================================
// Réagir aux changements des addresses.
// Quand le parent passe de nouvelles addresses, on met à jour.
//
// { deep: true } observe les changements profonds dans le tableau.
// Sans ça, Vue ne détecte que les réassignations (addresses = [...]).
//
// Equivalent React :
// useEffect(() => {
//   // Supprimer anciens markers
//   // Ajouter nouveaux markers
// }, [addresses])
// ============================================================

watch(
  () => props.addresses,
  (newAddresses) => {
    // Cleanup des anciens markers
    markers.value.forEach(m => m.remove())
    markers.value = []

    // Ajouter les nouveaux
    addMarkers(newAddresses)

    // Ajuster la vue pour montrer tous les markers
    if (newAddresses.length > 0 && map.value) {
      fitBounds(newAddresses)
    }
  },
  { deep: true }  // Observer les changements dans le tableau
)

// ============================================================
// HELPER : AJOUTER DES MARKERS
// ============================================================

function addMarkers(addresses: Address[]) {
  // Guard : carte doit être initialisée
  if (!map.value) return

  addresses.forEach(addr => {
    // Créer le marker
    const marker = new maplibregl.Marker()
      // Position : [longitude, latitude]
      .setLngLat([addr.lon, addr.lat])
      // Popup au clic
      .setPopup(
        new maplibregl.Popup().setHTML(`
          <div class="p-2">
            <strong>${addr.label}</strong>
          </div>
        `)
      )
      // Ajouter à la carte
      .addTo(map.value!)

    // Stocker pour le cleanup
    markers.value.push(marker)
  })
}

// ============================================================
// HELPER : AJUSTER LA VUE
// ============================================================
// fitBounds ajuste le zoom et le centre pour montrer
// tous les points avec un padding.
// ============================================================

function fitBounds(addresses: Address[]) {
  if (!map.value || addresses.length === 0) return

  // Créer les bounds englobant tous les points
  const bounds = new maplibregl.LngLatBounds()
  addresses.forEach(addr => {
    bounds.extend([addr.lon, addr.lat])
  })

  // Animer la carte vers ces bounds
  map.value.fitBounds(bounds, {
    padding: 50,      // Marge autour des points
    maxZoom: 16       // Ne pas zoomer trop près
  })
}
</script>

<template>
  <!--
    Le container de la carte.

    ref="mapContainer" lie cet élément à la ref JavaScript.
    Après mount, mapContainer.value = cet élément DOM.

    min-h-[400px] garantit une hauteur minimale.
    MapLibre a besoin de dimensions pour s'initialiser.
    Sans hauteur, la carte ne s'affiche pas !

    Equivalent React :
    <div ref={mapContainerRef} className="w-full h-full min-h-[400px]" />
  -->
  <div
    ref="mapContainer"
    class="w-full h-full min-h-[400px] rounded-lg overflow-hidden"
  />
</template>
```

### 2. Modifier la page commune pour inclure la carte

Ajouter dans `apps/web/app/pages/communes/[id].vue` :

```vue
<script setup lang="ts">
// ... code existant ...

// ============================================================
// PRÉPARER LES ADRESSES POUR LA CARTE
// ============================================================
// On transforme les données GraphQL en format attendu par AddressMap.
// flat() + map() pour extraire les numéros de toutes les voies.
//
// slice(0, 100) limite le nombre pour les performances.
// 1000+ markers = carte lente.
// ============================================================

const mapAddresses = computed(() => {
  if (!commune.value?.voies) return []

  return commune.value.voies
    .flatMap(voie =>
      // Pour chaque voie, extraire les numéros
      (voie.numeros ?? []).map(num => ({
        id: num.id,
        lat: num.lat,
        lon: num.lon,
        // Label affiché dans le popup
        label: `${num.numero}${num.suffixe ?? ''} ${voie.nom}`
      }))
    )
    // Limiter pour les performances
    .slice(0, 100)
})
</script>

<template>
  <!-- ... après les statistiques ... -->

  <!--
    CARTE DES ADRESSES
    Wrappée dans ClientOnly car MapLibre utilise window.
  -->
  <div class="mt-6 bg-white rounded-lg shadow overflow-hidden">
    <h2 class="px-6 py-4 border-b font-semibold text-gray-700">
      Carte des adresses
    </h2>
    <div class="h-[400px]">
      <!--
        ClientOnly = dynamic({ ssr: false }) en Next.js

        Ce composant :
        1. En SSR : affiche le #fallback (ou rien)
        2. Côté client : monte le contenu normal

        Pourquoi ? MapLibre utilise `document.createElement` et `window`
        qui n'existent pas en Node.js.

        Equivalent Next.js :
        const Map = dynamic(() => import('./Map'), {
          ssr: false,
          loading: () => <p>Chargement...</p>
        })
      -->
      <ClientOnly>
        <!--
          AddressMap reçoit les addresses transformées.
          center/zoom sont optionnels (défauts dans le composant).
        -->
        <AddressMap
          :addresses="mapAddresses"
          :center="[2.3522, 48.8566]"
          :zoom="13"
        />

        <!--
          Slot #fallback = contenu affiché pendant le SSR
          et avant que le composant client soit monté.

          Equivalent Next.js : loading: () => <...>
        -->
        <template #fallback>
          <div class="h-full flex items-center justify-center bg-gray-100">
            <p class="text-gray-500">Chargement de la carte...</p>
          </div>
        </template>
      </ClientOnly>
    </div>
  </div>
</template>
```

### 3. Mettre à jour la query GraphQL

La query doit inclure les coordonnées :

```typescript
const COMMUNE_QUERY = gql`
  query Commune($id: ID!) {
    commune(id: $id) {
      id
      nom
      codePostal
      departement {
        code
        nom
      }
      voies {
        id
        nom
        numeros {
          id
          numero
          suffixe
          lat    # ← Ajouter
          lon    # ← Ajouter
        }
      }
    }
  }
`
```

---

## Comprendre watchEffect vs watch

### watch : dépendances explicites

```typescript
// On dit explicitement ce qu'on observe
watch(
  () => props.addresses,  // ← Source explicite
  (newVal, oldVal) => {
    // Code exécuté quand addresses change
  }
)

// Plusieurs sources
watch(
  [() => props.addresses, () => props.zoom],
  ([newAddresses, newZoom], [oldAddresses, oldZoom]) => {
    // Code exécuté quand l'un des deux change
  }
)
```

### watchEffect : dépendances automatiques

```typescript
// Vue détecte automatiquement les dépendances
watchEffect(() => {
  // Ce code utilise props.addresses et props.zoom
  // Vue va automatiquement tracker ces dépendances
  console.log(props.addresses.length, props.zoom)
})

// Équivalent React avec auto-deps (n'existe pas vraiment)
// useAutoEffect(() => {
//   console.log(addresses.length, zoom)
// })
```

### Quand utiliser lequel ?

| Cas d'usage | Recommandation |
|-------------|----------------|
| Transformer des données | `watch` avec dépendance explicite |
| Side effects simples | `watchEffect` |
| Accéder old/new values | `watch` (seul moyen) |
| Lazy execution | `watch` (par défaut lazy) |
| Immediate execution | `watch({ immediate: true })` ou `watchEffect` |

---

## Commandes à exécuter

```bash
# Installation de MapLibre
cd apps/web
npm install maplibre-gl

# Lancer les serveurs
npm run dev:api   # Terminal 1
npm run dev:web   # Terminal 2
```

---

## Checkpoint ✓

### 1. Vérifier l'installation

Pas d'erreur dans la console liée à maplibre-gl.

### 2. Ouvrir une commune

`http://localhost:3000/communes/75101`

**Tu dois voir** :
- La carte sous les statistiques
- Des markers rouges sur les adresses
- Contrôles de zoom en haut à droite
- Popup au clic sur un marker

### 3. Tester l'interaction

1. Clic sur un marker → popup avec l'adresse
2. Zoom +/- avec les boutons
3. Drag pour déplacer la carte
4. Double-clic pour zoomer

### 4. Vérifier le SSR

1. Clic droit > "Afficher le code source"
2. La carte N'EST PAS dans le HTML (normal, c'est client-only)
3. Le fallback "Chargement de la carte..." PEUT apparaître
4. Le reste de la page EST pré-rendu

---

## Pièges courants

| Problème | Cause | Solution |
|----------|-------|----------|
| `window is not defined` | SSR tente de rendre MapLibre | Wrapper dans `<ClientOnly>` |
| Carte vide/invisible | Container sans dimensions | Ajouter `min-h-[400px]` ou hauteur fixe |
| Markers pas mis à jour | `watch` sans `deep` | Ajouter `{ deep: true }` |
| Memory leak | Pas de cleanup | `onUnmounted` avec `.remove()` |
| Style CSS absent | Import CSS oublié | `import 'maplibre-gl/dist/maplibre-gl.css'` |
| Carte floue | Pixel ratio non géré | Laisser MapLibre gérer (par défaut ok) |
| Erreur CORS sur les tuiles | Serveur de tuiles bloqué | Utiliser un serveur gratuit autorisé |

---

## Performance : beaucoup de markers

### Problème : 1000+ markers = carte lente

Chaque marker est un élément DOM. 1000 éléments DOM = lent.

### Solution : clustering

```typescript
onMounted(() => {
  map.value = new maplibregl.Map({ ... })

  map.value.on('load', () => {
    // ============================================================
    // SOURCE GEOJSON AVEC CLUSTERING
    // ============================================================
    // Au lieu de markers individuels, on utilise une source GeoJSON
    // avec clustering activé. MapLibre regroupe les points proches.
    // ============================================================

    map.value!.addSource('addresses', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: props.addresses.map(addr => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [addr.lon, addr.lat]
          },
          properties: { label: addr.label }
        }))
      },
      cluster: true,          // Activer le clustering
      clusterMaxZoom: 14,     // Zoom max pour clustering
      clusterRadius: 50       // Rayon de regroupement (pixels)
    })

    // ============================================================
    // LAYER POUR LES CLUSTERS
    // ============================================================
    // Cercles représentant les clusters (groupes de points)
    // ============================================================

    map.value!.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'addresses',
      filter: ['has', 'point_count'],  // Seulement les clusters
      paint: {
        'circle-color': '#3b82f6',
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          15,    // 15px pour < 10 points
          10, 20,  // 20px pour 10-99
          100, 25  // 25px pour 100+
        ]
      }
    })

    // ============================================================
    // LAYER POUR LE NOMBRE DANS LES CLUSTERS
    // ============================================================

    map.value!.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'addresses',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-size': 12
      },
      paint: {
        'text-color': '#ffffff'
      }
    })

    // ============================================================
    // LAYER POUR LES POINTS INDIVIDUELS
    // ============================================================

    map.value!.addLayer({
      id: 'unclustered-point',
      type: 'circle',
      source: 'addresses',
      filter: ['!', ['has', 'point_count']],  // Pas de cluster
      paint: {
        'circle-color': '#ef4444',
        'circle-radius': 6
      }
    })
  })
})
```

---

## Pattern : Carte réutilisable

Pour une carte plus générique :

```vue
<!-- components/BaseMap.vue -->
<script setup lang="ts">
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const props = withDefaults(defineProps<{
  center?: [number, number]
  zoom?: number
  style?: string
}>(), {
  center: () => [2.3522, 48.8566],
  zoom: 12,
  style: 'https://tiles.stadiamaps.com/styles/alidade_smooth.json'
})

// Exposer l'instance map au parent
const map = ref<maplibregl.Map | null>(null)
defineExpose({ map })

const container = ref<HTMLElement | null>(null)

onMounted(() => {
  if (!container.value) return

  map.value = new maplibregl.Map({
    container: container.value,
    style: props.style,
    center: props.center,
    zoom: props.zoom
  })

  map.value.addControl(new maplibregl.NavigationControl())
})

onUnmounted(() => {
  map.value?.remove()
})
</script>

<template>
  <div ref="container" class="w-full h-full" />
</template>
```

Utilisation :

```vue
<script setup>
const mapRef = ref()

function addMarker(coords: [number, number]) {
  if (mapRef.value?.map) {
    new maplibregl.Marker()
      .setLngLat(coords)
      .addTo(mapRef.value.map)
  }
}
</script>

<template>
  <ClientOnly>
    <BaseMap ref="mapRef" :center="[2.35, 48.85]" />
  </ClientOnly>
</template>
```

---

## Alternatives à MapLibre

| Librairie | Avantages | Inconvénients |
|-----------|-----------|---------------|
| **MapLibre GL** | Gratuit, WebGL, performant | Tuiles à héberger ou service tiers |
| **Leaflet** | Simple, léger, populaire | Pas de WebGL (moins fluide) |
| **Mapbox GL** | Écosystème riche | Payant au-delà d'un seuil |
| **OpenLayers** | Très complet, SIG | Complexe, lourd |
| **deck.gl** | Visualisations 3D | Overkill pour des markers simples |

---

## Prochaine étape

→ [16-deploy.md](./16-deploy.md) : Sécuriser et déployer
