import { beforeEach, describe, expect, it } from 'vitest';
import type { Firestore } from 'firebase/firestore';
import { creerDepots } from '../../src/data/firestore';
import type { DepotPrestas, DepotVerres, DonneesPresta } from '../../src/data/depots';
import type { Ligne } from '../../src/domain/types';
import { attendre, preparerEmulateur, prochaineValeur, viderFirestore } from './support';

let db: Firestore;
let prestas: DepotPrestas;
let verres: DepotVerres;

beforeEach(async () => {
  await viderFirestore();
  const prep = await preparerEmulateur();
  db = prep.db;
  const depots = creerDepots(db, prep.uid);
  prestas = depots.prestas;
  verres = depots.verres;
});

const L1: Ligne = { id: 'L1', cocktailId: 'c1', variante: 'avec', masquee: false };
const L2: Ligne = { id: 'L2', cocktailId: 'c2', variante: 'sans', masquee: false };
const L3: Ligne = { id: 'L3', cocktailId: 'c3', variante: 'avec', masquee: true };
const donnees: DonneesPresta = { date: '2026-10-17', client: 'Dupont', typeId: 'anniversaire', lignes: [L2, L1, L3] };


describe('dépôt des prestas', () => {
  it('crée une presta en cours', async () => {
    const id = prestas.creer(donnees);
    await attendre(db);
    const p = await prochaineValeur((cb) => prestas.ecouter(id, cb));
    expect(p).toEqual({ id, ...donnees, statut: 'en-cours' });
    expect(p!.lignes.map((l) => l.id)).toEqual(['L2', 'L1', 'L3']);
    const liste = await prochaineValeur((cb) => prestas.ecouterListe(cb));
    expect(liste.map((x) => x.id)).toEqual([id]);
  });

  it('renvoie null pour une presta inexistante', async () => {
    expect(await prochaineValeur((cb) => prestas.ecouter('absente', cb))).toBeNull();
  });

  it('modifie une presta et purge les verres des lignes supprimées', async () => {
    const id = prestas.creer(donnees);
    verres.servir(id, 'L1');
    verres.servir(id, 'L1');
    verres.servir(id, 'L2');
    await attendre(db);
    await prestas.modifier(id, { ...donnees, client: 'Martin', lignes: [L2] }, ['L1']);
    await attendre(db);
    const p = await prochaineValeur((cb) => prestas.ecouter(id, cb));
    expect(p!.client).toBe('Martin');
    expect(p!.lignes.map((l) => l.id)).toEqual(['L2']);
    const restants = await prochaineValeur<{ ligneId: string }[]>(
      (cb) => verres.ecouter(id, (v) => cb(v)),
      (v) => v.length === 1,
    );
    expect(restants.map((v) => v.ligneId)).toEqual(['L2']);
  });

  it('change le statut', async () => {
    const id = prestas.creer(donnees);
    prestas.changerStatut(id, 'terminee');
    await attendre(db);
    expect((await prochaineValeur((cb) => prestas.ecouter(id, cb)))!.statut).toBe('terminee');
  });

  it('supprime une presta et ses verres', async () => {
    const id = prestas.creer(donnees);
    verres.servir(id, 'L1');
    verres.servir(id, 'L2');
    await attendre(db);
    await prestas.supprimer(id);
    await attendre(db);
    expect(await prochaineValeur((cb) => prestas.ecouter(id, cb))).toBeNull();
    expect(await prochaineValeur<unknown[]>((cb) => verres.ecouter(id, (v) => cb(v)))).toHaveLength(0);
    expect(await prestas.compterServis(id)).toBe(0);
  });

  it('compte les verres servis côté serveur', async () => {
    const id = prestas.creer(donnees);
    for (let i = 0; i < 3; i++) verres.servir(id, 'L1');
    await attendre(db);
    expect(await prestas.compterServis(id)).toBe(3);
  });
});
