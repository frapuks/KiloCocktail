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

  it('chiffre puis supprime un cocktail : verres effacés, retiré des cartes, autres cocktails intacts', async () => {
    const depots = creerDepots(db, uid);
    const supprime = depot.creer({ nom: 'Blue Lagoon', alcool: true });
    const garde = depot.creer({ nom: 'Mojito', alcool: true });
    const ligne = (id: string, cocktailId: string) => ({ id, cocktailId, masquee: false });
    const p1 = depots.prestas.creer({ date: '2026-10-17', client: 'A', typeId: null, lignes: [ligne('L1', supprime), ligne('L2', garde)] });
    const p2 = depots.prestas.creer({ date: '2026-10-18', client: 'B', typeId: null, lignes: [ligne('L3', supprime)] });
    const p3 = depots.prestas.creer({ date: '2026-10-19', client: 'C', typeId: null, lignes: [ligne('L4', garde)] });
    depots.verres.servir(p1, 'L1');
    depots.verres.servir(p1, 'L1');
    depots.verres.servir(p1, 'L2');
    depots.verres.servir(p2, 'L3');
    depots.verres.servir(p3, 'L4');
    await attendre(db);

    expect(await depot.impactSuppression(supprime)).toEqual({ prestas: 2, verres: 3 });

    await depot.supprimer(supprime);
    await attendre(db);

    expect((await prochaineValeur(depot.ecouter)).map((c) => c.id)).toEqual([garde]);
    const prestas = await prochaineValeur(depots.prestas.ecouterListe);
    const lignesDe = (id: string) => prestas.find((p) => p.id === id)?.lignes.map((l) => l.id);
    expect(lignesDe(p1)).toEqual(['L2']);
    expect(lignesDe(p2)).toEqual([]);
    expect(lignesDe(p3)).toEqual(['L4']);
    const verresDe = async (prestaId: string) =>
      (await prochaineValeur<Parameters<Parameters<typeof depots.verres.ecouter>[1]>[0]>((cb) => depots.verres.ecouter(prestaId, (v) => cb(v)))).map((v) => v.ligneId);
    expect(await verresDe(p1)).toEqual(['L2']);
    expect(await verresDe(p2)).toEqual([]);
    expect(await verresDe(p3)).toEqual(['L4']);
    expect(await depot.impactSuppression(garde)).toEqual({ prestas: 2, verres: 2 });
  });
});
