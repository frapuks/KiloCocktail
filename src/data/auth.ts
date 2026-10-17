import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { waitForPendingWrites } from 'firebase/firestore'
import type { Desabonner } from './depots'
import { auth, db } from './firebase'

export type Utilisateur = { uid: string; email: string | null }

const DELAI_DECONNEXION_MS = 3000

export function ecouterUtilisateur(cb: (u: Utilisateur | null) => void): Desabonner {
  return onAuthStateChanged(auth, (u) => cb(u ? { uid: u.uid, email: u.email } : null))
}

const CODES_IDENTIFIANTS = ['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found']

export async function seConnecter(email: string, motDePasse: string): Promise<void> {
  try {
    await signInWithEmailAndPassword(auth, email, motDePasse)
  } catch (e) {
    const code = (e as { code?: string }).code ?? ''
    if (CODES_IDENTIFIANTS.includes(code)) throw new Error('identifiants')
    if (code === 'auth/network-request-failed') throw new Error('reseau')
    throw new Error('autre')
  }
}

export async function envoyerReinitialisation(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email)
}

export async function seDeconnecter(): Promise<'ok' | 'en-attente'> {
  const confirmees = waitForPendingWrites(db).then(() => true)
  const delai = new Promise<false>((resolve) => setTimeout(() => resolve(false), DELAI_DECONNEXION_MS))
  if (!(await Promise.race([confirmees, delai]))) return 'en-attente'
  await signOut(auth)
  return 'ok'
}
