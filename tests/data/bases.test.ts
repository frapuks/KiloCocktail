import { beforeEach, describe, expect, it } from 'vitest';
import type { Firestore } from 'firebase/firestore';
import { creerDepots } from '../../src/data/firestore';
import type { DepotBases } from '../../src/data/depots';
import { attendre, preparerEmulateur, prochaineValeur, viderFirestore } from './support';

let db: Firestore;
let uid: string;
let depot: DepotBases;

beforeEach(async () => {
  await viderFirestore();
  const prep = await preparerEmulateur();
  db = prep.db;
  uid = prep.uid;
  depot = creerDepots(db, uid).bases;
});

describe('dépôt des bases', () => {
  it('crée, renomme et archive une base', async () => {
    const id = depot.creer('Rhum');
    await attendre(db);
    expect(await prochaineValeur(depot.ecouter)).toEqual([
      { id, nom: 'Rhum', nomNormalise: 'rhum', archive: false },
    ]);
    depot.renommer(id, 'Rhum blanc');
    depot.archiver(id, true);
    await attendre(db);
    expect(await prochaineValeur(depot.ecouter)).toEqual([
      { id, nom: 'Rhum blanc', nomNormalise: 'rhum blanc', archive: true },
    ]);
  });

  it('supprime une base et la retire des cocktails qui l’avaient, sans toucher aux autres', async () => {
    const depots = creerDepots(db, uid);
    const supprimee = depot.creer('Rhum');
    const gardee = depot.creer('Vodka');
    const mojito = depots.cocktails.creer({ nom: 'Mojito', alcool: true, description: '', baseId: supprimee });
    const mule = depots.cocktails.creer({ nom: 'Moscow Mule', alcool: true, description: '', baseId: gardee });
    await attendre(db);

    await depot.supprimer(supprimee);
    await attendre(db);

    expect((await prochaineValeur(depot.ecouter)).map((b) => b.id)).toEqual([gardee]);
    const cocktails = await prochaineValeur(depots.cocktails.ecouter);
    const baseDe = (id: string) => cocktails.find((c) => c.id === id)?.baseId;
    expect(baseDe(mojito)).toBeUndefined();
    expect(baseDe(mule)).toBe(gardee);
  });
});
