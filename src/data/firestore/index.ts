import type { Firestore } from 'firebase/firestore';
import type { DepotPrestas, DepotVerres, Depots } from '../depots';
import { depotCocktails } from './cocktails';
import { depotTypes } from './types';

function nonImplemente<T extends object>(): T {
  return new Proxy({} as T, {
    get() {
      return () => {
        throw new Error('non implémenté');
      };
    },
  });
}

export function creerDepots(db: Firestore, uid: string): Depots {
  return {
    cocktails: depotCocktails(db, uid),
    types: depotTypes(db, uid),
    prestas: nonImplemente<DepotPrestas>(),
    verres: nonImplemente<DepotVerres>(),
  };
}
