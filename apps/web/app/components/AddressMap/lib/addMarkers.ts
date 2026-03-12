/**
 * Ajoute des markers sur la carte pour chaque adresse.
 */

import maplibregl, { Map, Marker } from 'maplibre-gl'

export interface Address {
  id: string
  lat: number
  lon: number
  label: string
}

export const addMarkers = (
  map: Map,
  addresses: Address[],
  markers: Marker[]
): void => {
  addresses.forEach(addr => {
    const marker = new maplibregl.Marker()
      .setLngLat([addr.lon, addr.lat])
      .setPopup(
        new maplibregl.Popup().setHTML(`
          <div class="p-2">
            <strong>${addr.label}</strong>
          </div>
        `)
      )
      .addTo(map)

    markers.push(marker)
  })
}
