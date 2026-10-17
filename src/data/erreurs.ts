import type { Desabonner } from './depots';

const abonnes = new Set<() => void>();

// Affiche le bandeau d'erreur d'écriture (abonnés de surErreurEcriture) et journalise la raison.
export function signalerErreurEcriture(raison?: unknown): void {
  if (raison !== undefined) console.error('Écriture refusée :', raison);
  abonnes.forEach((cb) => cb());
}

export function suivreEcriture(p: Promise<unknown>): void {
  p.catch((raison: unknown) => signalerErreurEcriture(raison));
}

export function surErreurEcriture(cb: () => void): Desabonner {
  abonnes.add(cb);
  return () => {
    abonnes.delete(cb);
  };
}
