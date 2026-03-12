<script setup lang="ts">
/**
 * Carte interactive avec MapLibre GL.
 *
 * Concepts Vue démontrés :
 * - onMounted / onUnmounted : lifecycle hooks (vs useEffect return cleanup)
 * - watch({ deep: true }) : observer les changements profonds
 * - Template refs : accès au DOM via ref="mapContainer"
 * - shallowRef : pour les objets complexes non-réactifs (Map, Marker)
 */

import maplibregl, { Map, Marker } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { addMarkers, type Address } from './lib/addMarkers'
import { fitBounds } from './lib/fitBounds'

const props = defineProps<{
  addresses: Address[]
  center?: [number, number]
  zoom?: number
}>()

// Template ref : lié à ref="mapContainer" dans le template
const mapContainer = ref<HTMLElement | null>(null)

// Instance MapLibre - shallowRef car l'objet Map ne doit pas être réactif en profondeur
const map = shallowRef<Map | null>(null)

// Markers pour le cleanup - shallowRef car ce sont des objets MapLibre
const markers = shallowRef<Marker[]>([])

onMounted(() => {
  if (!mapContainer.value) return

  const mapInstance = new maplibregl.Map({
    container: mapContainer.value,
    style: 'https://tiles.stadiamaps.com/styles/alidade_smooth.json',
    center: props.center ?? [2.3522, 48.8566],
    zoom: props.zoom ?? 12
  })

  mapInstance.addControl(new maplibregl.NavigationControl())

  map.value = mapInstance

  const newMarkers: Marker[] = []
  addMarkers(mapInstance, props.addresses, newMarkers)
  markers.value = newMarkers

  if (props.addresses.length > 0) {
    fitBounds(mapInstance, props.addresses)
  }
})

// Cleanup obligatoire pour éviter les memory leaks
onUnmounted(() => {
  markers.value.forEach(m => m.remove())
  markers.value = []
  map.value?.remove()
  map.value = null
})

// Réagir aux changements des addresses
watch(
  () => props.addresses,
  (newAddresses) => {
    markers.value.forEach(m => m.remove())

    const mapInstance = map.value
    if (mapInstance) {
      const newMarkers: Marker[] = []
      addMarkers(mapInstance, newAddresses, newMarkers)
      markers.value = newMarkers

      if (newAddresses.length > 0) {
        fitBounds(mapInstance, newAddresses)
      }
    }
  },
  { deep: true }
)
</script>

<template>
  <div
    ref="mapContainer"
    class="w-full h-full min-h-[400px] rounded-lg overflow-hidden"
  />
</template>
