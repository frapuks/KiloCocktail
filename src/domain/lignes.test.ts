import { describe, it, expect } from 'vitest';
import type { Cocktail, Ligne } from './types';
import {
  variantesDisponibles, groupes, basculerCocktail, basculerVariante, deplacerDansGroupe,
  masquer, reafficher, retirer, typeRetrait, optionsAbsentes,
} from './lignes';

const mojito: Cocktail = { id: 'm', nom: 'Mojito', nomNormalise: 'mojito', variantes: 'les-deux', nomSansAlcool: 'Nojito', archive: false };
const mule: Cocktail = { id: 'u', nom: 'Moscow Mule', nomNormalise: 'moscow mule', variantes: 'avec', nomSansAlcool: null, archive: false };
const spritz: Cocktail = { id: 's', nom: 'Spritz', nomNormalise: 'spritz', variantes: 'avec', nomSansAlcool: null, archive: true };

const seq = () => { let n = 0; return () => 'id' + n++; };
const l = (id: string, variante: 'avec' | 'sans', masquee = false, cocktailId = 'x'): Ligne => ({ id, cocktailId, variante, masquee });
const ids = (t: Ligne[]) => t.map(x => x.id);

describe('lignes', () => {
  it('liste les variantes disponibles', () => {
    expect(variantesDisponibles(mojito)).toEqual(['avec', 'sans']);
    expect(variantesDisponibles(mule)).toEqual(['avec']);
  });

  it('ajoute toutes les variantes d’un cocktail coché, à la fin', () => {
    const r = basculerCocktail([l('a', 'avec')], mojito, seq());
    expect(r.slice(1)).toEqual([
      { id: 'id0', cocktailId: 'm', variante: 'avec', masquee: false },
      { id: 'id1', cocktailId: 'm', variante: 'sans', masquee: false },
    ]);
  });

  it('décoche un cocktail en retirant toutes ses lignes', () => {
    const t = basculerCocktail([], mojito, seq());
    expect(basculerCocktail(t, mojito, seq())).toEqual([]);
  });

  it('bascule une seule variante', () => {
    const t = basculerVariante([], 'm', 'sans', seq());
    expect(t).toEqual([{ id: 'id0', cocktailId: 'm', variante: 'sans', masquee: false }]);
    expect(basculerVariante(t, 'm', 'sans', seq())).toEqual([]);
  });

  it('range les lignes par groupe en ignorant les masquées', () => {
    const t = [l('A1', 'avec'), l('S1', 'sans'), l('A2', 'avec', true)];
    const g = groupes(t);
    expect(ids(g.avec)).toEqual(['A1']);
    expect(ids(g.sans)).toEqual(['S1']);
  });

  it('liste seulement les masquées avec { masquees: true }', () => {
    const t = [l('A1', 'avec'), l('S1', 'sans', true), l('A2', 'avec', true)];
    const g = groupes(t, { masquees: true });
    expect(ids(g.avec)).toEqual(['A2']);
    expect(ids(g.sans)).toEqual(['S1']);
  });

  it('déplace dans un groupe sans toucher l’autre', () => {
    const t = [l('A1', 'avec'), l('S1', 'sans'), l('A2', 'avec'), l('S2', 'sans'), l('A3', 'avec')];
    expect(ids(deplacerDansGroupe(t, 'avec', 2, 0))).toEqual(['A3', 'S1', 'A1', 'S2', 'A2']);
  });

  it('déplace en ignorant les masquées', () => {
    const t = [l('A1', 'avec'), l('H', 'avec', true), l('A2', 'avec'), l('A3', 'avec')];
    expect(ids(deplacerDansGroupe(t, 'avec', 2, 0))).toEqual(['A3', 'H', 'A1', 'A2']);
  });

  it('masque, réaffiche à la fin et retire', () => {
    const t = [l('A1', 'avec'), l('A2', 'avec')];
    const m = masquer(t, 'A1');
    expect(m[0].masquee).toBe(true);
    const r = reafficher(m, 'A1');
    expect(ids(r)).toEqual(['A2', 'A1']);
    expect(r[1].masquee).toBe(false);
    expect(ids(retirer(t, 'A1'))).toEqual(['A2']);
  });

  it('choisit le type de retrait', () => {
    expect(typeRetrait(0)).toBe('direct');
    expect(typeRetrait(3)).toBe('choix');
  });

  it('propose les variantes absentes des cocktails non archivés', () => {
    const t = [l('L1', 'avec', false, 'm')];
    const r = optionsAbsentes([spritz, mojito, mule], t);
    expect(r).toEqual([
      { cocktail: mojito, variantes: ['sans'] },
      { cocktail: mule, variantes: ['avec'] },
    ]);
    const masque = [l('L1', 'avec', true, 'm'), l('L2', 'sans', false, 'm'), l('L3', 'avec', false, 'u')];
    expect(optionsAbsentes([spritz, mojito, mule], masque)).toEqual([]);
  });
});
