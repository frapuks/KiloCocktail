import type { Verre } from './types';

export function totauxParLigne(verres: Verre[]): Map<string, number> {
  const totaux = new Map<string, number>();
  for (const v of verres) totaux.set(v.ligneId, (totaux.get(v.ligneId) ?? 0) + 1);
  return totaux;
}

export function totalLigne(verres: Verre[], ligneId: string): number {
  return verres.filter((v) => v.ligneId === ligneId).length;
}

export function dernierVerre(
  verres: Verre[],
  ligneId: string,
  exclus?: ReadonlySet<string>,
): Verre | null {
  let dernier: Verre | null = null;
  for (const v of verres) {
    if (v.ligneId !== ligneId || exclus?.has(v.id)) continue;
    if (dernier === null || v.creeLe > dernier.creeLe) dernier = v;
  }
  return dernier;
}

export function totalPresta(verres: Verre[]): number {
  return verres.length;
}
