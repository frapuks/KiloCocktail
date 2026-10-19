import { describe, expect, it } from 'vitest';
import type { Cocktail } from './types';
import { comparerCocktails, dateDuJour, formatDate, formatDateLongue, libelleServis, nomLigne, nomPresta } from './affichage';

const mojito: Cocktail = { id: 'm', nom: 'Mojito', nomNormalise: 'mojito', alcool: true, archive: false };
const nojito: Cocktail = { ...mojito, id: 'n', alcool: false };
const mule: Cocktail = { id: 'u', nom: 'Moscow Mule', nomNormalise: 'moscow mule', alcool: true, archive: false };

describe('affichage', () => {
  it('nomme un cocktail avec alcool sans sous-titre, sans alcool avec sous-titre', () => {
    expect(nomLigne(mojito)).toEqual({ nom: 'Mojito', sousTitre: null });
    expect(nomLigne(nojito)).toEqual({ nom: 'Mojito', sousTitre: 'sans alcool' });
  });
  it('compare par nom puis avec alcool avant sans', () => {
    expect([nojito, mule, mojito].sort(comparerCocktails)).toEqual([mojito, nojito, mule]);
  });
  it('formate les dates', () => {
    expect(formatDate('2026-10-17')).toBe('17/10/2026');
    expect(formatDateLongue('2026-10-17')).toBe('samedi 17/10/2026');
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
