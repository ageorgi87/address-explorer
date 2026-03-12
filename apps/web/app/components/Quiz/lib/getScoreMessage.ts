/**
 * Retourne un message en fonction du score.
 */
export const getScoreMessage = (score: number): { text: string; emoji: string; color: string } => {
  if (score >= 900) return { text: 'Parfait !', emoji: '🎯', color: 'text-emerald-400' }
  if (score >= 750) return { text: 'Excellent !', emoji: '🌟', color: 'text-emerald-400' }
  if (score >= 600) return { text: 'Très bien !', emoji: '✨', color: 'text-green-400' }
  if (score >= 450) return { text: 'Bien joué !', emoji: '👍', color: 'text-lime-400' }
  if (score >= 300) return { text: 'Correct', emoji: '👌', color: 'text-yellow-400' }
  if (score >= 150) return { text: 'Passable', emoji: '😅', color: 'text-orange-400' }
  if (score > 0) return { text: 'Presque...', emoji: '😬', color: 'text-orange-500' }
  return { text: 'Trop loin !', emoji: '😵', color: 'text-red-400' }
}
