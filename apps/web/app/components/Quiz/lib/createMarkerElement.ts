/**
 * Crée un élément HTML pour un marker de carte (guess ou answer).
 */
export type MarkerType = 'guess' | 'answer'

const MARKER_CONFIG = {
  guess: {
    bgColor: 'bg-red-500',
    svgPath: 'M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z',
    animate: false,
  },
  answer: {
    bgColor: 'bg-emerald-500',
    svgPath: 'M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z',
    animate: true,
  },
}

export const createMarkerElement = (type: MarkerType): HTMLDivElement => {
  const config = MARKER_CONFIG[type]
  const el = document.createElement('div')
  el.className = `${type}-marker`
  el.innerHTML = `
    <div class="w-8 h-8 ${config.bgColor} rounded-full border-4 border-white shadow-lg flex items-center justify-center ${config.animate ? 'animate-bounce' : ''}">
      <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="${config.svgPath}" clip-rule="evenodd"/>
      </svg>
    </div>
  `
  return el
}
