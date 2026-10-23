import {
  doc,
  getDocsFromServer,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type CollectionReference,
  type Firestore,
} from 'firebase/firestore';
import { normaliserNom } from '../../domain/noms';
import type { DepotListe } from '../depots';
import { suivreEcriture } from '../erreurs';
import { decouper, TAILLE_LOT } from './lots';

// Dépôt d'une liste de noms gérée dans Réglages (types d'événement, bases). Supprimer un élément le retire
// des documents de `referents` dont le champ `champ` le désigne (mis à null).
export function depotListe<T>(
  db: Firestore,
  col: CollectionReference,
  referents: { col: CollectionReference; champ: string },
): DepotListe<T> {
  return {
    ecouter(cb) {
      return onSnapshot(col, (snap) => {
        cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T));
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
    // Retire l'élément des référents par lots de 500 opérations (limite Firestore) ; l'élément lui-même part
    // avec le dernier lot (le seul, dans le cas courant).
    // Référents lus sur le serveur (le cache local peut être incomplet) : hors connexion, la suppression est refusée.
    async supprimer(id) {
      const touches = await getDocsFromServer(query(referents.col, where(referents.champ, '==', id)));
      const lots = decouper(touches.docs, TAILLE_LOT - 1);
      if (lots.length === 0) lots.push([]);
      lots.forEach((refs, i) => {
        const lot = writeBatch(db);
        refs.forEach((r) => lot.update(r.ref, { [referents.champ]: null }));
        if (i === lots.length - 1) lot.delete(doc(col, id));
        suivreEcriture(lot.commit());
      });
    },
  };
}
