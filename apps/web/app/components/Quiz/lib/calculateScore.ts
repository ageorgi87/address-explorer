/**
 * Calcule le score en fonction de la distance en mètres.
 */
export const calculateScore = (distanceMeters: number): number => {
  if (distanceMeters < 25) return 1000
  if (distanceMeters < 50) return 900
  if (distanceMeters < 100) return 750
  if (distanceMeters < 200) return 600
  if (distanceMeters < 350) return 450
  if (distanceMeters < 500) return 300
  if (distanceMeters < 750) return 150
  if (distanceMeters < 1000) return 50
  return 0
}
