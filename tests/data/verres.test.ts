import { beforeEach, describe, expect, it } from 'vitest';
import { disableNetwork, doc, enableNetwork, setDoc, type Firestore } from 'firebase/firestore';
import { creerDepots } from '../../src/data/firestore';
import { colVerres } from '../../src/data/firestore/chemins';
import type { DepotVerres } from '../../src/data/depots';
import type { EtatSauvegarde } from '../../src/domain/sauvegarde';
import type { Verre } from '../../src/domain/types';
import { attendre, preparerEmulateur, prochaineValeur, viderFirestore } from './support';

let db: Firestore;
let uid: string;
let depot: DepotVerres;
const P = 'presta-1';

beforeEach(async () => {
  await viderFirestore();
  const prep = await preparerEmulateur();
  db = prep.db;
  uid = prep.uid;
  depot = creerDepots(db, uid).verres;
});

type Instantane = { verres: Verre[]; etat: EtatSauvegarde };
const ecouterTout = (cb: (v: Instantane) => void) => depot.ecouter(P, (verres, etat) => cb({ verres, etat }));

describe('dépôt des verres', () => {
  it('sert un verre', async () => {
    depot.servir(P, 'L1');
    await attendre(db);
    const { verres, etat } = await prochaineValeur(ecouterTout, (v) => !v.etat.ecrituresEnAttente);
    expect(verres).toHaveLength(1);
    expect(verres[0]).toMatchObject({ ligneId: 'L1', enAttente: false });
    expect(etat).toEqual({ ecrituresEnAttente: false, verresEnAttente: 0 });
  });

  it('un même verre écrit deux fois ne compte qu’une fois', async () => {
    const ref = doc(colVerres(db, uid, P), 'verre-fixe');
    const donnees = { ligneId: 'L1', creeLe: 1, horodatage: null, appareil: 'x' };
    await setDoc(ref, donnees);
    await setDoc(ref, donnees);
    await attendre(db);
    const { verres } = await prochaineValeur(ecouterTout);
    expect(verres).toHaveLength(1);
  });

  it('retire le verre demandé', async () => {
    for (let i = 0; i < 3; i++) depot.servir(P, 'L1');
    await attendre(db);
    const avant = await prochaineValeur(ecouterTout, (v) => v.verres.length === 3);
    const dernier = [...avant.verres].sort((a, b) => a.creeLe - b.creeLe).at(-1)!;
    depot.retirer(P, dernier.id);
    await attendre(db);
    const { verres } = await prochaineValeur(ecouterTout, (v) => v.verres.length === 2);
    expect(verres.map((v) => v.id)).not.toContain(dernier.id);
  });

  it('signale les verres en attente', async () => {
    depot.servir(P, 'L1');
    const { verres, etat } = await prochaineValeur(ecouterTout);
    expect(verres).toHaveLength(1);
    expect(verres[0].enAttente).toBe(true);
    expect(etat).toEqual({ ecrituresEnAttente: true, verresEnAttente: 1 });
    await attendre(db);
  });

  it('signale une suppression hors connexion', async () => {
    depot.servir(P, 'L1');
    await attendre(db);
    const avant = await prochaineValeur(ecouterTout, (v) => v.verres.length === 1 && !v.etat.ecrituresEnAttente);
    await disableNetwork(db);
    const suite = prochaineValeur(ecouterTout, (v) => v.verres.length === 0);
    depot.retirer(P, avant.verres[0].id);
    expect((await suite).etat).toEqual({ ecrituresEnAttente: true, verresEnAttente: 0 });
    const fin = prochaineValeur(ecouterTout, (v) => !v.etat.ecrituresEnAttente);
    await enableNetwork(db);
    await attendre(db);
    const { verres, etat } = await fin;
    expect(verres).toHaveLength(0);
    expect(etat.ecrituresEnAttente).toBe(false);
  });
});
