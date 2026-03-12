/**
 * Formate un score avec séparateur de milliers.
 */

export const formatScore = (score: number): string =>
  score.toLocaleString("fr-FR");
