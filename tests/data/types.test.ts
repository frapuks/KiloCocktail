import { beforeEach, describe, expect, it } from 'vitest';
import type { Firestore } from 'firebase/firestore';
import { creerDepots } from '../../src/data/firestore';
import type { DepotTypes } from '../../src/data/depots';
import { attendre, preparerEmulateur, prochaineValeur, viderFirestore } from './support';

let db: Firestore;
let uid: string;
let depot: DepotTypes;

beforeEach(async () => {
  await viderFirestore();
  const prep = await preparerEmulateur();
  db = prep.db;
  uid = prep.uid;
  depot = creerDepots(db, uid).types;
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

  it('ne recrée pas les types de départ une fois que l’utilisateur les a supprimés', async () => {
    await depot.initialiserSiVide();
    await attendre(db);
    await depot.supprimer('anniversaire');
    await depot.supprimer('soiree-entreprise');
    await attendre(db);
    await depot.initialiserSiVide();
    await attendre(db);
    expect(await prochaineValeur(depot.ecouter)).toEqual([]);
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

  it('supprime un type et le retire des prestas qui l’avaient, sans toucher aux autres', async () => {
    const depots = creerDepots(db, uid);
    const supprime = depot.creer('Mariage');
    const garde = depot.creer('Anniversaire');
    const p1 = depots.prestas.creer({ date: '2026-10-17', client: 'A', typeId: supprime, lignes: [] });
    const p2 = depots.prestas.creer({ date: '2026-10-18', client: 'B', typeId: garde, lignes: [] });
    await attendre(db);

    await depot.supprimer(supprime);
    await attendre(db);

    expect((await prochaineValeur(depot.ecouter)).map((t) => t.id)).toEqual([garde]);
    const prestas = await prochaineValeur(depots.prestas.ecouterListe);
    const typeDe = (id: string) => prestas.find((p) => p.id === id)?.typeId;
    expect(typeDe(p1)).toBeNull();
    expect(typeDe(p2)).toBe(garde);
  });
});
