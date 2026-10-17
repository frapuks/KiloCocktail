import type { Desabonner } from './depots';

const abonnes = new Set<() => void>();

export function suivreEcriture(p: Promise<unknown>): void {
  p.catch(() => {
    abonnes.forEach((cb) => cb());
  });
}

export function surErreurEcriture(cb: () => void): Desabonner {
  abonnes.add(cb);
  return () => {
    abonnes.delete(cb);
  };
}
