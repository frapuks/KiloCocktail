export const DUREE_CUMUL_MS = 1300;

// Bilan des taps rapprochés d'une carte : n > 0 pour « +n », n < 0 pour « −n » (jamais 0).
export type Cumul = { n: number; expireA: number } | null;

// Ajoute un tap (+1 ou −1) au bilan encore affiché : « +3 » puis un −1 donne « +2 ». Revenu à 0, le bilan
// disparaît ; après expiration, il repart de zéro.
export function cumulerTap(c: Cumul, signe: 1 | -1, maintenant: number): Cumul {
  const n = (c !== null && maintenant < c.expireA ? c.n : 0) + signe;
  return n === 0 ? null : { n, expireA: maintenant + DUREE_CUMUL_MS };
}

export function libelleCumul(c: Exclude<Cumul, null>): string {
  return c.n > 0 ? `+${c.n}` : `−${-c.n}`;
}

// Annule le dernier +1 du bilan (geste repris par le navigateur pour un défilement).
export function annulerTap(c: Cumul): Cumul {
  if (c === null || c.n === 1) return null;
  return { ...c, n: c.n - 1 };
}
