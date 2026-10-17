import { deleteDoc, doc, onSnapshot, serverTimestamp, setDoc, type Firestore } from 'firebase/firestore';
import type { Verre } from '../../domain/types';
import { identifiantAppareil } from '../appareil';
import type { DepotVerres } from '../depots';
import { suivreEcriture } from '../erreurs';
import { colVerres } from './chemins';

export function depotVerres(db: Firestore, uid: string): DepotVerres {
  return {
    ecouter(prestaId, cb) {
      return onSnapshot(colVerres(db, uid, prestaId), { includeMetadataChanges: true }, (snap) => {
        const verres: Verre[] = snap.docs.map((d) => ({
          id: d.id,
          ligneId: d.get('ligneId') as string,
          creeLe: d.get('creeLe') as number,
          enAttente: d.metadata.hasPendingWrites,
        }));
        cb(verres, {
          ecrituresEnAttente: snap.metadata.hasPendingWrites,
          verresEnAttente: verres.filter((v) => v.enAttente).length,
        });
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
    },
    retirer(prestaId, verreId) {
      suivreEcriture(deleteDoc(doc(colVerres(db, uid, prestaId), verreId)));
    },
  };
}
