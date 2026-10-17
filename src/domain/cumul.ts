export const DUREE_CUMUL_MS = 1300;

export type Cumul = { signe: 1 | -1; n: number; expireA: number } | null;

export function cumulerTap(c: Cumul, signe: 1 | -1, maintenant: number): Cumul {
  const n = c !== null && c.signe === signe && maintenant < c.expireA ? c.n + 1 : 1;
  return { signe, n, expireA: maintenant + DUREE_CUMUL_MS };
}

export function libelleCumul(c: Exclude<Cumul, null>): string {
  return c.signe === 1 ? `+${c.n}` : `−${c.n}`;
}
