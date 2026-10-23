import { describe, expect, it } from 'vitest';
import { messageDoublon, normaliserNom, trouverDoublon } from './noms';

describe('noms', () => {
  it('normalise espaces, casse, accents et apostrophes', () => {
    expect(normaliserNom('  Caïpirinha   Royale ')).toBe('caipirinha royale');
    expect(normaliserNom('Soirée d’entreprise')).toBe("soiree d'entreprise");
    expect(normaliserNom("Soirée d'entreprise")).toBe("soiree d'entreprise");
  });
  it('trouve un doublon actif ou archivé, sauf l’élément lui-même', () => {
    const els = [{ id: 'a', nom: 'Mojito', archive: true }, { id: 'b', nom: 'Spritz', archive: false }];
    expect(trouverDoublon(els, 'MOJITO')?.id).toBe('a');
    expect(trouverDoublon(els, 'Spritz', 'b')).toBeNull();
    expect(trouverDoublon(els, 'Nojito')).toBeNull();
  });
  it('voit un doublon qui ne diffère que par l’apostrophe (clavier de l’iPad)', () => {
    const els = [{ id: 't', nom: "Soirée d'entreprise", archive: false }];
    expect(trouverDoublon(els, 'soirée d’entreprise')?.id).toBe('t');
  });
  it('formule le message de doublon, avec la variante archivé', () => {
    expect(messageDoublon('Un type', { nom: 'Anniversaire', archive: false })).toBe('Un type “Anniversaire” existe déjà');
    expect(messageDoublon('Un cocktail sans alcool', { nom: 'Mojito', archive: true })).toBe(
      'Un cocktail sans alcool “Mojito” existe déjà dans les archivés. Désarchive-le plutôt.',
    );
  });
});
