import { describe, expect, it } from 'vitest';
import type { Cocktail, Ligne, Variante } from './types';
import { dateDuJour, formatDate, formatDateLongue, libelleServis, nomLigne, nomPresta } from './affichage';

const mojito: Cocktail = { id: 'm', nom: 'Mojito', nomNormalise: 'mojito', variantes: 'les-deux', nomSansAlcool: 'Nojito', archive: false };
const mule: Cocktail = { ...mojito, id: 'mm', nom: 'Moscow Mule', nomSansAlcool: null };
const colada: Cocktail = { ...mojito, id: 'c', nom: 'Virgin Colada', variantes: 'sans', nomSansAlcool: null };
const l = (cocktailId: string, variante: Variante): Ligne => ({ id: 'x', cocktailId, variante, masquee: false });

describe('affichage', () => {
  it('nomme une ligne avec alcool sans sous-titre', () => {
    expect(nomLigne(l('m', 'avec'), mojito)).toEqual({ nom: 'Mojito', sousTitre: null });
  });
  it('utilise le nom sans alcool s’il existe, toujours avec le sous-titre', () => {
    expect(nomLigne(l('m', 'sans'), mojito)).toEqual({ nom: 'Nojito', sousTitre: 'sans alcool' });
    expect(nomLigne(l('mm', 'sans'), mule)).toEqual({ nom: 'Moscow Mule', sousTitre: 'sans alcool' });
    expect(nomLigne(l('c', 'sans'), colada)).toEqual({ nom: 'Virgin Colada', sousTitre: 'sans alcool' });
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
