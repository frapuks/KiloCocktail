import { describe, it, expect } from 'vitest';
import { annulerTap, cumulerTap, libelleCumul } from './cumul';

describe('cumul', () => {
  it('démarre à +1 puis cumule tant que le délai court', () => {
    const a = cumulerTap(null, 1, 0);
    expect(a).toEqual({ n: 1, expireA: 1300 });
    expect(cumulerTap(a, 1, 1000)).toEqual({ n: 2, expireA: 2300 });
  });
  it('repart de zéro après expiration', () => {
    const a = cumulerTap(null, 1, 0);
    expect(cumulerTap(a, 1, 1300)?.n).toBe(1);
    expect(cumulerTap(a, -1, 1300)).toEqual({ n: -1, expireA: 2600 });
  });
  it('fait baisser un +N encore affiché avec un −1, et inversement', () => {
    const trois = cumulerTap(cumulerTap(cumulerTap(null, 1, 0), 1, 100), 1, 200);
    expect(cumulerTap(trois, -1, 300)).toEqual({ n: 2, expireA: 1600 });
    const moinsDeux = cumulerTap(cumulerTap(null, -1, 0), -1, 100);
    expect(cumulerTap(moinsDeux, 1, 200)).toEqual({ n: -1, expireA: 1500 });
  });
  it('disparaît quand le bilan revient à zéro', () => {
    expect(cumulerTap(cumulerTap(null, 1, 0), -1, 100)).toBeNull();
  });
  it('affiche le cumul avec le vrai signe moins', () => {
    expect(libelleCumul({ n: 3, expireA: 0 })).toBe('+3');
    expect(libelleCumul({ n: -2, expireA: 0 })).toBe('−2');
  });
  it('annule le dernier tap : N−1, ou plus rien si c’était le premier', () => {
    const deux = cumulerTap(cumulerTap(null, 1, 0), 1, 100);
    expect(annulerTap(deux)).toEqual({ n: 1, expireA: 1400 });
    expect(annulerTap(cumulerTap(null, 1, 0))).toBeNull();
    expect(annulerTap(null)).toBeNull();
  });
});
