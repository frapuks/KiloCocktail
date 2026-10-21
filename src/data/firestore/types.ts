import {
  doc,
  getDocFromServer,
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
import type { TypeEvenement } from '../../domain/types';
import type { DepotTypes } from '../depots';
import { suivreEcriture } from '../erreurs';
import { colPrestas, colTypes } from './chemins';
import { decouper, TAILLE_LOT } from './lots';

const TYPES_DE_DEPART = [
  { id: 'anniversaire', nom: 'Anniversaire' },
  { id: 'soiree-entreprise', nom: "Soirée d'entreprise" },
];

export function depotTypes(db: Firestore, uid: string): DepotTypes {
  const col = colTypes(db, uid);
  return {
    ecouter(cb) {
      return onSnapshot(col, (snap) => {
        cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TypeEvenement));
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
    // Retire le type des prestas qui l'utilisaient, par lots de 500 opérations (limite Firestore) ; le type
    // lui-même part avec le dernier lot (le seul, dans le cas courant).
    // Prestas lues sur le serveur (le cache local peut être incomplet) : hors connexion, la suppression est refusée.
    async supprimer(id) {
      const prestas = await getDocsFromServer(query(colPrestas(db, uid), where('typeId', '==', id)));
      const lots = decouper(prestas.docs, TAILLE_LOT - 1);
      if (lots.length === 0) lots.push([]);
      lots.forEach((refs, i) => {
        const lot = writeBatch(db);
        refs.forEach((p) => lot.update(p.ref, { typeId: null }));
        if (i === lots.length - 1) lot.delete(doc(col, id));
        suivreEcriture(lot.commit());
      });
    },
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
