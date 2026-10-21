import { describe, it, expect } from 'vitest';
import { annulerTap, cumulerTap, libelleCumul } from './cumul';

describe('cumul', () => {
  it('démarre à +1 puis cumule tant que le délai court', () => {
    const a = cumulerTap(null, 1, 0);
    expect(a).toEqual({ signe: 1, n: 1, expireA: 1300 });
    expect(cumulerTap(a, 1, 1000)).toEqual({ signe: 1, n: 2, expireA: 2300 });
  });
  it('repart à 1 après expiration ou changement de signe', () => {
    const a = cumulerTap(null, 1, 0);
    expect(cumulerTap(a, 1, 1300)?.n).toBe(1);
    expect(cumulerTap(a, -1, 100)).toEqual({ signe: -1, n: 1, expireA: 1400 });
  });
  it('affiche le cumul avec le vrai signe moins', () => {
    expect(libelleCumul({ signe: 1, n: 3, expireA: 0 })).toBe('+3');
    expect(libelleCumul({ signe: -1, n: 2, expireA: 0 })).toBe('−2');
  });
  it('annule le dernier tap : N−1, ou plus rien si c’était le premier', () => {
    const deux = cumulerTap(cumulerTap(null, 1, 0), 1, 100);
    expect(annulerTap(deux)).toEqual({ signe: 1, n: 1, expireA: 1400 });
    expect(annulerTap(cumulerTap(null, 1, 0))).toBeNull();
    expect(annulerTap(null)).toBeNull();
  });
});
