/**
 * Retourne un rating (texte, emoji, couleur) en fonction du pourcentage de réussite.
 */

export const getRating = (
  percentage: number,
): { text: string; emoji: string; color: string } => {
  if (percentage >= 90)
    return { text: "Légendaire !", emoji: "🏆", color: "text-yellow-400" };
  if (percentage >= 75)
    return { text: "Excellent !", emoji: "🥇", color: "text-emerald-400" };
  if (percentage >= 60)
    return { text: "Très bien !", emoji: "🥈", color: "text-green-400" };
  if (percentage >= 45)
    return { text: "Bien joué !", emoji: "🥉", color: "text-lime-400" };
  if (percentage >= 30)
    return { text: "Pas mal !", emoji: "👍", color: "text-yellow-400" };
  return { text: "Tu feras mieux !", emoji: "💪", color: "text-orange-400" };
};
