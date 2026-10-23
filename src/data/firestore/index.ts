import type { Firestore } from 'firebase/firestore';
import type { Depots } from '../depots';
import { depotBases } from './bases';
import { depotCocktails } from './cocktails';
import { depotPrestas } from './prestas';
import { depotTypes } from './types';
import { depotVerres } from './verres';

export function creerDepots(db: Firestore, uid: string): Depots {
  return {
    cocktails: depotCocktails(db, uid),
    types: depotTypes(db, uid),
    bases: depotBases(db, uid),
    prestas: depotPrestas(db, uid),
    verres: depotVerres(db, uid),
  };
}
