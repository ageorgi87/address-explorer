/**
 * Ajuste la vue de la carte pour englober toutes les adresses.
 */

import maplibregl, { Map } from 'maplibre-gl'
import type { Address } from './addMarkers'

export const fitBounds = (map: Map, addresses: Address[]): void => {
  if (addresses.length === 0) return

  const bounds = new maplibregl.LngLatBounds()
  addresses.forEach(addr => {
    bounds.extend([addr.lon, addr.lat])
  })

  map.fitBounds(bounds, {
    padding: 50,
    maxZoom: 16
  })
}
