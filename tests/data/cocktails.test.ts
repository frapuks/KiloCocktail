import { beforeEach, describe, expect, it } from 'vitest';
import { doc, setDoc, type Firestore } from 'firebase/firestore';
import { creerDepots } from '../../src/data/firestore';
import type { DepotCocktails } from '../../src/data/depots';
import { colCocktails } from '../../src/data/firestore/chemins';
import { attendre, preparerEmulateur, prochaineValeur, viderFirestore } from './support';

let db: Firestore;
let depot: DepotCocktails;
let uid: string;

beforeEach(async () => {
  await viderFirestore();
  const prep = await preparerEmulateur();
  db = prep.db;
  uid = prep.uid;
  depot = creerDepots(db, prep.uid).cocktails;
});

describe('dépôt des cocktails', () => {
  it('crée un cocktail avec son nom normalisé', async () => {
    const id = depot.creer({ nom: 'Caïpirinha', alcool: true });
    await attendre(db);
    const liste = await prochaineValeur(depot.ecouter);
    expect(liste).toEqual([
      { id, nom: 'Caïpirinha', nomNormalise: 'caipirinha', alcool: true, archive: false },
    ]);
  });

  it('modifie et recalcule le nom normalisé', async () => {
    const id = depot.creer({ nom: 'Mojito', alcool: true });
    depot.modifier(id, { nom: 'Môjito Royal', alcool: false });
    await attendre(db);
    const liste = await prochaineValeur(depot.ecouter);
    expect(liste).toEqual([
      { id, nom: 'Môjito Royal', nomNormalise: 'mojito royal', alcool: false, archive: false },
    ]);
  });

  it('archive puis désarchive', async () => {
    const id = depot.creer({ nom: 'Mojito', alcool: true });
    depot.archiver(id, true);
    await attendre(db);
    expect((await prochaineValeur(depot.ecouter))[0].archive).toBe(true);
    depot.archiver(id, false);
    await attendre(db);
    expect((await prochaineValeur(depot.ecouter))[0].archive).toBe(false);
  });

  it('lit un cocktail sans champ alcool comme avec alcool', async () => {
    await setDoc(doc(colCocktails(db, uid)), { nom: 'Spritz', nomNormalise: 'spritz', archive: false });
    await attendre(db);
    expect((await prochaineValeur(depot.ecouter))[0].alcool).toBe(true);
  });

  it('ne garde pas en mémoire les champs hérités de l’ancien modèle', async () => {
    await setDoc(doc(colCocktails(db, uid)), {
      nom: 'Spritz',
      nomNormalise: 'spritz',
      archive: false,
      variantes: 'les-deux',
      nomSansAlcool: 'Spritz zéro',
    });
    await attendre(db);
    const [c] = await prochaineValeur(depot.ecouter);
    expect(Object.keys(c).sort()).toEqual(['alcool', 'archive', 'id', 'nom', 'nomNormalise']);
  });
});
