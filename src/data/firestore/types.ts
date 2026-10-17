import { doc, getDocs, onSnapshot, setDoc, updateDoc, writeBatch, type Firestore } from 'firebase/firestore';
import { normaliserNom } from '../../domain/noms';
import type { TypeEvenement } from '../../domain/types';
import type { DepotTypes } from '../depots';
import { suivreEcriture } from '../erreurs';
import { colTypes } from './chemins';

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
    async initialiserSiVide() {
      const snap = await getDocs(col);
      if (!snap.empty) return;
      const lot = writeBatch(db);
      for (const t of TYPES_DE_DEPART) {
        lot.set(doc(col, t.id), { nom: t.nom, nomNormalise: normaliserNom(t.nom), archive: false });
      }
      suivreEcriture(lot.commit());
    },
  };
}
