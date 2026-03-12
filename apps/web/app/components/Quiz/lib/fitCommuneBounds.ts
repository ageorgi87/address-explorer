/**
 * Centre la carte sur les limites géographiques d'une commune.
 */
import type { Map } from 'maplibre-gl'

interface CommuneBounds {
  minLat: number
  maxLat: number
  minLon: number
  maxLon: number
}

export const fitCommuneBounds = (
  map: Map,
  bounds: CommuneBounds,
  options?: { duration?: number }
): void => {
  map.fitBounds(
    [
      [bounds.minLon, bounds.minLat],
      [bounds.maxLon, bounds.maxLat],
    ],
    { padding: 50, maxZoom: 15, ...options }
  )
}
