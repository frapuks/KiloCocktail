import { beforeEach, describe, expect, it } from 'vitest';
import type { Firestore } from 'firebase/firestore';
import { creerDepots } from '../../src/data/firestore';
import type { DepotCocktails } from '../../src/data/depots';
import { attendre, preparerEmulateur, prochaineValeur, viderFirestore } from './support';

let db: Firestore;
let depot: DepotCocktails;

beforeEach(async () => {
  await viderFirestore();
  const prep = await preparerEmulateur();
  db = prep.db;
  depot = creerDepots(db, prep.uid).cocktails;
});

describe('dépôt des cocktails', () => {
  it('crée un cocktail avec son nom normalisé', async () => {
    const id = depot.creer({ nom: 'Caïpirinha', variantes: 'avec', nomSansAlcool: null });
    await attendre(db);
    const liste = await prochaineValeur(depot.ecouter);
    expect(liste).toEqual([
      { id, nom: 'Caïpirinha', nomNormalise: 'caipirinha', variantes: 'avec', nomSansAlcool: null, archive: false },
    ]);
  });

  it('modifie et recalcule le nom normalisé', async () => {
    const id = depot.creer({ nom: 'Mojito', variantes: 'avec', nomSansAlcool: null });
    depot.modifier(id, { nom: 'Môjito Royal', variantes: 'les-deux', nomSansAlcool: 'Nojito' });
    await attendre(db);
    const liste = await prochaineValeur(depot.ecouter);
    expect(liste).toEqual([
      { id, nom: 'Môjito Royal', nomNormalise: 'mojito royal', variantes: 'les-deux', nomSansAlcool: 'Nojito', archive: false },
    ]);
  });

  it('archive puis désarchive', async () => {
    const id = depot.creer({ nom: 'Mojito', variantes: 'avec', nomSansAlcool: null });
    depot.archiver(id, true);
    await attendre(db);
    expect((await prochaineValeur(depot.ecouter))[0].archive).toBe(true);
    depot.archiver(id, false);
    await attendre(db);
    expect((await prochaineValeur(depot.ecouter))[0].archive).toBe(false);
  });
});
