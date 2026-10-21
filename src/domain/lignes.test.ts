import { describe, it, expect } from 'vitest';
import type { Cocktail, Ligne } from './types';
import {
  varianteDe, groupes, basculerCocktail, deplacerDansGroupe,
  masquer, reafficher, retirer, typeRetrait, optionsAbsentes,
} from './lignes';

const mojito: Cocktail = { id: 'm', nom: 'Mojito', nomNormalise: 'mojito', alcool: true, archive: false };
const nojito: Cocktail = { ...mojito, id: 'n', nom: 'Nojito', nomNormalise: 'nojito', alcool: false };
const mule: Cocktail = { id: 'u', nom: 'Moscow Mule', nomNormalise: 'moscow mule', alcool: true, archive: false };
const spritz: Cocktail = { id: 's', nom: 'Spritz', nomNormalise: 'spritz', alcool: true, archive: true };

const seq = () => { let n = 0; return () => 'id' + n++; };
const l = (id: string, cocktailId: string, masquee = false): Ligne => ({ id, cocktailId, masquee });
const ids = (t: Ligne[]) => t.map(x => x.id);

describe('lignes', () => {
  it('déduit la variante du booléen alcool', () => {
    expect(varianteDe(mojito)).toBe('avec');
    expect(varianteDe(nojito)).toBe('sans');
  });

  it('coche et décoche un cocktail avec une seule ligne', () => {
    const t = basculerCocktail([], nojito, seq());
    expect(t).toEqual([{ id: 'id0', cocktailId: 'n', masquee: false }]);
    expect(basculerCocktail(t, nojito, seq())).toEqual([]);
  });

  it('range les lignes selon cocktail.alcool et ignore les cocktails introuvables', () => {
    const g = groupes([l('A', 'm'), l('S', 'n'), l('X', 'inconnu'), l('H', 'm', true)], [mojito, nojito]);
    expect(ids(g.avec)).toEqual(['A']);
    expect(ids(g.sans)).toEqual(['S']);
  });

  it('change le groupe d’une ligne quand le booléen du cocktail change', () => {
    expect(ids(groupes([l('A', 'm')], [{ ...mojito, alcool: false }]).sans)).toEqual(['A']);
  });

  it('liste seulement les masquées avec { masquees: true }', () => {
    const t = [l('A1', 'm'), l('S1', 'n', true), l('A2', 'm', true)];
    const g = groupes(t, [mojito, nojito], { masquees: true });
    expect(ids(g.avec)).toEqual(['A2']);
    expect(ids(g.sans)).toEqual(['S1']);
  });

  it('déplace dans un groupe sans toucher l’autre ni les lignes orphelines', () => {
    const t = [l('A1', 'm'), l('S1', 'n'), l('X', 'inconnu'), l('A2', 'm'), l('A3', 'm')];
    expect(ids(deplacerDansGroupe(t, [mojito, nojito], 'avec', 2, 0))).toEqual(['A3', 'S1', 'X', 'A1', 'A2']);
  });

  it('déplace en ignorant les masquées', () => {
    const t = [l('A1', 'm'), l('H', 'm', true), l('A2', 'm'), l('A3', 'm')];
    expect(ids(deplacerDansGroupe(t, [mojito, nojito], 'avec', 2, 0))).toEqual(['A3', 'H', 'A1', 'A2']);
  });

  it('masque, réaffiche à la fin et retire', () => {
    const t = [l('A1', 'm'), l('A2', 'm')];
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

  it('propose les cocktails actifs absents, triés par nom', () => {
    expect(optionsAbsentes([spritz, nojito, mule, mojito], [l('L', 'u', true)])).toEqual([mojito, nojito]);
  });
});
