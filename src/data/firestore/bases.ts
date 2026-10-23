import type { Firestore } from 'firebase/firestore';
import type { Base } from '../../domain/types';
import type { DepotBases } from '../depots';
import { colBases, colCocktails } from './chemins';
import { depotListe } from './listes';

// Supprimer une base la retire des cocktails qui l'avaient.
export function depotBases(db: Firestore, uid: string): DepotBases {
  return depotListe<Base>(db, colBases(db, uid), { col: colCocktails(db, uid), champ: 'baseId' });
}
