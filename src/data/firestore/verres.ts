import { deleteDoc, doc, onSnapshot, serverTimestamp, setDoc, type Firestore } from 'firebase/firestore';
import type { EtatSauvegarde } from '../../domain/sauvegarde';
import type { Verre } from '../../domain/types';
import { identifiantAppareil } from '../appareil';
import type { DepotVerres } from '../depots';
import { suivreEcriture } from '../erreurs';
import { colVerres } from './chemins';

export function depotVerres(db: Firestore, uid: string): DepotVerres {
  // Firestore ne signale jamais une suppression en attente dans les métadonnées d'un instantané
  // (le document disparaît simplement). On suit donc nous-mêmes les suppressions en cours, par presta.
  // Limite connue : les suppressions mises en file par une exécution précédente de l'appli ne sont pas reflétées.
  const enCours = new Map<string, Set<string>>();
  const reemetteurs = new Map<string, Set<() => void>>();

  function nombreEnCours(prestaId: string): number {
    return enCours.get(prestaId)?.size ?? 0;
  }

  return {
    ecouter(prestaId, cb) {
      let dernier: { verres: Verre[]; enAttente: boolean } | null = null;
      const emettre = () => {
        if (!dernier) return;
        const etat: EtatSauvegarde = {
          ecrituresEnAttente: dernier.enAttente || nombreEnCours(prestaId) > 0,
          verresEnAttente: dernier.verres.filter((v) => v.enAttente).length,
        };
        cb(dernier.verres, etat);
      };
      let ensemble = reemetteurs.get(prestaId);
      if (!ensemble) reemetteurs.set(prestaId, (ensemble = new Set()));
      ensemble.add(emettre);
      const arreter = onSnapshot(colVerres(db, uid, prestaId), { includeMetadataChanges: true }, (snap) => {
        dernier = {
          verres: snap.docs.map((d) => ({
            id: d.id,
            ligneId: d.get('ligneId') as string,
            creeLe: d.get('creeLe') as number,
            enAttente: d.metadata.hasPendingWrites,
          })),
          enAttente: snap.metadata.hasPendingWrites,
        };
        emettre();
      });
      return () => {
        arreter();
        ensemble.delete(emettre);
      };
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
      let ids = enCours.get(prestaId);
      if (!ids) enCours.set(prestaId, (ids = new Set()));
      // Ajout sans réémission : l'instantané local déclenché par la suppression suivra aussitôt.
      ids.add(verreId);
      const fin = () => {
        ids.delete(verreId);
        reemetteurs.get(prestaId)?.forEach((r) => r());
      };
      const p = deleteDoc(doc(colVerres(db, uid, prestaId), verreId));
      p.then(fin, fin);
      suivreEcriture(p);
    },
  };
}
