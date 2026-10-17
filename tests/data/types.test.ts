import { beforeEach, describe, expect, it } from 'vitest';
import type { Firestore } from 'firebase/firestore';
import { creerDepots } from '../../src/data/firestore';
import type { DepotTypes } from '../../src/data/depots';
import { attendre, preparerEmulateur, prochaineValeur, viderFirestore } from './support';

let db: Firestore;
let depot: DepotTypes;

beforeEach(async () => {
  await viderFirestore();
  const prep = await preparerEmulateur();
  db = prep.db;
  depot = creerDepots(db, prep.uid).types;
});

describe('dépôt des types d’événement', () => {
  it('initialise les deux types de départ si la collection est vide', async () => {
    await depot.initialiserSiVide();
    await attendre(db);
    const liste = await prochaineValeur(depot.ecouter);
    const parId = Object.fromEntries(liste.map((t) => [t.id, t.nom]));
    expect(parId).toEqual({ anniversaire: 'Anniversaire', 'soiree-entreprise': 'Soirée d\'entreprise' });
  });

  it('n’écrase pas un type renommé', async () => {
    await depot.initialiserSiVide();
    await attendre(db);
    depot.renommer('anniversaire', 'Anniv');
    await attendre(db);
    await depot.initialiserSiVide();
    await attendre(db);
    const liste = await prochaineValeur(depot.ecouter);
    expect(liste.find((t) => t.id === 'anniversaire')?.nom).toBe('Anniv');
  });

  it('crée, renomme et archive un type', async () => {
    const id = depot.creer('Mariage');
    await attendre(db);
    expect(await prochaineValeur(depot.ecouter)).toEqual([
      { id, nom: 'Mariage', nomNormalise: 'mariage', archive: false },
    ]);
    depot.renommer(id, 'Noces');
    depot.archiver(id, true);
    await attendre(db);
    expect(await prochaineValeur(depot.ecouter)).toEqual([
      { id, nom: 'Noces', nomNormalise: 'noces', archive: true },
    ]);
  });
});
