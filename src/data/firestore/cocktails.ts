import { doc, onSnapshot, setDoc, updateDoc, type Firestore } from 'firebase/firestore';
import { normaliserNom } from '../../domain/noms';
import type { Cocktail } from '../../domain/types';
import type { DepotCocktails, DonneesCocktail } from '../depots';
import { suivreEcriture } from '../erreurs';
import { colCocktails } from './chemins';

function champs(d: DonneesCocktail) {
  return {
    nom: d.nom,
    nomNormalise: normaliserNom(d.nom),
    variantes: d.variantes,
    nomSansAlcool: d.nomSansAlcool,
  };
}

export function depotCocktails(db: Firestore, uid: string): DepotCocktails {
  const col = colCocktails(db, uid);
  return {
    ecouter(cb) {
      return onSnapshot(col, (snap) => {
        cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Cocktail));
      });
    },
    creer(d) {
      const ref = doc(col);
      suivreEcriture(setDoc(ref, { ...champs(d), archive: false }));
      return ref.id;
    },
    modifier(id, d) {
      suivreEcriture(updateDoc(doc(col, id), champs(d)));
    },
    archiver(id, archive) {
      suivreEcriture(updateDoc(doc(col, id), { archive }));
    },
  };
}
