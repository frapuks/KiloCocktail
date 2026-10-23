import {
  doc,
  getDocsFromServer,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import { normaliserNom } from '../../domain/noms';
import type { Base } from '../../domain/types';
import type { DepotBases } from '../depots';
import { suivreEcriture } from '../erreurs';
import { colBases, colCocktails } from './chemins';
import { decouper, TAILLE_LOT } from './lots';

export function depotBases(db: Firestore, uid: string): DepotBases {
  const col = colBases(db, uid);
  return {
    ecouter(cb) {
      return onSnapshot(col, (snap) => {
        cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Base));
      });
    },
    creer(nom) {
      const ref = doc(col);
      suivreEcriture(setDoc(ref, { nom, nomNormalise: normaliserNom(nom), archive: false }));
      return ref.id;
    },
    renommer(id, nom) {
      suivreEcriture(updateDoc(doc(col, id), { nom, nomNormalise: normaliserNom(nom) }));
    },
    archiver(id, archive) {
      suivreEcriture(updateDoc(doc(col, id), { archive }));
    },
    // Comme pour les types : retire la base des cocktails qui l'avaient, par lots de 500 opérations, la base
    // partant avec le dernier lot. Cocktails lus sur le serveur : hors connexion, la suppression est refusée.
    async supprimer(id) {
      const cocktails = await getDocsFromServer(query(colCocktails(db, uid), where('baseId', '==', id)));
      const lots = decouper(cocktails.docs, TAILLE_LOT - 1);
      if (lots.length === 0) lots.push([]);
      lots.forEach((refs, i) => {
        const lot = writeBatch(db);
        refs.forEach((c) => lot.update(c.ref, { baseId: null }));
        if (i === lots.length - 1) lot.delete(doc(col, id));
        suivreEcriture(lot.commit());
      });
    },
  };
}
