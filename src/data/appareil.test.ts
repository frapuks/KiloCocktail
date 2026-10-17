import { beforeEach, describe, expect, it } from 'vitest';
import { identifiantAppareil } from './appareil';

describe('identifiantAppareil', () => {
  beforeEach(() => localStorage.clear());

  it('crée puis réutilise le même identifiant', () => {
    const premier = identifiantAppareil();
    expect(premier).toMatch(/^appareil-[0-9a-f-]{36}$/);
    expect(localStorage.getItem('kilococktail.appareil')).toBe(premier);
    expect(identifiantAppareil()).toBe(premier);
  });
});
