/**
 * Calcule le score en fonction de la distance en mètres.
 */
export const calculateScore = (distanceMeters: number): number => {
  if (distanceMeters < 25) return 1000   // Parfait
  if (distanceMeters < 50) return 900    // Excellent
  if (distanceMeters < 100) return 750   // Très bien
  if (distanceMeters < 200) return 600   // Bien
  if (distanceMeters < 350) return 450   // Correct
  if (distanceMeters < 500) return 300   // Passable
  if (distanceMeters < 750) return 150   // Faible
  if (distanceMeters < 1000) return 50   // Très faible
  return 0                                // Trop loin
}
