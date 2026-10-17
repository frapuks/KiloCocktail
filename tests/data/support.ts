import { randomUUID } from 'node:crypto';
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import {
  connectFirestoreEmulator,
  initializeFirestore,
  waitForPendingWrites,
  type Firestore,
} from 'firebase/firestore';
import type { Desabonner } from '../../src/data/depots';

const PROJET = 'demo-kilococktail';

export async function preparerEmulateur(): Promise<{ db: Firestore; uid: string }> {
  const app = initializeApp({ projectId: PROJET, apiKey: 'fausse-cle' }, `test-${randomUUID()}`);
  const db = initializeFirestore(app, {});
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  const auth = getAuth(app);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  const cred = await createUserWithEmailAndPassword(auth, `test-${randomUUID()}@exemple.fr`, 'motdepasse-test');
  return { db, uid: cred.user.uid };
}

export async function viderFirestore(): Promise<void> {
  await fetch(`http://127.0.0.1:8080/emulator/v1/projects/${PROJET}/databases/(default)/documents`, {
    method: 'DELETE',
  });
}

export function attendre(db: Firestore): Promise<void> {
  return waitForPendingWrites(db);
}

export function prochaineValeur<T>(
  ecouter: (cb: (v: T) => void) => Desabonner,
  predicat: (v: T) => boolean = () => true,
): Promise<T> {
  return new Promise<T>((resolve) => {
    let desabonner: Desabonner | null = null;
    let fini = false;
    desabonner = ecouter((v) => {
      if (fini || !predicat(v)) return;
      fini = true;
      resolve(v);
      desabonner?.();
    });
    if (fini) desabonner();
  });
}

