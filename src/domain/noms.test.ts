import { describe, expect, it } from 'vitest';
import type { Cocktail } from './types';
import { messageDoublon, messageDoublonCocktail, normaliserNom, trouverDoublon, trouverDoublonCocktail } from './noms';

const mojito: Cocktail = { id: 'm', nom: 'Mojito', nomNormalise: 'mojito', alcool: true, archive: false };
const nojito: Cocktail = { ...mojito, id: 'n', alcool: false };

describe('noms', () => {
  it('normalise espaces, casse et accents', () => {
    expect(normaliserNom('  Caïpirinha   Royale ')).toBe('caipirinha royale');
    expect(normaliserNom('Soirée d’entreprise')).toBe('soiree d’entreprise');
  });
  it('trouve un doublon actif ou archivé, sauf l’élément lui-même', () => {
    const els = [{ id: 'a', nomNormalise: 'mojito', archive: true }, { id: 'b', nomNormalise: 'spritz', archive: false }];
    expect(trouverDoublon(els, 'MOJITO')?.id).toBe('a');
    expect(trouverDoublon(els, 'Spritz', 'b')).toBeNull();
    expect(trouverDoublon(els, 'Nojito')).toBeNull();
  });
  it('formule le message de doublon, avec la variante archivé', () => {
    expect(messageDoublon('Un type', { nom: 'Anniversaire', archive: false })).toBe('Un type “Anniversaire” existe déjà');
    expect(messageDoublon('Un cocktail', { nom: 'Mojito', archive: true })).toBe(
      'Un cocktail “Mojito” existe déjà dans les archivés. Désarchive-le plutôt.',
    );
  });
  it('cherche un doublon de cocktail sur le couple (nom, alcool)', () => {
    expect(trouverDoublonCocktail([mojito], 'MOJITO', true)?.id).toBe('m');
    expect(trouverDoublonCocktail([mojito], 'Mojito', false)).toBeNull();
    expect(trouverDoublonCocktail([mojito, nojito], 'Mojito', false, 'm')?.id).toBe('n');
    expect(trouverDoublonCocktail([mojito, nojito], 'Mojito', true, 'm')).toBeNull();
  });
  it('précise la version dans le message de doublon', () => {
    expect(messageDoublonCocktail(nojito)).toBe('Un cocktail “Mojito” sans alcool existe déjà');
    expect(messageDoublonCocktail({ ...mojito, archive: true })).toBe(
      'Un cocktail “Mojito” avec alcool existe déjà dans les archivés. Désarchive-le plutôt.');
  });
});
