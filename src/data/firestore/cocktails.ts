import {
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentReference,
  type Firestore,
} from 'firebase/firestore';
import { normaliserNom } from '../../domain/noms';
import type { Cocktail, Ligne } from '../../domain/types';
import type { DepotCocktails, DonneesCocktail } from '../depots';
import { suivreEcriture } from '../erreurs';
import { colCocktails, colPrestas, colVerres } from './chemins';

const TAILLE_LOT = 500;
const TAILLE_IN = 30;

function decouper<T>(liste: T[], taille: number): T[][] {
  const lots: T[][] = [];
  for (let i = 0; i < liste.length; i += taille) lots.push(liste.slice(i, i + taille));
  return lots;
}

function champs(d: DonneesCocktail) {
  return {
    nom: d.nom,
    nomNormalise: normaliserNom(d.nom),
    alcool: d.alcool,
  };
}

export function depotCocktails(db: Firestore, uid: string): DepotCocktails {
  const col = colCocktails(db, uid);

  // Prestas qui ont le cocktail à leur carte (lignes masquées comprises), avec les verres comptés pour lui.
  // getDocs répond depuis le cache local hors connexion.
  async function concernes(id: string) {
    const prestas = await getDocs(colPrestas(db, uid));
    const resultat: { ref: DocumentReference; lignes: Ligne[]; verres: DocumentReference[] }[] = [];
    for (const p of prestas.docs) {
      const lignes = (p.get('lignes') as Ligne[] | undefined) ?? [];
      const ids = lignes.filter((l) => l.cocktailId === id).map((l) => l.id);
      if (ids.length === 0) continue;
      const verres: DocumentReference[] = [];
      for (const lot of decouper(ids, TAILLE_IN)) {
        const snap = await getDocs(query(colVerres(db, uid, p.id), where('ligneId', 'in', lot)));
        snap.docs.forEach((v) => verres.push(v.ref));
      }
      resultat.push({ ref: p.ref, lignes: lignes.filter((l) => l.cocktailId !== id), verres });
    }
    return resultat;
  }

  return {
    ecouter(cb) {
      return onSnapshot(col, (snap) => {
        cb(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              nom: data.nom,
              nomNormalise: data.nomNormalise,
              alcool: data.alcool ?? true,
              archive: data.archive,
            } as Cocktail;
          }),
        );
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
    async impactSuppression(id) {
      const liste = await concernes(id);
      return { prestas: liste.length, verres: liste.reduce((n, p) => n + p.verres.length, 0) };
    },
    // Verres d'abord (par lots de 500), puis, dans un dernier lot, les cartes des prestas et le cocktail :
    // le cocktail ne disparaît qu'une fois ses verres partis.
    async supprimer(id) {
      const liste = await concernes(id);
      for (const refs of decouper(liste.flatMap((p) => p.verres), TAILLE_LOT)) {
        const lot = writeBatch(db);
        refs.forEach((r) => lot.delete(r));
        suivreEcriture(lot.commit());
      }
      const lot = writeBatch(db);
      liste.forEach((p) => lot.update(p.ref, { lignes: p.lignes }));
      lot.delete(doc(col, id));
      suivreEcriture(lot.commit());
    },
  };
}
