import { deleteDoc, doc, onSnapshot, serverTimestamp, setDoc, type Firestore } from 'firebase/firestore';
import { identifiantAppareil } from '../appareil';
import type { DepotVerres } from '../depots';
import { suivreEcriture } from '../erreurs';
import { colVerres } from './chemins';

export function depotVerres(db: Firestore, uid: string): DepotVerres {
  return {
    // Sans includeMetadataChanges : un seul instantané par tap (pas un second à l'accusé du serveur),
    // donc un seul rendu des cartes de comptage.
    ecouter(prestaId, cb) {
      return onSnapshot(colVerres(db, uid, prestaId), (snap) => {
        cb(
          snap.docs.map((d) => ({
            id: d.id,
            ligneId: d.get('ligneId') as string,
            creeLe: d.get('creeLe') as number,
          })),
        );
      });
    },
    servir(prestaId, ligneId) {
      const ref = doc(colVerres(db, uid, prestaId), crypto.randomUUID());
      suivreEcriture(
        setDoc(ref, {
          ligneId,
          creeLe: Date.now(),
          horodatage: serverTimestamp(),
          appareil: identifiantAppareil(),
        }),
      );
      return ref.id;
    },
    retirer(prestaId, verreId) {
      suivreEcriture(deleteDoc(doc(colVerres(db, uid, prestaId), verreId)));
    },
  };
}
