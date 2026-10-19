import {
  doc,
  getCountFromServer,
  getDocsFromCache,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentReference,
  type Firestore,
} from 'firebase/firestore';
import type { Presta } from '../../domain/types';
import type { DepotPrestas, DonneesPresta } from '../depots';
import { suivreEcriture } from '../erreurs';
import { colPrestas, colVerres } from './chemins';

const TAILLE_LOT = 500;
const TAILLE_IN = 30;

function decouper<T>(liste: T[], taille: number): T[][] {
  const lots: T[][] = [];
  for (let i = 0; i < liste.length; i += taille) lots.push(liste.slice(i, i + taille));
  return lots;
}

function champs(d: DonneesPresta) {
  return { date: d.date, client: d.client, typeId: d.typeId, lignes: d.lignes };
}

// Derniers totaux servis connus, gardés sur l'appareil : la liste les affiche tout de suite
// pendant que le serveur recompte, et les garde si le serveur est injoignable.
function lireTotaux(cle: string): Map<string, number> {
  try {
    return new Map(Object.entries(JSON.parse(localStorage.getItem(cle) ?? '{}') as Record<string, number>));
  } catch {
    return new Map();
  }
}

function ecrireTotaux(cle: string, totaux: Map<string, number>) {
  try {
    localStorage.setItem(cle, JSON.stringify(Object.fromEntries(totaux)));
  } catch {
    // Stockage plein ou bloqué : le cache reste en mémoire pour la session.
  }
}

export function depotPrestas(db: Firestore, uid: string): DepotPrestas {
  const col = colPrestas(db, uid);
  const cleTotaux = `kilococktail.totauxServis.${uid}`;
  const totaux = lireTotaux(cleTotaux);
  return {
    ecouterListe(cb) {
      return onSnapshot(col, (snap) => {
        cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Presta));
      });
    },
    ecouter(id, cb) {
      return onSnapshot(doc(col, id), (snap) => {
        cb(snap.exists() ? ({ id: snap.id, ...snap.data() } as Presta) : null);
      });
    },
    creer(d) {
      const ref = doc(col);
      suivreEcriture(setDoc(ref, { ...champs(d), statut: 'en-cours' }));
      return ref.id;
    },
    // Lecture des verres depuis le cache local : l'écran Modifier les écoute déjà, et le cache répond
    // tout de suite, même sur un réseau faible (getDocs attendrait le serveur).
    async modifier(id, d, lignesAPurger) {
      const aSupprimer: DocumentReference[] = [];
      for (const ids of decouper(lignesAPurger, TAILLE_IN)) {
        const snap = await getDocsFromCache(query(colVerres(db, uid, id), where('ligneId', 'in', ids)));
        snap.docs.forEach((v) => aSupprimer.push(v.ref));
      }
      // La mise à jour de la presta part dans le premier lot, avec les premières suppressions.
      // Le premier lot porte la mise à jour : 499 suppressions au plus, pour rester à 500 opérations.
      const lots = [aSupprimer.slice(0, TAILLE_LOT - 1), ...decouper(aSupprimer.slice(TAILLE_LOT - 1), TAILLE_LOT)];
      lots.forEach((refs, i) => {
        const lot = writeBatch(db);
        if (i === 0) lot.update(doc(col, id), champs(d));
        refs.forEach((r) => lot.delete(r));
        suivreEcriture(lot.commit());
      });
    },
    changerStatut(id, statut) {
      suivreEcriture(updateDoc(doc(col, id), { statut }));
    },
    async supprimer(id) {
      const snap = await getDocsFromCache(colVerres(db, uid, id));
      decouper(
        snap.docs.map((v) => v.ref),
        TAILLE_LOT,
      ).forEach((refs) => {
        const lot = writeBatch(db);
        refs.forEach((r) => lot.delete(r));
        suivreEcriture(lot.commit());
      });
      const lotPresta = writeBatch(db);
      lotPresta.delete(doc(col, id));
      suivreEcriture(lotPresta.commit());
      if (totaux.delete(id)) ecrireTotaux(cleTotaux, totaux);
    },
    dernierTotalServis(id) {
      return totaux.get(id) ?? null;
    },
    async compterServis(id) {
      try {
        const snap = await getCountFromServer(colVerres(db, uid, id));
        const total = snap.data().count;
        if (totaux.get(id) !== total) {
          totaux.set(id, total);
          ecrireTotaux(cleTotaux, totaux);
        }
        return total;
      } catch {
        return totaux.get(id) ?? null;
      }
    },
  };
}
