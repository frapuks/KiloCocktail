export interface EnvFirebase {
  PROD: boolean;
  VITE_USE_EMULATORS?: string;
  VITE_FIREBASE_PROJECT_ID?: string;
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
