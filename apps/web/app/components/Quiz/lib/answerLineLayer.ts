/**
 * Gère la ligne pointillée entre le guess et la réponse sur la carte.
 */
import type { Map } from 'maplibre-gl'

const ANSWER_LINE_ID = 'answer-line'

export const removeAnswerLine = (map: Map): void => {
  if (map.getLayer(ANSWER_LINE_ID)) {
    map.removeLayer(ANSWER_LINE_ID)
  }
  if (map.getSource(ANSWER_LINE_ID)) {
    map.removeSource(ANSWER_LINE_ID)
  }
}

export const addAnswerLine = (
  map: Map,
  guessCoords: [number, number],
  answerCoords: [number, number]
): void => {
  map.addSource(ANSWER_LINE_ID, {
    type: 'geojson',
    data: {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [guessCoords, answerCoords],
      },
    },
  })

  map.addLayer({
    id: ANSWER_LINE_ID,
    type: 'line',
    source: ANSWER_LINE_ID,
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: {
      'line-color': '#f59e0b',
      'line-width': 3,
      'line-dasharray': [2, 2],
    },
  })
}
