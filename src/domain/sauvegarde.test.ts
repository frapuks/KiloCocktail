import { describe, it, expect } from 'vitest';
import { libelleSauvegarde } from './sauvegarde';

describe('sauvegarde', () => {
  it('libelle l’indicateur de sauvegarde', () => {
    expect(libelleSauvegarde({ ecrituresEnAttente: false, verresEnAttente: 0 })).toBe('Sauvegardé');
    expect(libelleSauvegarde({ ecrituresEnAttente: true, verresEnAttente: 12 })).toBe('Hors connexion · 12 en attente');
    expect(libelleSauvegarde({ ecrituresEnAttente: true, verresEnAttente: 0 })).toBe('Hors connexion · modifications en attente');
  });
});
