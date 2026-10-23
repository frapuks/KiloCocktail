import { doc, getDocFromServer, getDocsFromServer, writeBatch, type Firestore } from 'firebase/firestore';
import { normaliserNom } from '../../domain/noms';
import type { TypeEvenement } from '../../domain/types';
import type { DepotTypes } from '../depots';
import { suivreEcriture } from '../erreurs';
import { colPrestas, colTypes } from './chemins';
import { depotListe } from './listes';

const TYPES_DE_DEPART = [
  { id: 'anniversaire', nom: 'Anniversaire' },
  { id: 'soiree-entreprise', nom: "Soirée d'entreprise" },
];

// Supprimer un type le retire des prestas qui l'utilisaient.
export function depotTypes(db: Firestore, uid: string): DepotTypes {
  const col = colTypes(db, uid);
  return {
    ...depotListe<TypeEvenement>(db, col, { col: colPrestas(db, uid), champ: 'typeId' }),
    // Types de départ créés une seule fois par compte (marqueur sur le document de l'utilisateur) :
    // jamais recréés après que l'utilisateur les a supprimés. Lecture sur le serveur : hors connexion,
    // rien n'est écrit (ni sur la foi d'un cache vide), on réessaiera au prochain démarrage.
    async initialiserSiVide() {
      const marqueur = doc(db, 'users', uid);
      if ((await getDocFromServer(marqueur)).get('typesInitialises')) return;
      const snap = await getDocsFromServer(col);
      const lot = writeBatch(db);
      if (snap.empty) {
        for (const t of TYPES_DE_DEPART) {
          lot.set(doc(col, t.id), { nom: t.nom, nomNormalise: normaliserNom(t.nom), archive: false });
        }
      }
      lot.set(marqueur, { typesInitialises: true }, { merge: true });
      suivreEcriture(lot.commit());
    },
  };
}
