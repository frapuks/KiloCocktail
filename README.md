# KiloCocktail

Appli web (PWA) pour compter les cocktails servis par un barman pendant une prestation.

## Prérequis

- Node 20+
- JDK 21+ (émulateur Firestore)

## Installation

```
npm install
```

## Scripts

- `npm run dev` : serveur de développement Vite
- `npm run build` : typage puis build de production
- `npm run typecheck` : vérification TypeScript
- `npm test` : tests unitaires (Vitest)
- `npm run test:watch` : tests en mode surveillance
- `npm run dev:emulateurs` : serveur de développement branché sur les émulateurs
- `npm run emulateurs` : lance les émulateurs Auth et Firestore
- `npm run remplir` : vide Firestore de l'émulateur et le remplit de données de démo (compte `barman@kilococktail.test` / `motdepasse123`)
- `npm run test:data` : tests d'intégration et règles de sécurité (émulateurs)
- `npm run test:e2e` : parcours de bout en bout Playwright (WebKit, iPad paysage) contre les émulateurs

Les émulateurs Firestore exigent le JDK 21+ dans le `PATH`. Première utilisation de Playwright : `npx playwright install webkit`.

## Mise en service

1. Créer le projet Firebase (plan Spark), activer Auth e-mail/mot de passe et Firestore (région Europe).
2. Configuration : copier `.env.example` vers `.env.local` et y renseigner la configuration web du projet Firebase (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`), sans `VITE_USE_EMULATORS` (réservé à `.env.emulateurs` ; l'appli refuse de démarrer en production avec). Le projet de production est l'alias `prod` de `.firebaserc` (ici `kilococktail`) ; le projet par défaut reste `demo-kilococktail`, celui des émulateurs.
3. Compte du barman : le créer dans la console Firebase, onglet Authentication.
4. Déploiement de l'appli, des règles et des index : `npx firebase login` (une fois), puis `npm run build && npx firebase deploy --project prod`. Appli en ligne : https://kilococktail.web.app.
5. Sur l'iPad du barman : ouvrir l'URL dans Safari, « Ajouter à l'écran d'accueil », se connecter, saisir son catalogue.
6. Idem sur son téléphone, en secours.

La recette manuelle sur iPad est dans [docs/recette-ipad.md](docs/recette-ipad.md).
