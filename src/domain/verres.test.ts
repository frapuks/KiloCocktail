import { describe, it, expect } from 'vitest';
import type { Verre } from './types';
import { totauxParLigne, totalLigne, dernierVerre, totalPresta } from './verres';

const v = (id: string, ligneId: string, creeLe: number): Verre => ({ id, ligneId, creeLe, enAttente: false });
const verres = [v('a', 'L1', 10), v('b', 'L1', 30), v('c', 'L1', 20), v('d', 'L2', 5)];

describe('verres', () => {
  it('compte les verres par ligne', () => {
    expect(totauxParLigne(verres)).toEqual(new Map([['L1', 3], ['L2', 1]]));
    expect(totalLigne(verres, 'L1')).toBe(3);
    expect(totalLigne(verres, 'L9')).toBe(0);
    expect(totalPresta(verres)).toBe(4);
  });
  it('trouve le dernier verre d’une ligne par creeLe', () => {
    expect(dernierVerre(verres, 'L1')?.id).toBe('b');
  });
  it('ignore les verres exclus', () => {
    expect(dernierVerre(verres, 'L1', new Set(['b']))?.id).toBe('c');
  });
  it('renvoie null pour une ligne sans verre', () => {
    expect(dernierVerre(verres, 'L9')).toBeNull();
  });
});
