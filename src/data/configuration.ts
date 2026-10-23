export interface EnvFirebase {
  PROD: boolean;
  VITE_USE_EMULATORS?: string;
  VITE_FIREBASE_PROJECT_ID?: string;
}

// Espace de données ouvert après connexion. VITE_UID_DONNEES (uid du barman, en production) : toujours le
// sien, quel que soit le compte connecté, pour que l'admin voie et modifie les mêmes données que lui (les
// règles Firestore l'y autorisent). Absent (dev) : chaque compte a son propre espace.
export function uidDonnees(uidConnecte: string, uidFixe: string | undefined): string {
  return uidFixe?.trim() || uidConnecte;
}

// Arrête l'appli au démarrage plutôt que de la brancher sur les émulateurs ou sur un projet vide.
export function verifierConfiguration(env: EnvFirebase): { utiliseEmulateurs: boolean } {
  const utiliseEmulateurs = env.VITE_USE_EMULATORS === 'true';
  if (env.PROD && utiliseEmulateurs) {
    throw new Error('VITE_USE_EMULATORS ne doit pas être actif en production');
  }
  if (!utiliseEmulateurs && !env.VITE_FIREBASE_PROJECT_ID) {
    throw new Error('Configuration Firebase manquante : renseigne .env.local (voir README)');
  }
  return { utiliseEmulateurs };
}
