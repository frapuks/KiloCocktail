import { describe, expect, it } from 'vitest';
import { normaliserNom, trouverDoublon } from './noms';

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
});
