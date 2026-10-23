import { collection, type CollectionReference, type Firestore } from 'firebase/firestore';

export const colCocktails = (db: Firestore, uid: string): CollectionReference =>
  collection(db, 'users', uid, 'cocktails');
export const colTypes = (db: Firestore, uid: string): CollectionReference =>
  collection(db, 'users', uid, 'types');
export const colBases = (db: Firestore, uid: string): CollectionReference =>
  collection(db, 'users', uid, 'bases');
export const colPrestas =(db: Firestore, uid: string): CollectionReference =>
  collection(db, 'users', uid, 'prestas');
export const colVerres = (db: Firestore, uid: string, prestaId: string): CollectionReference =>
  collection(db, 'users', uid, 'prestas', prestaId, 'verres');
