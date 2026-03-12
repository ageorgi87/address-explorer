<script setup lang="ts">
import maplibregl, { Map, Marker } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { CARTO_VOYAGER_STYLE, STRASBOURG_CENTER, DEFAULT_ZOOM, COMMUNE_ZOOM } from './config/mapConfig'
import { createMarkerElement } from './lib/createMarkerElement'
import { addAnswerLine, removeAnswerLine } from './lib/answerLineLayer'
import { fitCommuneBounds } from './lib/fitCommuneBounds'

interface Position {
  lat: number
  lon: number
}

interface CommuneBounds {
  minLat: number
  maxLat: number
  minLon: number
  maxLon: number
}

const props = defineProps<{
  guessPosition: Position | null
  answerPosition: Position | null
  showAnswer: boolean
  communeBounds?: CommuneBounds
}>()

const emit = defineEmits<{
  click: [lat: number, lon: number]
}>()

const mapContainer = ref<HTMLElement | null>(null)
const map = shallowRef<Map | null>(null)
const guessMarker = shallowRef<Marker | null>(null)
const answerMarker = shallowRef<Marker | null>(null)

onMounted(() => {
  if (!mapContainer.value) return

  const mapInstance = new maplibregl.Map({
    container: mapContainer.value,
    style: CARTO_VOYAGER_STYLE,
    center: STRASBOURG_CENTER,
    zoom: props.communeBounds ? COMMUNE_ZOOM : DEFAULT_ZOOM,
  })

  mapInstance.addControl(new maplibregl.NavigationControl(), 'top-right')

  if (props.communeBounds) {
    mapInstance.on('load', () => {
      fitCommuneBounds(mapInstance, props.communeBounds!)
    })
  }

  mapInstance.on('click', (e) => {
    if (props.showAnswer) return
    emit('click', e.lngLat.lat, e.lngLat.lng)
  })

  map.value = mapInstance
})

watch(
  () => props.guessPosition,
  (pos, oldPos) => {
    const mapInstance = map.value
    if (!mapInstance) return

    guessMarker.value?.remove()

    if (pos) {
      guessMarker.value = new maplibregl.Marker({ element: createMarkerElement('guess') })
        .setLngLat([pos.lon, pos.lat])
        .addTo(mapInstance)
    }

    if (oldPos && !pos) {
      answerMarker.value?.remove()
      removeAnswerLine(mapInstance)

      if (props.communeBounds) {
        fitCommuneBounds(mapInstance, props.communeBounds, { duration: 1000 })
      } else {
        mapInstance.flyTo({
          center: STRASBOURG_CENTER,
          zoom: DEFAULT_ZOOM,
          duration: 1000,
        })
      }
    }
  },
  { immediate: true }
)

watch(
  () => props.showAnswer,
  (show) => {
    const mapInstance = map.value
    if (!mapInstance) return

    answerMarker.value?.remove()
    removeAnswerLine(mapInstance)

    if (show && props.answerPosition && props.guessPosition) {
      answerMarker.value = new maplibregl.Marker({ element: createMarkerElement('answer') })
        .setLngLat([props.answerPosition.lon, props.answerPosition.lat])
        .addTo(mapInstance)

      addAnswerLine(
        mapInstance,
        [props.guessPosition.lon, props.guessPosition.lat],
        [props.answerPosition.lon, props.answerPosition.lat]
      )

      const bounds = new maplibregl.LngLatBounds()
      bounds.extend([props.guessPosition.lon, props.guessPosition.lat])
      bounds.extend([props.answerPosition.lon, props.answerPosition.lat])

      mapInstance.fitBounds(bounds, {
        padding: 100,
        maxZoom: 16,
      })
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  guessMarker.value?.remove()
  answerMarker.value?.remove()
  map.value?.remove()
})
</script>

<template>
  <div
    ref="mapContainer"
    class="w-full h-full cursor-crosshair"
  />
</template>

<style>
.maplibregl-ctrl-attrib {
  background: rgba(255, 255, 255, 0.8) !important;
  font-size: 10px !important;
}
</style>
