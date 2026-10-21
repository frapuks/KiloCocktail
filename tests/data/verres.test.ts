import { beforeEach, describe, expect, it } from 'vitest';
import { disableNetwork, doc, enableNetwork, setDoc, type Firestore } from 'firebase/firestore';
import { creerDepots } from '../../src/data/firestore';
import { colVerres } from '../../src/data/firestore/chemins';
import type { DepotVerres } from '../../src/data/depots';
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

const ecouterTout = (cb: (v: Verre[]) => void) => depot.ecouter(P, cb);

describe('dépôt des verres', () => {
  it('sert un verre et renvoie son id', async () => {
    const idVerre = depot.servir(P, 'L1');
    await attendre(db);
    const verres = await prochaineValeur(ecouterTout, (v) => v.length === 1);
    expect(verres[0]).toEqual({ id: idVerre, ligneId: 'L1', creeLe: expect.any(Number) });
  });

  it('un même verre écrit deux fois ne compte qu’une fois', async () => {
    const ref = doc(colVerres(db, uid, P), 'verre-fixe');
    const donnees = { ligneId: 'L1', creeLe: 1, horodatage: null, appareil: 'x' };
    await setDoc(ref, donnees);
    await setDoc(ref, donnees);
    await attendre(db);
    expect(await prochaineValeur(ecouterTout)).toHaveLength(1);
  });

  it('retire le verre demandé', async () => {
    for (let i = 0; i < 3; i++) depot.servir(P, 'L1');
    await attendre(db);
    const avant = await prochaineValeur(ecouterTout, (v) => v.length === 3);
    const dernier = [...avant].sort((a, b) => a.creeLe - b.creeLe).at(-1)!;
    depot.retirer(P, dernier.id);
    await attendre(db);
    const verres = await prochaineValeur(ecouterTout, (v) => v.length === 2);
    expect(verres.map((v) => v.id)).not.toContain(dernier.id);
  });

  it('montre tout de suite un verre servi ou retiré hors connexion, puis le synchronise', async () => {
    depot.servir(P, 'L1');
    await attendre(db);
    const avant = await prochaineValeur(ecouterTout, (v) => v.length === 1);
    await disableNetwork(db);
    const apresRetrait = prochaineValeur(ecouterTout, (v) => v.length === 0);
    depot.retirer(P, avant[0].id);
    expect(await apresRetrait).toHaveLength(0);
    const apresService = prochaineValeur(ecouterTout, (v) => v.length === 1);
    depot.servir(P, 'L2');
    expect((await apresService)[0].ligneId).toBe('L2');
    await enableNetwork(db);
    await attendre(db);
    expect((await prochaineValeur(ecouterTout)).map((v) => v.ligneId)).toEqual(['L2']);
  });
});
