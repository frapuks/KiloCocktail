import { describe, expect, it } from 'vitest';
import type { Cocktail } from './types';
import { comparerCocktails, dateDuJour, formatDate, libelleServis, nomLigne, nomPresta } from './affichage';

const mojito: Cocktail = { id: 'm', nom: 'Mojito', nomNormalise: 'mojito', alcool: true, archive: false };
const nojito: Cocktail = { ...mojito, id: 'n', nom: 'Nojito', nomNormalise: 'nojito', alcool: false };
const mule: Cocktail = { id: 'u', nom: 'Moscow Mule', nomNormalise: 'moscow mule', alcool: true, archive: false };

describe('affichage', () => {
  it('nomme un cocktail avec alcool sans sous-titre, sans alcool avec sous-titre', () => {
    expect(nomLigne(mojito)).toEqual({ nom: 'Mojito', sousTitre: null });
    expect(nomLigne(nojito)).toEqual({ nom: 'Nojito', sousTitre: 'sans alcool' });
  });
  it('compare par nom, sans tenir compte des accents ni de la casse', () => {
    const ecume: Cocktail = { ...mule, id: 'e', nom: 'écume' };
    expect([nojito, mule, ecume, mojito].sort(comparerCocktails)).toEqual([ecume, mojito, mule, nojito]);
  });
  it('formate les dates', () => {
    expect(formatDate('2026-10-17')).toBe('17/10/2026');
    expect(formatDate('2026-01-05')).toBe('05/01/2026');
  });
  it('nomme une presta par son client ou par sa date', () => {
    expect(nomPresta({ client: 'Julie Martin', date: '2026-10-17' })).toBe('Julie Martin');
    expect(nomPresta({ client: null, date: '2026-10-17' })).toBe('Presta du 17/10/2026');
    expect(nomPresta({ client: '   ', date: '2026-10-17' })).toBe('Presta du 17/10/2026');
  });
  it('accorde servi / servis', () => {
    expect(libelleServis(0)).toBe('servi');
    expect(libelleServis(1)).toBe('servi');
    expect(libelleServis(2)).toBe('servis');
  });
  it('dateDuJour utilise la date locale', () => {
    expect(dateDuJour(new Date(2026, 9, 18, 0, 30))).toBe('2026-10-18');
  });
});
