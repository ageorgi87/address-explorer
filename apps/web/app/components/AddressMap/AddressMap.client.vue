<script setup lang="ts">
/**
 * Carte interactive avec MapLibre GL.
 *
 * Concepts Vue démontrés :
 * - onMounted / onUnmounted : lifecycle hooks (vs useEffect return cleanup)
 * - watch({ deep: true }) : observer les changements profonds
 * - Template refs : accès au DOM via ref="mapContainer"
 */

import maplibregl from 'maplibre-gl'
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

// Instance MapLibre
const map = ref<maplibregl.Map | null>(null)

// Markers pour le cleanup
const markers = ref<maplibregl.Marker[]>([])

onMounted(() => {
  if (!mapContainer.value) return

  map.value = new maplibregl.Map({
    container: mapContainer.value,
    style: 'https://tiles.stadiamaps.com/styles/alidade_smooth.json',
    center: props.center ?? [2.3522, 48.8566],
    zoom: props.zoom ?? 12
  })

  map.value.addControl(new maplibregl.NavigationControl())

  addMarkers(map.value, props.addresses, markers.value)

  if (props.addresses.length > 0) {
    fitBounds(map.value, props.addresses)
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
    markers.value = []
    if (map.value) {
      addMarkers(map.value, newAddresses, markers.value)
      if (newAddresses.length > 0) {
        fitBounds(map.value, newAddresses)
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
