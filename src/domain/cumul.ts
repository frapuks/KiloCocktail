export const DUREE_CUMUL_MS = 1300;

// Bilan des taps rapprochés d'une carte : n > 0 pour « +n », n < 0 pour « −n », n = 0 : rien d'affiché
// (bilan revenu à zéro, gardé pour qu'un +1 annulé ensuite le refasse passer à −1).
export type Cumul = { n: number; expireA: number } | null;

// Ajoute un tap (+1 ou −1) au bilan encore en cours : « +3 » puis un −1 donne « +2 ». Après expiration,
// il repart de zéro.
export function cumulerTap(c: Cumul, signe: 1 | -1, maintenant: number): Cumul {
  const n = (c !== null && maintenant < c.expireA ? c.n : 0) + signe;
  return { n, expireA: maintenant + DUREE_CUMUL_MS };
}

// Bilan à afficher, ou null s'il n'y a rien à montrer.
export function libelleCumul(c: Cumul): string | null {
  if (c === null || c.n === 0) return null;
  return c.n > 0 ? `+${c.n}` : `−${-c.n}`;
}

// Annule le dernier +1 du bilan (geste repris par le navigateur pour un défilement).
export function annulerTap(c: Cumul): Cumul {
  if (c === null || c.n === 1) return null;
  return { ...c, n: c.n - 1 };
}
