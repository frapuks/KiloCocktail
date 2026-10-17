# KiloCocktail MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Livrer la PWA KiloCocktail (comptage de cocktails pour un barman, hors ligne, sauvegardée sur Firebase) conforme à la spec.

**Architecture:** PWA React + Vite + TypeScript en quatre couches : `domain/` (logique pure), `data/` (dépôts, seule couche qui importe Firebase), `features/` (un dossier par écran), `ui/` (composants partagés). Firestore avec cache local persistant ; toutes les écritures partent « en arrière-plan » (jamais attendues par l'interface) pour fonctionner hors ligne.

**Tech Stack:** Node 20+, npm, Vite, React, TypeScript (strict), React Router (`react-router-dom`), Firebase JS SDK modulaire (Auth, Firestore), firebase-tools (émulateurs, Hosting), vite-plugin-pwa, @vite-pwa/assets-generator, @dnd-kit/core + @dnd-kit/sortable, @fontsource/big-shoulders-display + @fontsource/figtree, Vitest + jsdom + @testing-library/react + @testing-library/user-event, @firebase/rules-unit-testing, Playwright (WebKit).

**Spec:** [docs/superpowers/specs/2026-10-17-kilococktail-design.md](../specs/2026-10-17-kilococktail-design.md) — chaque tâche renvoie à ses sections (§). Les textes affichés à l'utilisateur sont ceux de la spec, au mot près.

## Global Constraints

- Interface **en français uniquement** ; textes affichés copiés de la spec. Le signe moins affiché est `−` (U+2212).
- Couleurs : fond `#323232` ; cases avec alcool `#408533` (flash `#6cc25a`, creux `#2b5c23`) ; cases sans alcool `#5d7656` (flash `#84a07b`, creux `#3d4f38`) ; indicateur « −N » `#e0ad4a` ; texte `#f2f5ef` ; texte secondaire `#b3baad` ; filets `#4b4d49`.
- Polices : titres et chiffres « Big Shoulders Display » (600, 800), texte « Figtree » (400–700), **embarquées via @fontsource** (pas de Google Fonts : l'appli doit démarrer hors ligne).
- Durée du cumul « +N » / « −N » : **1300 ms** après le dernier tap de la carte. **Aucun anti-rebond.**
- Le +1 se déclenche sur `pointerdown` ; `touch-action: manipulation`, `user-select: none`, `-webkit-touch-callout: none` sur l'écran de comptage.
- Barre d'onglets (Prestas, Cocktails, Réglages) **masquée** sur `/prestas/nouvelle`, `/prestas/:id` (comptage) et `/prestas/:id/modifier`.
- Données sous `users/{uid}/…` exactement comme spec §7.1 (collections `cocktails`, `types`, `prestas`, `prestas/{id}/verres`).
- **Jamais de transaction Firestore.** Les méthodes d'écriture des dépôts ne sont **pas** `await`ées par l'interface : elles lancent l'écriture et confient sa promesse à `suivreEcriture()` (Task 6).
- Projet Firebase des émulateurs et tests : `demo-kilococktail`. Ports : Auth `9099`, Firestore `8080`, UI émulateurs `4000`.
- Pré-requis poste dev : JDK 21+ (émulateur Firestore), `npm i -g firebase-tools` non requis (installé en devDependency, lancé via `npx firebase`).

## Review Focus

1. **Deux taps rapides sur « − » avant que l'écoute Firestore ne se mette à jour** → chaque tap doit retirer un verre différent (sinon « −2 » affiché pour un seul verre retiré). Test : Task 14, `retire deux verres distincts sur deux taps rapides`.
2. **En ligne, chaque tap crée brièvement une écriture en attente** → l'indicateur ne doit jamais clignoter « Hors connexion » ; il ne passe en attente qu'après 2 s d'écritures non confirmées. Test : Task 14, `reste sur Sauvegardé si l'attente dure moins de 2 s`.
3. **Création d'une presta peu après minuit** → la date par défaut est la date locale, pas la date UTC (`toISOString` donnerait la veille en France). Test : Task 2, `dateDuJour utilise la date locale`.
4. **Cocktail ou type archivé encore utilisé par une presta** → toujours affiché au comptage, aux résultats et dans « Modifier », absent des listes de choix. Tests : Task 12 (`n'affiche pas les cocktails archivés`), Task 14 (`affiche une ligne dont le cocktail est archivé`), Task 15 (`affiche un type archivé`).
5. **Rafale de 10 taps en moins d'une seconde sur une même carte** → 10 verres servis et indicateur « +10 ». Test : Task 14, `compte chaque tap d'une rafale`.

---

## File Structure

```
.env.example                 variables VITE_FIREBASE_* (vides) + VITE_USE_EMULATORS
.firebaserc                  projet par défaut (demo-kilococktail jusqu'à la mise en service)
firebase.json                hosting (dist, réécriture SPA), règles, émulateurs
firestore.rules              règles de sécurité §7.4
firestore.indexes.json       vide (index simples automatiques)
index.html
package.json
playwright.config.ts
pwa-assets.config.ts         génération des icônes depuis public/icone.svg
vite.config.ts               React + VitePWA
vitest.config.ts             tests unitaires/composants (jsdom), exclut tests/data et tests/regles
vitest.data.config.ts        tests sur émulateur (node), tests/data + tests/regles
public/icone.svg
docs/recette-ipad.md         check-list de recette manuelle
README.md                    installation, scripts, mise en service

src/main.tsx                 montage React, persistance du stockage
src/app/App.tsx              routes
src/app/AvecOnglets.tsx      layout avec BarreOnglets
src/app/RouteProtegee.tsx    redirection vers /connexion, initialisation des types
src/app/Bandeaux.tsx         bandeau erreur d'écriture + bandeau nouvelle version
src/ui/theme.css             jetons de couleur, polices, base
src/ui/BarreOnglets.tsx
src/ui/Confirmation.tsx      boîte de dialogue à actions multiples
src/ui/ListeReordonnable.tsx glisser-déposer (dnd-kit)
src/ui/IndicateurSauvegarde.tsx

src/domain/types.ts          types métier
src/domain/noms.ts           normalisation, doublons
src/domain/affichage.ts      noms affichés, dates, pluriel
src/domain/lignes.ts         opérations sur les lignes d'une presta
src/domain/verres.ts         totaux, dernier verre
src/domain/cumul.ts          logique +N / −N
src/domain/sauvegarde.ts     libellé de l'indicateur

src/data/firebase.ts         initialisation (cache persistant, émulateurs)
src/data/depots.ts           interfaces des dépôts (contrat)
src/data/erreurs.ts          suivi des écritures en arrière-plan
src/data/appareil.ts         identifiant d'appareil
src/data/auth.ts             connexion, déconnexion, réinitialisation
src/data/firestore/chemins.ts
src/data/firestore/cocktails.ts
src/data/firestore/types.ts
src/data/firestore/prestas.ts
src/data/firestore/verres.ts
src/data/firestore/index.ts  creerDepots(db, uid)
src/data/DepotsContext.tsx   fournisseur + useDepots()
src/data/hooks.ts            useCocktails, useTypes, usePrestas, usePresta, useVerres

src/features/connexion/EcranConnexion.tsx
src/features/cocktails/EcranCocktails.tsx
src/features/cocktails/FicheCocktail.tsx
src/features/reglages/EcranReglages.tsx
src/features/prestas/EcranPrestas.tsx
src/features/prestas/CartePresta.tsx
src/features/presta-form/ChampType.tsx
src/features/presta-form/SelecteurCocktails.tsx
src/features/presta-form/SurLaCarte.tsx
src/features/presta-form/EcranNouvellePresta.tsx
src/features/presta-form/EcranModifierPresta.tsx
src/features/comptage/CarteCocktail.tsx
src/features/comptage/useCumul.ts
src/features/comptage/EcranComptage.tsx
src/features/comptage/comptage.css
src/features/resultats/EcranResultats.tsx

src/test/setup.ts            jest-dom, nettoyage
src/test/depotsFactices.ts   faux dépôts pour les tests de composants
src/test/rendre.tsx          rendu avec routeur + dépôts

tests/data/support.ts        connexion émulateur, nettoyage
tests/data/*.test.ts
tests/regles/regles.test.ts
tests/e2e/parcours.spec.ts
```

Les tests unitaires et de composants sont à côté du fichier testé (`*.test.ts(x)`).

---

### Task 1: Socle du projet

**Files:**
- Create: `package.json`, `index.html`, `vite.config.ts`, `vitest.config.ts`, `tsconfig*.json`, `.gitignore`, `.env.example`, `README.md`, `src/main.tsx`, `src/app/App.tsx`, `src/ui/theme.css`, `src/test/setup.ts`
- Test: `src/app/App.test.tsx`

**Interfaces:**
- Produces: scripts npm `dev`, `build`, `typecheck` (`tsc -b --noEmit` ou équivalent), `test` (`vitest run`), `test:watch` ; jetons CSS `--fond`, `--texte`, `--texte-2`, `--filet`, `--avec`, `--avec-flash`, `--avec-creux`, `--sans`, `--sans-flash`, `--sans-creux`, `--moins`, `--police-titre`, `--police-texte` dans `theme.css`.

- [ ] **Step 1: Générer le projet** avec `npm create vite@latest . -- --template react-ts`, installer `react-router-dom`, `@fontsource/big-shoulders-display`, `@fontsource/figtree`, et en dev `vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom`. Supprimer le contenu de démonstration Vite. `.gitignore` : `node_modules`, `dist`, `.env.local`, `.firebase`, `*-debug.log`, `test-results`, `playwright-report`.

- [ ] **Step 2: Configurer Vitest** : `vitest.config.ts` avec `environment: 'jsdom'`, `setupFiles: ['src/test/setup.ts']`, `include: ['src/**/*.test.{ts,tsx}']`. `setup.ts` importe `@testing-library/jest-dom/vitest`.

- [ ] **Step 3: Écrire le test qui échoue**

```tsx
// src/app/App.test.tsx
it('affiche le nom de l’appli', () => {
  render(<MemoryRouter><App /></MemoryRouter>);
  expect(screen.getByText('KiloCocktail')).toBeInTheDocument();
});
```

- [ ] **Step 4: Lancer `npm test`** — attendu : FAIL (App absent).

- [ ] **Step 5: Implémenter** `App` (temporaire : un titre « KiloCocktail », remplacé en Task 8), `main.tsx` (BrowserRouter, import `theme.css` et des polices `@fontsource/big-shoulders-display/600.css`, `/800.css`, `@fontsource/figtree/400.css` à `/700.css`), `theme.css` avec les jetons des Global Constraints, `body { background: var(--fond); color: var(--texte); font-family: var(--police-texte); }`, `index.html` avec `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` et `lang="fr"`.

- [ ] **Step 6: Lancer `npm test` et `npm run typecheck`** — attendu : PASS, aucune erreur.

- [ ] **Step 7: Écrire `README.md`** : prérequis (Node 20+, JDK 21+), `npm install`, scripts. Compléter à chaque tâche qui ajoute un script.

- [ ] **Step 8: Commit** — `git add -A && git commit -m "chore: socle Vite React TypeScript et Vitest"`

---

### Task 2: Domaine — types, noms et affichage

**Files:**
- Create: `src/domain/types.ts`, `src/domain/noms.ts`, `src/domain/affichage.ts`
- Test: `src/domain/noms.test.ts`, `src/domain/affichage.test.ts`

**Interfaces:**
- Produces (`types.ts`) :

```ts
export type Variantes = 'avec' | 'sans' | 'les-deux';
export type Variante = 'avec' | 'sans';
export type StatutPresta = 'en-cours' | 'terminee';
export interface Cocktail { id: string; nom: string; nomNormalise: string; variantes: Variantes; nomSansAlcool: string | null; archive: boolean }
export interface TypeEvenement { id: string; nom: string; nomNormalise: string; archive: boolean }
export interface Ligne { id: string; cocktailId: string; variante: Variante; masquee: boolean }
export interface Presta { id: string; date: string; client: string | null; typeId: string | null; statut: StatutPresta; lignes: Ligne[] }
export interface Verre { id: string; ligneId: string; creeLe: number; enAttente: boolean }
```

- Produces (`noms.ts`) : `normaliserNom(nom: string): string` ; `trouverDoublon<T extends { id: string; nomNormalise: string; archive: boolean }>(elements: T[], nom: string, idExclu?: string): T | null`.
- Produces (`affichage.ts`) : `nomLigne(ligne: Ligne, cocktail: Cocktail): { nom: string; sousTitre: 'sans alcool' | null }` ; `formatDate(date: string): string` (« 17/10/2026 ») ; `formatDateLongue(date: string): string` (« samedi 17/10/2026 ») ; `nomPresta(p: { client: string | null; date: string }): string` ; `libelleServis(n: number): 'servi' | 'servis'` ; `dateDuJour(maintenant?: Date): string` (« AAAA-MM-JJ »).

- [ ] **Step 1: Écrire les tests qui échouent**

```ts
// noms.test.ts
it('normalise espaces, casse et accents', () => {
  expect(normaliserNom('  Caïpirinha   Royale ')).toBe('caipirinha royale');
  expect(normaliserNom('Soirée d’entreprise')).toBe('soiree d’entreprise');
});
it('trouve un doublon actif ou archivé, sauf l’élément lui-même', () => {
  const els = [{ id: 'a', nomNormalise: 'mojito', archive: true }, { id: 'b', nomNormalise: 'spritz', archive: false }];
  expect(trouverDoublon(els, 'MOJITO')?.id).toBe('a');
  expect(trouverDoublon(els, 'Spritz', 'b')).toBeNull();
  expect(trouverDoublon(els, 'Nojito')).toBeNull();
});
```

```ts
// affichage.test.ts
const mojito: Cocktail = { id: 'm', nom: 'Mojito', nomNormalise: 'mojito', variantes: 'les-deux', nomSansAlcool: 'Nojito', archive: false };
const mule: Cocktail = { ...mojito, id: 'mm', nom: 'Moscow Mule', nomSansAlcool: null };
const colada: Cocktail = { ...mojito, id: 'c', nom: 'Virgin Colada', variantes: 'sans', nomSansAlcool: null };
const l = (cocktailId: string, variante: Variante): Ligne => ({ id: 'x', cocktailId, variante, masquee: false });

it('nomme une ligne avec alcool sans sous-titre', () => {
  expect(nomLigne(l('m', 'avec'), mojito)).toEqual({ nom: 'Mojito', sousTitre: null });
});
it('utilise le nom sans alcool s’il existe, toujours avec le sous-titre', () => {
  expect(nomLigne(l('m', 'sans'), mojito)).toEqual({ nom: 'Nojito', sousTitre: 'sans alcool' });
  expect(nomLigne(l('mm', 'sans'), mule)).toEqual({ nom: 'Moscow Mule', sousTitre: 'sans alcool' });
  expect(nomLigne(l('c', 'sans'), colada)).toEqual({ nom: 'Virgin Colada', sousTitre: 'sans alcool' });
});
it('formate les dates', () => {
  expect(formatDate('2026-10-17')).toBe('17/10/2026');
  expect(formatDateLongue('2026-10-17')).toBe('samedi 17/10/2026');
});
it('nomme une presta par son client ou par sa date', () => {
  expect(nomPresta({ client: 'Julie Martin', date: '2026-10-17' })).toBe('Julie Martin');
  expect(nomPresta({ client: null, date: '2026-10-17' })).toBe('Presta du 17/10/2026');
  expect(nomPresta({ client: '   ', date: '2026-10-17' })).toBe('Presta du 17/10/2026');
});
it('accorde servi / servis', () => {
  expect(libelleServis(0)).toBe('servi');
  expect(libelleServis(1)).toBe('servi');
  expect(libelleServis(2)).toBe('servis');
});
it('dateDuJour utilise la date locale', () => {
  expect(dateDuJour(new Date(2026, 9, 18, 0, 30))).toBe('2026-10-18');
});
```

- [ ] **Step 2: Lancer `npx vitest run src/domain`** — attendu : FAIL (modules absents).

- [ ] **Step 3: Implémenter** les trois fichiers. `normaliserNom` : `trim`, espaces multiples → un, `toLowerCase`, `normalize('NFD')` puis suppression des diacritiques `\p{M}`. Dates : découper la chaîne « AAAA-MM-JJ » (ne jamais passer par `new Date('2026-10-17')`, interprété en UTC) ; jour de la semaine via `new Date(a, m - 1, j)` et `toLocaleDateString('fr-FR', { weekday: 'long' })`. `dateDuJour` : `getFullYear/getMonth/getDate` locaux, zéros de tête.

- [ ] **Step 4: Lancer `npx vitest run src/domain`** — attendu : PASS.

- [ ] **Step 5: Commit** — `git commit -am "feat(domain): types, noms et affichage"` (ajouter les nouveaux fichiers).

---

### Task 3: Domaine — lignes et verres

**Files:**
- Create: `src/domain/lignes.ts`, `src/domain/verres.ts`
- Test: `src/domain/lignes.test.ts`, `src/domain/verres.test.ts`

**Interfaces:**
- Consumes: types de Task 2.
- Produces (`lignes.ts`) :
  - `variantesDisponibles(c: Cocktail): Variante[]` — `les-deux` → `['avec', 'sans']`.
  - `groupes(lignes: Ligne[], options?: { masquees?: boolean }): { avec: Ligne[]; sans: Ligne[] }` — par défaut seulement les lignes **non masquées** ; `{ masquees: true }` → seulement les masquées.
  - `basculerCocktail(lignes: Ligne[], c: Cocktail, genId: () => string): Ligne[]` — si le cocktail a au moins une ligne : retire toutes ses lignes ; sinon ajoute une ligne par variante disponible, à la fin.
  - `basculerVariante(lignes: Ligne[], cocktailId: string, variante: Variante, genId: () => string): Ligne[]` — retire la ligne si elle existe, sinon l'ajoute à la fin.
  - `deplacerDansGroupe(lignes: Ligne[], variante: Variante, de: number, vers: number): Ligne[]` — `de`/`vers` sont des index **dans le groupe visible** (non masqué) de cette variante.
  - `masquer(lignes: Ligne[], ligneId: string): Ligne[]` ; `reafficher(lignes: Ligne[], ligneId: string): Ligne[]` (démasque et déplace à la fin du tableau) ; `retirer(lignes: Ligne[], ligneId: string): Ligne[]`.
  - `typeRetrait(total: number): 'direct' | 'choix'`.
  - `optionsAbsentes(cocktails: Cocktail[], lignes: Ligne[]): { cocktail: Cocktail; variantes: Variante[] }[]` — cocktails **non archivés**, triés par `nom` (`localeCompare` fr), avec les variantes disponibles qui n'ont aucune ligne (masquée ou non) ; cocktails sans variante restante exclus.
- Produces (`verres.ts`) : `totauxParLigne(verres: Verre[]): Map<string, number>` ; `totalLigne(verres: Verre[], ligneId: string): number` ; `dernierVerre(verres: Verre[], ligneId: string, exclus?: ReadonlySet<string>): Verre | null` (plus grand `creeLe`, ids `exclus` ignorés) ; `totalPresta(verres: Verre[]): number`.

- [ ] **Step 1: Écrire les tests qui échouent** (`lignes.test.ts`, avec `genId` séquentiel `() => 'id' + n++` et les cocktails de Task 2) :
  - `ajoute toutes les variantes d’un cocktail coché, à la fin` : `basculerCocktail([], mojito, gen)` → 2 lignes `avec` puis `sans`.
  - `décoche un cocktail en retirant toutes ses lignes`.
  - `bascule une seule variante` : ajout puis retrait de `('m','sans')`.
  - `range les lignes par groupe en ignorant les masquées` et `liste seulement les masquées avec { masquees: true }`.
  - `déplace dans un groupe sans toucher l’autre` : tableau `[A1, S1, A2, S2, A3]` (A = avec, S = sans), `deplacerDansGroupe(t, 'avec', 2, 0)` → `[A3, S1, A1, S2, A2]` (les emplacements des lignes `avec` sont réutilisés dans le nouvel ordre ; les `sans` ne bougent pas).
  - `déplace en ignorant les masquées` : une ligne `avec` masquée garde sa place, les index portent sur les visibles.
  - `réaffiche une ligne masquée à la fin`.
  - `choisit le type de retrait` : `typeRetrait(0)` → `'direct'`, `typeRetrait(3)` → `'choix'`.
  - `propose les variantes absentes des cocktails non archivés` : avec `lignes = [('m','avec')]` et le Spritz archivé → Mojito `['sans']` présent, Spritz absent, une ligne masquée compte comme présente.
- [ ] **Step 2: Écrire les tests qui échouent** (`verres.test.ts`) :
  - `compte les verres par ligne` (3 verres sur L1, 1 sur L2).
  - `trouve le dernier verre d’une ligne par creeLe`.
  - `ignore les verres exclus` : `dernierVerre(v, 'L1', new Set([idDuPlusRecent]))` → l'avant-dernier.
  - `renvoie null pour une ligne sans verre`.
- [ ] **Step 3: Lancer `npx vitest run src/domain`** — attendu : FAIL.
- [ ] **Step 4: Implémenter.** `deplacerDansGroupe` : relever les index (dans le tableau) des lignes visibles de la variante, réordonner ces lignes (`arrayMove` de `de` vers `vers`), puis les réécrire dans ces mêmes index.
- [ ] **Step 5: Lancer `npx vitest run src/domain`** — attendu : PASS.
- [ ] **Step 6: Commit** — `git commit -m "feat(domain): opérations sur les lignes et totaux"`

---

### Task 4: Domaine — cumul et indicateur de sauvegarde

**Files:**
- Create: `src/domain/cumul.ts`, `src/domain/sauvegarde.ts`
- Test: `src/domain/cumul.test.ts`, `src/domain/sauvegarde.test.ts`

**Interfaces:**
- Produces (`cumul.ts`) : `export const DUREE_CUMUL_MS = 1300;` ; `export type Cumul = { signe: 1 | -1; n: number; expireA: number } | null` ; `cumulerTap(c: Cumul, signe: 1 | -1, maintenant: number): Cumul` ; `libelleCumul(c: Exclude<Cumul, null>): string`.
- Produces (`sauvegarde.ts`) : `export type EtatSauvegarde = { ecrituresEnAttente: boolean; verresEnAttente: number }` ; `export const DELAI_ATTENTE_MS = 2000;` ; `libelleSauvegarde(e: EtatSauvegarde): string`.

- [ ] **Step 1: Écrire les tests qui échouent**

```ts
it('démarre à +1 puis cumule tant que le délai court', () => {
  const a = cumulerTap(null, 1, 0);
  expect(a).toEqual({ signe: 1, n: 1, expireA: 1300 });
  expect(cumulerTap(a, 1, 1000)).toEqual({ signe: 1, n: 2, expireA: 2300 });
});
it('repart à 1 après expiration ou changement de signe', () => {
  const a = cumulerTap(null, 1, 0);
  expect(cumulerTap(a, 1, 1300)?.n).toBe(1);
  expect(cumulerTap(a, -1, 100)).toEqual({ signe: -1, n: 1, expireA: 1400 });
});
it('affiche le cumul avec le vrai signe moins', () => {
  expect(libelleCumul({ signe: 1, n: 3, expireA: 0 })).toBe('+3');
  expect(libelleCumul({ signe: -1, n: 2, expireA: 0 })).toBe('−2');
});
it('libelle l’indicateur de sauvegarde', () => {
  expect(libelleSauvegarde({ ecrituresEnAttente: false, verresEnAttente: 0 })).toBe('Sauvegardé');
  expect(libelleSauvegarde({ ecrituresEnAttente: true, verresEnAttente: 12 })).toBe('Hors connexion · 12 en attente');
  expect(libelleSauvegarde({ ecrituresEnAttente: true, verresEnAttente: 0 })).toBe('Hors connexion · modifications en attente');
});
```

- [ ] **Step 2: Lancer `npx vitest run src/domain`** — attendu : FAIL.
- [ ] **Step 3: Implémenter.**
- [ ] **Step 4: Lancer `npx vitest run src/domain`** — attendu : PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(domain): cumul +N/−N et libellé de sauvegarde"`

---

### Task 5: Firebase — configuration, émulateurs, règles de sécurité

**Files:**
- Create: `firebase.json`, `.firebaserc`, `firestore.rules`, `firestore.indexes.json`, `vitest.data.config.ts`, `src/data/firebase.ts`
- Test: `tests/regles/regles.test.ts`

**Interfaces:**
- Produces: `src/data/firebase.ts` exporte `app`, `auth`, `db` (Firestore initialisé une seule fois avec `persistentLocalCache({ tabManager: persistentMultipleTabManager() })`). Si `import.meta.env.VITE_USE_EMULATORS === 'true'` : `connectAuthEmulator(auth, 'http://127.0.0.1:9099')` et `connectFirestoreEmulator(db, '127.0.0.1', 8080)`, `projectId: 'demo-kilococktail'`.
- Produces: scripts `emulateurs` (`firebase emulators:start --only auth,firestore`), `test:data` (`firebase emulators:exec --only auth,firestore --project demo-kilococktail "vitest run --config vitest.data.config.ts"`), `dev:emulateurs` (`vite --mode emulateurs`, avec `.env.emulateurs` contenant `VITE_USE_EMULATORS=true`).

- [ ] **Step 1: Installer** `firebase` (dépendance) et `firebase-tools @firebase/rules-unit-testing` (dev). `firebase.json` : `hosting.public = "dist"`, réécriture `** → /index.html`, `firestore.rules`, `firestore.indexes.json`, `emulators` (ports des Global Constraints, `ui.enabled: true`). `.firebaserc` : `{ "projects": { "default": "demo-kilococktail" } }`. `vitest.data.config.ts` : `environment: 'node'`, `include: ['tests/data/**/*.test.ts', 'tests/regles/**/*.test.ts']`, `fileParallelism: false`.

- [ ] **Step 2: Écrire les tests de règles qui échouent** (`initializeTestEnvironment({ projectId: 'demo-kilococktail', firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 } })`, `clearFirestore()` avant chaque test) :
  - `autorise le propriétaire à lire et écrire ses données` : contexte `u1`, `set` puis `get` de `users/u1/cocktails/c1` → `assertSucceeds`.
  - `refuse un autre compte` : contexte `u2` sur `users/u1/cocktails/c1` → `assertFails` en lecture et en écriture.
  - `refuse un visiteur non connecté` : `unauthenticatedContext()` → `assertFails`.
  - `accepte un verre conforme` : `users/u1/prestas/p1/verres/v1` avec `{ ligneId, creeLe, horodatage, appareil }` → `assertSucceeds`.
  - `refuse un verre avec un champ en trop` : même chose + `delta: 1` → `assertFails`.

- [ ] **Step 3: Lancer `npm run test:data`** — attendu : FAIL (règles par défaut absentes ou trop larges).

- [ ] **Step 4: Écrire `firestore.rules`**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      function proprietaire() { return request.auth != null && request.auth.uid == uid; }
      match /cocktails/{id} { allow read, write: if proprietaire(); }
      match /types/{id} { allow read, write: if proprietaire(); }
      match /prestas/{prestaId} {
        allow read, write: if proprietaire();
        match /verres/{verreId} {
          allow read, delete: if proprietaire();
          allow create, update: if proprietaire()
            && request.resource.data.keys().hasOnly(['ligneId', 'creeLe', 'horodatage', 'appareil']);
        }
      }
    }
  }
}
```

Pas de joker `{document=**}` : deux `match` couvrant le même document s'additionnent, ce qui annulerait le contrôle des champs des verres.

- [ ] **Step 5: Implémenter `src/data/firebase.ts`** avec la configuration lue dans `import.meta.env.VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID` (listées vides dans `.env.example`).

- [ ] **Step 6: Lancer `npm run test:data`** — attendu : PASS (5 tests).

- [ ] **Step 7: Commit** — `git commit -m "feat(data): configuration Firebase, émulateurs et règles de sécurité"`

---

### Task 6: Dépôts — contrat, cocktails et types

**Files:**
- Create: `src/data/depots.ts`, `src/data/erreurs.ts`, `src/data/firestore/chemins.ts`, `src/data/firestore/cocktails.ts`, `src/data/firestore/types.ts`, `src/data/firestore/index.ts`, `tests/data/support.ts`
- Test: `tests/data/cocktails.test.ts`, `tests/data/types.test.ts`, `src/data/erreurs.test.ts`

**Interfaces:**
- Produces (`depots.ts`) — contrat utilisé par toutes les tâches suivantes :

```ts
export type Desabonner = () => void;
export interface DonneesCocktail { nom: string; variantes: Variantes; nomSansAlcool: string | null }
export interface DonneesPresta { date: string; client: string | null; typeId: string | null; lignes: Ligne[] }
export interface DepotCocktails {
  ecouter(cb: (cocktails: Cocktail[]) => void): Desabonner;  // tous, archivés compris
  creer(d: DonneesCocktail): string;                        // id créé ; écriture en arrière-plan
  modifier(id: string, d: DonneesCocktail): void;
  archiver(id: string, archive: boolean): void;
}
export interface DepotTypes {
  ecouter(cb: (types: TypeEvenement[]) => void): Desabonner;
  creer(nom: string): string;
  renommer(id: string, nom: string): void;
  archiver(id: string, archive: boolean): void;
  initialiserSiVide(): Promise<void>;
}
export interface DepotPrestas {
  ecouterListe(cb: (prestas: Presta[]) => void): Desabonner;
  ecouter(id: string, cb: (presta: Presta | null) => void): Desabonner;
  creer(d: DonneesPresta): string;                          // statut 'en-cours'
  modifier(id: string, d: DonneesPresta, lignesAPurger: string[]): Promise<void>;
  changerStatut(id: string, statut: StatutPresta): void;
  supprimer(id: string): Promise<void>;
  compterServis(id: string): Promise<number | null>;        // null si le serveur est injoignable
}
export interface DepotVerres {
  ecouter(prestaId: string, cb: (verres: Verre[], etat: EtatSauvegarde) => void): Desabonner;
  servir(prestaId: string, ligneId: string): void;
  retirer(prestaId: string, verreId: string): void;
}
export interface Depots { cocktails: DepotCocktails; types: DepotTypes; prestas: DepotPrestas; verres: DepotVerres }
```

- Produces (`erreurs.ts`) : `suivreEcriture(p: Promise<unknown>): void` (attrape le rejet et notifie) ; `surErreurEcriture(cb: () => void): Desabonner`.
- Produces (`firestore/index.ts`) : `creerDepots(db: Firestore, uid: string): Depots` (prestas et verres ajoutés en Task 7 ; d'ici là, ces deux clés lèvent « non implémenté »).
- Produces (`tests/data/support.ts`) : `preparerEmulateur(): Promise<{ db: Firestore; uid: string }>` (app `demo-kilococktail`, `initializeFirestore` en mémoire relié à l'émulateur, crée et connecte un utilisateur `test-<uuid>@exemple.fr` via l'émulateur Auth) ; `viderFirestore(): Promise<void>` (`DELETE http://127.0.0.1:8080/emulator/v1/projects/demo-kilococktail/databases/(default)/documents`) ; `attendre(db)` = `waitForPendingWrites(db)` ; `prochaineValeur<T>(ecouter: (cb: (v: T) => void) => Desabonner, predicat?: (v: T) => boolean): Promise<T>`.

- [ ] **Step 1: Écrire le test qui échoue** `erreurs.test.ts` : `notifie quand une écriture suivie est rejetée` (`suivreEcriture(Promise.reject(new Error()))`, l'abonné est appelé une fois) et `ne notifie pas une écriture réussie`.
- [ ] **Step 2: Écrire les tests d'intégration qui échouent**
  - `cocktails.test.ts` : `crée un cocktail avec son nom normalisé` (après `attendre`, `ecouter` renvoie `{ nom: 'Caïpirinha', nomNormalise: 'caipirinha', variantes: 'avec', nomSansAlcool: null, archive: false }`) ; `modifie et recalcule le nom normalisé` ; `archive puis désarchive`.
  - `types.test.ts` : `initialise les deux types de départ si la collection est vide` (ids `anniversaire` et `soiree-entreprise`, noms « Anniversaire » et « Soirée d'entreprise ») ; `n’écrase pas un type renommé` (renommer `anniversaire` en « Anniv », rappeler `initialiserSiVide`, le nom reste « Anniv ») ; `crée, renomme et archive un type`.
- [ ] **Step 3: Lancer `npx vitest run src/data` et `npm run test:data`** — attendu : FAIL.
- [ ] **Step 4: Implémenter.** `chemins.ts` : fonctions `colCocktails(db, uid)`, `colTypes`, `colPrestas`, `colVerres(db, uid, prestaId)`. Création : `doc(col)` pour obtenir l'id, `setDoc` passé à `suivreEcriture`, retour immédiat de l'id. `nomNormalise` toujours calculé par `normaliserNom` dans le dépôt. `initialiserSiVide` : `getDocs(colTypes)` ; si vide, un `writeBatch` avec les deux ids fixes, confié à `suivreEcriture` (pas d'`await` du commit).
- [ ] **Step 5: Lancer les deux commandes** — attendu : PASS.
- [ ] **Step 6: Commit** — `git commit -m "feat(data): contrat des dépôts, cocktails et types"`

---

### Task 7: Dépôts — prestas et verres

**Files:**
- Create: `src/data/firestore/prestas.ts`, `src/data/firestore/verres.ts`, `src/data/appareil.ts`
- Modify: `src/data/firestore/index.ts`
- Test: `tests/data/prestas.test.ts`, `tests/data/verres.test.ts`, `src/data/appareil.test.ts`

**Interfaces:**
- Consumes: `Depots`, `suivreEcriture`, support de test (Task 6).
- Produces: `identifiantAppareil(): string` — lu ou créé dans `localStorage['kilococktail.appareil']`, format `appareil-<uuid>`.
- Produces: implémentations `DepotPrestas` et `DepotVerres` branchées dans `creerDepots`.

- [ ] **Step 1: Écrire les tests qui échouent**
  - `appareil.test.ts` : `crée puis réutilise le même identifiant`.
  - `verres.test.ts` :
    - `sert un verre` : `servir(p, 'L1')`, `attendre`, `ecouter` → 1 verre `ligneId: 'L1'`, `enAttente: false`, état `{ ecrituresEnAttente: false, verresEnAttente: 0 }`.
    - `un même verre écrit deux fois ne compte qu’une fois` : deux `setDoc` sur le même id de verre → 1 document.
    - `retire le verre demandé` : 3 verres sur L1, `retirer(p, idDuDernier)` → 2 restent, le dernier a disparu.
    - `signale les verres en attente` : `servir` puis lecture immédiate du premier instantané (avant `attendre`) → `verresEnAttente: 1`, `ecrituresEnAttente: true`.
  - `prestas.test.ts` :
    - `crée une presta en cours` (`statut: 'en-cours'`, champs conservés, ordre des `lignes` conservé).
    - `modifie une presta et purge les verres des lignes supprimées` : 2 verres sur L1, 1 sur L2 ; `modifier(id, { …, lignes: [L2] }, ['L1'])` → presta sans L1, 1 seul verre restant (L2).
    - `change le statut`.
    - `supprime une presta et ses verres`.
    - `compte les verres servis côté serveur` (3 verres → `3`).
- [ ] **Step 2: Lancer `npm run test:data` et `npx vitest run src/data`** — attendu : FAIL.
- [ ] **Step 3: Implémenter.**
  - `servir` : `setDoc(doc(colVerres, crypto.randomUUID()), { ligneId, creeLe: Date.now(), horodatage: serverTimestamp(), appareil: identifiantAppareil() })` via `suivreEcriture`.
  - `ecouter` (verres) : `onSnapshot(colVerres, { includeMetadataChanges: true }, …)` ; `enAttente = doc.metadata.hasPendingWrites` ; `etat = { ecrituresEnAttente: snap.metadata.hasPendingWrites, verresEnAttente: nombre de docs enAttente }`.
  - `modifier` : met à jour `date`, `client`, `typeId`, `lignes` ; si `lignesAPurger` non vide, `getDocs(query(colVerres, where('ligneId', 'in', lots de 30)))` puis suppression. Toutes les opérations dans des `writeBatch` de 500 opérations maximum, confiés à `suivreEcriture`. La promesse retournée se résout une fois les lots **lancés**, pas confirmés.
  - `supprimer` : `getDocs(colVerres)`, lots de suppression, puis suppression de la presta, même règle.
  - `compterServis` : `getCountFromServer(colVerres)` dans un `try`, `null` en cas d'erreur.
  - `ecouterListe` : `onSnapshot(colPrestas)`, sans tri (le tri est fait par l'écran d'accueil, Task 11).
- [ ] **Step 4: Lancer les deux commandes** — attendu : PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(data): dépôts prestas et verres"`

---

### Task 8: Authentification, contexte des dépôts, navigation et connexion

**Files:**
- Create: `src/data/auth.ts`, `src/data/DepotsContext.tsx`, `src/data/hooks.ts`, `src/app/RouteProtegee.tsx`, `src/app/AvecOnglets.tsx`, `src/app/Bandeaux.tsx`, `src/ui/BarreOnglets.tsx`, `src/features/connexion/EcranConnexion.tsx`, `src/test/depotsFactices.ts`, `src/test/rendre.tsx`
- Modify: `src/app/App.tsx`, `src/main.tsx`, `src/app/App.test.tsx`
- Test: `src/features/connexion/EcranConnexion.test.tsx`, `src/app/App.test.tsx`, `src/app/Bandeaux.test.tsx`

**Interfaces:**
- Produces (`auth.ts`) : `type Utilisateur = { uid: string; email: string | null }` ; `ecouterUtilisateur(cb: (u: Utilisateur | null) => void): Desabonner` ; `seConnecter(email: string, motDePasse: string): Promise<void>` qui rejette avec `Error` de `message` `'identifiants' | 'reseau' | 'autre'` (codes Firebase `auth/invalid-credential`, `auth/wrong-password`, `auth/user-not-found` → `identifiants` ; `auth/network-request-failed` → `reseau`) ; `envoyerReinitialisation(email: string): Promise<void>` ; `seDeconnecter(): Promise<'ok' | 'en-attente'>` (`Promise.race` entre `waitForPendingWrites(db)` et 3000 ms ; `'en-attente'` sans déconnecter si le délai gagne).
- Produces (`DepotsContext.tsx`) : `<DepotsProvider depots={…}>`, `useDepots(): Depots`.
- Produces (`hooks.ts`) : `useCocktails(): Cocktail[] | undefined`, `useTypes(): TypeEvenement[] | undefined`, `usePrestas(): Presta[] | undefined`, `usePresta(id: string): Presta | null | undefined`, `useVerres(prestaId: string): { verres: Verre[]; etat: EtatSauvegarde } | undefined` (`undefined` = chargement).
- Produces (`App.tsx`) : `App(props: { fabriqueDepots: (uid: string) => Depots })` — `App` n'importe jamais `src/data/firebase.ts` ; `main.tsx` passe `(uid) => creerDepots(db, uid)`, les tests passent `() => depotsFactices`. `RouteProtegee` crée les dépôts (une fois par `uid`) et les fournit via `DepotsProvider`. Routes : `/connexion`, puis sous `RouteProtegee` : avec `AvecOnglets` → `/` (Prestas), `/prestas/:id/resultats`, `/cocktails`, `/reglages` ; sans onglets → `/prestas/nouvelle`, `/prestas/:id`, `/prestas/:id/modifier`. Les écrans pas encore écrits sont des composants vides nommés, remplacés par leurs tâches.
- Produces (`src/test`) : `creerDepotsFactices(donnees?: { cocktails?: Cocktail[]; types?: TypeEvenement[]; prestas?: Presta[]; verres?: Record<string, Verre[]>; etat?: EtatSauvegarde }): Depots & { emettre: { verres(prestaId: string, v: Verre[], e?: EtatSauvegarde): void; presta(p: Presta): void } }` — chaque `ecouter*` rappelle immédiatement avec les données, toutes les méthodes sont des `vi.fn` (les `creer` renvoient `'nouvel-id'`, `compterServis` résout `0`) ; `rendre(ui: ReactElement, { depots, route = '/' }): RenderResult` avec `MemoryRouter` + `DepotsProvider` ; `rendreApp({ depots, route, utilisateur })` qui rend `App` avec `ecouterUtilisateur` simulé (`vi.mock('../data/auth')`).

- [ ] **Step 1: Écrire les tests qui échouent**
  - `EcranConnexion.test.tsx` : `connecte puis ouvre l’accueil` ; `affiche « E-mail ou mot de passe incorrect »` (rejet `identifiants`) ; `affiche « Pas de connexion internet, réessaie dans un instant »` (rejet `reseau`) ; `envoie l’e-mail de réinitialisation` (lien « Mot de passe oublié » avec l'e-mail saisi) ; `prévient qu’il faut internet pour la première ouverture` (`navigator.onLine` à `false` → « Connecte-toi à internet pour la première ouverture. »).
  - `App.test.tsx` (remplace le test de Task 1) : `redirige vers la connexion sans utilisateur` ; `affiche la barre d’onglets sur l’accueil` (liens « Prestas », « Cocktails », « Réglages ») ; `masque la barre d’onglets sur le comptage` (route `/prestas/p1`) ; `initialise les types après connexion` (`depots.types.initialiserSiVide` appelé une fois).
  - `Bandeaux.test.tsx` : `affiche le bandeau d’erreur d’écriture` (après notification `surErreurEcriture` → « Une modification n'a pas pu être sauvegardée »).
- [ ] **Step 2: Lancer `npm test`** — attendu : FAIL.
- [ ] **Step 3: Implémenter.** Les tests mockent `src/data/auth` (`vi.mock`), qui seul importe `src/data/firebase.ts` côté écrans. `BarreOnglets` : `NavLink` vers `/`, `/cocktails`, `/reglages`, fixée en bas avec `padding-bottom: env(safe-area-inset-bottom)`. `Bandeaux` : affiché au-dessus des routes ; le bandeau de nouvelle version est ajouté en Task 16.
- [ ] **Step 4: Lancer `npm test` et `npm run typecheck`** — attendu : PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: authentification, navigation et écran de connexion"`

---

### Task 9: Catalogue de cocktails

**Files:**
- Create: `src/features/cocktails/EcranCocktails.tsx`, `src/features/cocktails/FicheCocktail.tsx`, `src/ui/Confirmation.tsx`
- Test: `src/features/cocktails/EcranCocktails.test.tsx`, `src/features/cocktails/FicheCocktail.test.tsx`, `src/ui/Confirmation.test.tsx`

**Interfaces:**
- Consumes: `useCocktails`, `useDepots`, `trouverDoublon`, `rendre`, `creerDepotsFactices`.
- Produces: `FicheCocktail(props: { cocktail?: Cocktail; cocktails: Cocktail[]; onEnregistrer(d: DonneesCocktail): void; onAnnuler(): void; onArchiver?(): void })` — réutilisée par « + Créer un cocktail » (Task 12).
- Produces: `Confirmation(props: { titre: string; message?: string; actions: { libelle: string; onClick(): void; danger?: boolean }[]; onFermer(): void })` — dialogue modal (`role="dialog"`), focus sur la première action.

- [ ] **Step 1: Écrire les tests qui échouent** (spec §5.8)
  - `Confirmation.test.tsx` : `affiche le titre et déclenche l’action choisie`.
  - `FicheCocktail.test.tsx` :
    - `sélectionne « Avec alcool uniquement » par défaut`.
    - `affiche le nom sans alcool seulement pour « Les deux »`.
    - `enregistre les données saisies` → `{ nom: 'Mojito', variantes: 'les-deux', nomSansAlcool: 'Nojito' }` ; `nomSansAlcool` vide ou variantes ≠ `les-deux` → `null`.
    - `refuse un nom vide` → « Donne un nom au cocktail ».
    - `refuse un doublon actif` → « Un cocktail “Mojito” existe déjà ».
    - `refuse un doublon archivé` → « Un cocktail “Mojito” existe déjà dans les archivés. Désarchive-le plutôt. »
    - `rappelle que le renommage s’applique partout` (en modification, après changement du nom → « Le nouveau nom s'affichera aussi dans les prestas passées. »).
  - `EcranCocktails.test.tsx` : `liste les cocktails actifs par ordre alphabétique avec leurs variantes` (pastilles « Avec alcool » / « Sans alcool », « → Nojito ») ; `range les archivés dans une section repliée` et `désarchive` (`depots.cocktails.archiver(id, false)`) ; `crée un cocktail` (`depots.cocktails.creer` appelé) ; `archive depuis la fiche`.
- [ ] **Step 2: Lancer `npm test`** — attendu : FAIL.
- [ ] **Step 3: Implémenter.** Boutons radio libellés « Avec alcool uniquement », « Sans alcool uniquement », « Les deux ». Le contrôle de doublon passe `cocktail?.id` en `idExclu`.
- [ ] **Step 4: Lancer `npm test`** — attendu : PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: catalogue de cocktails"`

---

### Task 10: Réglages — types d'événement et compte

**Files:**
- Create: `src/features/reglages/EcranReglages.tsx`
- Test: `src/features/reglages/EcranReglages.test.tsx`

**Interfaces:**
- Consumes: `useTypes`, `useDepots`, `trouverDoublon`, `seDeconnecter`, `ecouterUtilisateur`, `Confirmation`.
- Produces: `FicheType(props: { type?: TypeEvenement; types: TypeEvenement[]; onEnregistrer(nom: string): void; onAnnuler(): void; onArchiver?(): void })`, exportée depuis `EcranReglages.tsx` et réutilisée par « + Ajouter un type » (Task 12).

- [ ] **Step 1: Écrire les tests qui échouent** (spec §5.9) : `liste les types actifs et archive` ; `ajoute un type` (`depots.types.creer('Mariage')`) ; `renomme un type` ; `refuse un type en doublon` (message « Un type “Anniversaire” existe déjà », variante « …dans les archivés. Désarchive-le plutôt. ») ; `désarchive depuis la section repliée` ; `affiche l’e-mail connecté` ; `se déconnecte` ; `bloque la déconnexion si des cocktails sont en attente` (`seDeconnecter` résout `'en-attente'` → « Des cocktails ne sont pas encore sauvegardés. Reconnecte-toi à internet avant de te déconnecter. »).
- [ ] **Step 2: Lancer `npm test`** — attendu : FAIL.
- [ ] **Step 3: Implémenter.**
- [ ] **Step 4: Lancer `npm test`** — attendu : PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: réglages, types d'événement et déconnexion"`

---

### Task 11: Accueil — liste des prestas

**Files:**
- Create: `src/features/prestas/EcranPrestas.tsx`, `src/features/prestas/CartePresta.tsx`
- Test: `src/features/prestas/EcranPrestas.test.tsx`

**Interfaces:**
- Consumes: `usePrestas`, `useTypes`, `useDepots().prestas.compterServis`, `nomPresta`, `formatDate`, `libelleServis`.

- [ ] **Step 1: Écrire les tests qui échouent** (spec §5.3) : `ouvre « Nouvelle presta »` (navigation `/prestas/nouvelle`) ; `sépare « En cours » et « Terminées », triées par date décroissante` ; `affiche nom, type, date et total servi` (« Julie Martin », « Anniversaire », « 17/10/2026 », « 39 servis » avec `compterServis` résolu à 39) ; `affiche « — » quand le total est indisponible` (`compterServis` résout `null`) ; `ouvre le comptage d’une presta en cours` (`/prestas/p1`) et `ouvre les résultats d’une presta terminée` (`/prestas/p2/resultats`).
- [ ] **Step 2: Lancer `npm test`** — attendu : FAIL.
- [ ] **Step 3: Implémenter.** Le type d'une presta est cherché parmi **tous** les types (archivés compris).
- [ ] **Step 4: Lancer `npm test`** — attendu : PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: accueil et liste des prestas"`

---

### Task 12: Nouvelle presta

**Files:**
- Create: `src/features/presta-form/ChampType.tsx`, `src/features/presta-form/SelecteurCocktails.tsx`, `src/features/presta-form/SurLaCarte.tsx`, `src/features/presta-form/EcranNouvellePresta.tsx`, `src/ui/ListeReordonnable.tsx`
- Test: `src/features/presta-form/EcranNouvellePresta.test.tsx`, `src/features/presta-form/SurLaCarte.test.tsx`

**Interfaces:**
- Consumes: `basculerCocktail`, `basculerVariante`, `deplacerDansGroupe`, `groupes`, `optionsAbsentes`, `nomLigne`, `dateDuJour`, `FicheCocktail`, `FicheType`.
- Produces:
  - `ChampType(props: { types: TypeEvenement[]; valeur: string | null; onChange(id: string | null): void; onCreer(nom: string): string })` — types actifs + « + Ajouter un type ».
  - `SelecteurCocktails(props: { options: { cocktail: Cocktail; variantes: Variante[] }[]; lignes: Ligne[]; onChange(lignes: Ligne[]): void; onCreerCocktail(d: DonneesCocktail): string })` — une ligne par option avec case à cocher et pastilles « Avec alcool » / « Sans alcool » ; « + Créer un cocktail » ouvre `FicheCocktail`, puis coche le cocktail créé (toutes ses variantes).
  - `ListeReordonnable<T extends { id: string }>(props: { elements: T[]; rendre(e: T): ReactNode; onDeplacer(de: number, vers: number): void; libelle: string })` — dnd-kit (`DndContext` avec `PointerSensor` et `KeyboardSensor`, `SortableContext` vertical), poignée ≡ avec `aria-label="Déplacer"`.
  - `SurLaCarte(props: { lignes: Ligne[]; cocktails: Cocktail[]; totaux?: Map<string, number>; onDeplacer(variante: Variante, de: number, vers: number): void; onRetirer?(ligneId: string): void })` — titre « Sur la carte », groupes « Avec alcool » puis « Sans alcool » (lignes non masquées), total et bouton « Retirer » affichés seulement si `totaux` / `onRetirer` sont fournis.

- [ ] **Step 1: Écrire les tests qui échouent** (spec §5.4)
  - `EcranNouvellePresta.test.tsx` :
    - `préremplit la date du jour`.
    - `n’affiche pas les cocktails archivés`.
    - `coche toutes les variantes d’un cocktail` (Mojito coché → « Mojito » dans le groupe Avec alcool et « Nojito » dans Sans alcool de « Sur la carte »).
    - `éteint une variante, et décoche le cocktail quand plus aucune n’est active`.
    - `crée un cocktail à la volée et le coche`.
    - `ajoute un type à la volée et le sélectionne`.
    - `commence la presta même sans cocktail` : « Commencer la presta » actif, `depots.prestas.creer` appelé avec `{ date, client: null, typeId: null, lignes: [] }`, puis navigation `/prestas/nouvel-id`.
    - `enregistre le client saisi` ; un client composé d'espaces est enregistré `null`.
    - `annule sans rien créer` (retour `/`, `creer` non appelé).
  - `SurLaCarte.test.tsx` : `regroupe et nomme les lignes` ; `déplace au clavier` (focus sur la poignée, Espace, Flèche bas, Espace → `onDeplacer('avec', 0, 1)`).
- [ ] **Step 2: Lancer `npm test`** — attendu : FAIL.
- [ ] **Step 3: Implémenter.** L'état du formulaire est un brouillon `{ date, client, typeId, lignes }`. Les options du sélecteur viennent de `optionsAbsentes(cocktails, [])` (tous les cocktails non archivés, toutes variantes) ; l'état coché se déduit des `lignes`.
- [ ] **Step 4: Lancer `npm test`** — attendu : PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: création d'une presta"`

---

### Task 13: Modifier une presta

**Files:**
- Create: `src/features/presta-form/EcranModifierPresta.tsx`
- Test: `src/features/presta-form/EcranModifierPresta.test.tsx`

**Interfaces:**
- Consumes: `usePresta`, `useVerres`, `useCocktails`, `useTypes`, `ChampType`, `SurLaCarte`, `SelecteurCocktails`, `Confirmation`, `typeRetrait`, `masquer`, `reafficher`, `retirer`, `optionsAbsentes`, `totauxParLigne`, `totalPresta`, `nomPresta`, `depots.prestas.modifier`, `depots.prestas.supprimer`.

- [ ] **Step 1: Écrire les tests qui échouent** (spec §5.6) ; données : catalogue Mojito (les-deux, « Nojito »), Spritz (avec, **archivé**), Moscow Mule (les-deux) ; presta `p1` « Julie Martin » avec L1 (Mojito avec, 3 verres), L2 (Spritz avec, 0 verre), L3 (Mojito sans = Nojito, masquée, 2 verres) :
  - `préremplit date, client et type`.
  - `retire directement une ligne à 0` (L2 disparaît, aucune confirmation).
  - `propose trois choix pour une ligne comptée` (L1 → dialogue avec « Masquer du comptage (garder les 3 servis) », « Supprimer avec ses 3 servis », « Annuler »).
  - `masque une ligne comptée` → à l'enregistrement, `modifier('p1', { …lignes: L1 masquée… }, [])`.
  - `supprime une ligne comptée avec ses verres` → `modifier('p1', { lignes sans L1 }, ['L1'])`.
  - `réaffiche une ligne masquée à la fin de son groupe` (section « Masquées » avec « Réafficher »).
  - `ajoute seulement les cocktails et variantes absents` : le sélecteur de « + Ajouter » propose Moscow Mule (avec et sans) et rien d'autre (Mojito a ses deux variantes en L1/L3, Spritz est archivé) ; valider l'ajout place les lignes à la fin de leur groupe.
  - `affiche une ligne dont le cocktail est archivé` (Spritz archivé reste dans « Sur la carte »).
  - `n’applique rien avant « Enregistrer »` (`modifier` non appelé tant qu'on n'a pas cliqué).
  - `demande confirmation avant d’abandonner des modifications` (« Annuler » avec brouillon modifié → dialogue ; sans modification → retour direct).
  - `supprime la presta après confirmation` : « Supprimer “Julie Martin” et ses 5 cocktails servis ? » → `supprimer('p1')` puis navigation `/`.
- [ ] **Step 2: Lancer `npm test`** — attendu : FAIL.
- [ ] **Step 3: Implémenter.** Brouillon `{ date, client, typeId, lignes, lignesAPurger: string[] }` initialisé depuis la presta ; « Enregistrer » appelle `modifier` puis `navigate(-1)`.
- [ ] **Step 4: Lancer `npm test`** — attendu : PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: modification d'une presta"`

---

### Task 14: Écran de comptage

**Files:**
- Create: `src/features/comptage/useCumul.ts`, `src/features/comptage/CarteCocktail.tsx`, `src/features/comptage/EcranComptage.tsx`, `src/features/comptage/comptage.css`, `src/ui/IndicateurSauvegarde.tsx`
- Test: `src/features/comptage/CarteCocktail.test.tsx`, `src/features/comptage/EcranComptage.test.tsx`, `src/ui/IndicateurSauvegarde.test.tsx`

**Interfaces:**
- Consumes: `cumulerTap`, `libelleCumul`, `DUREE_CUMUL_MS`, `libelleSauvegarde`, `DELAI_ATTENTE_MS`, `groupes`, `nomLigne`, `totauxParLigne`, `dernierVerre`, `nomPresta`, `formatDateLongue`, `libelleServis`, `usePresta`, `useVerres`, `useCocktails`, `useTypes`, `depots.verres.servir`, `depots.verres.retirer`, `depots.prestas.changerStatut`.
- Produces: `useCumul(): { cumul: Cumul; taper(signe: 1 | -1): void }` (efface le cumul `DUREE_CUMUL_MS` après le dernier tap) ; `CarteCocktail(props: { nom: string; sousTitre: string | null; total: number; variante: Variante; onPlus(): void; onMoins(): void })` ; `IndicateurSauvegarde(props: { etat: EtatSauvegarde })`.

- [ ] **Step 1: Écrire les tests qui échouent** (spec §5.5) — `vi.useFakeTimers()` pour le cumul :
  - `CarteCocktail.test.tsx` :
    - `ajoute 1 au toucher et affiche +1` (`fireEvent.pointerDown` sur la carte → `onPlus` ×1, « +1 » visible).
    - `cumule les taps rapprochés` (3 taps → « +3 ») et `efface le cumul 1,3 s après le dernier tap` (`advanceTimersByTime(1299)` → « +3 » visible ; `+1` ms → absent).
    - `compte chaque tap d’une rafale` (10 `pointerDown` en 900 ms simulées → `onPlus` ×10, « +10 »).
    - `retire 1 avec le bouton − et cumule −N` (2 taps sur « − » → `onMoins` ×2, « −2 » ; un tap sur la carte ensuite → « +1 »).
    - `le bouton − ne déclenche pas le +1`.
    - `désactive le bouton − à 0`.
    - `affiche nom, sous-titre et total accordé` (« Nojito », « sans alcool », « 1 servi » ; « 14 servis »).
  - `IndicateurSauvegarde.test.tsx` : `affiche Sauvegardé sans écriture en attente` ; `reste sur Sauvegardé si l’attente dure moins de 2 s` (état en attente puis confirmé à 1500 ms → jamais « Hors connexion ») ; `affiche le nombre en attente après 2 s` (« Hors connexion · 12 en attente ») ; `revient immédiatement à Sauvegardé`.
  - `EcranComptage.test.tsx` :
    - `affiche l’en-tête de la presta` (« Julie Martin », « Anniversaire · samedi 17/10/2026 », boutons « ← Prestas », « Modifier », « Résultats », « Terminer »).
    - `range les cartes en groupes Avec alcool puis Sans alcool, sans les masquées`.
    - `affiche une ligne dont le cocktail est archivé`.
    - `sert un verre sur la bonne ligne` (`servir('p1', 'L1')`).
    - `retire le dernier verre de la ligne` (`retirer('p1', idDuPlusRecent)`).
    - `retire deux verres distincts sur deux taps rapides` (2 taps sur « − » sans nouvel instantané → `retirer` appelé avec deux ids différents).
    - `invite à passer par Modifier sans ligne visible`.
    - `termine la presta et ouvre les résultats` (`changerStatut('p1', 'terminee')`, navigation `/prestas/p1/resultats`).
    - `redirige une presta terminée vers ses résultats`.
- [ ] **Step 2: Lancer `npm test`** — attendu : FAIL.
- [ ] **Step 3: Implémenter.**
  - `EcranComptage` garde un `useRef<Set<string>>` des verres en cours de retrait : `dernierVerre(verres, ligneId, enCours)`, ajout de l'id au Set avant `retirer`, purge des ids absents à chaque nouvel instantané.
  - `IndicateurSauvegarde` : passe en attente seulement si `ecrituresEnAttente` reste vrai pendant `DELAI_ATTENTE_MS` ; revient à « Sauvegardé » dès qu'il est faux.
  - `comptage.css` (référence visuelle : maquette v5) :
    - **Groupes** : deux bandes, chacune avec son libellé en petites capitales et une pastille de couleur.
    - **Grille** : 2 colonnes en paysage, 1 en portrait (`@media (orientation: portrait)`), `gap: 12px`. La hauteur des bandes est proportionnelle à leur nombre de rangées, toutes les cartes sont visibles jusqu'à 8, défilement au-delà.
    - **Carte** : `border-radius: 16px`, fond `var(--avec)` ou `var(--sans)`, `grid-template-columns: minmax(0, 1fr) auto`, `grid-template-areas: "nom plus" "servis plus" ". moins"`.
    - **Nom** : Big Shoulders 800, `clamp(28px, 3.8vw, 48px)`, `overflow-wrap: anywhere`.
    - **« +N »** : Big Shoulders 800, 52 px, `min-width: 104px`, pastille `var(--texte)` sur texte `var(--avec-creux)` ou `var(--sans-creux)`, place réservée (opacité 0 au repos).
    - **« −N »** : fond `var(--moins)`.
    - **Total** : icône de verre SVG 22 px, chiffre en Big Shoulders 24 px, puis « servi » / « servis ».
    - **Bouton −** : rond de 42 px, coin bas droit, discret.
    - **Animations** : flash `var(--avec-flash)` / `var(--sans-flash)` sur 340 ms ; creux `var(--…-creux)` sur 400 ms pour le −. Toutes coupées sous `prefers-reduced-motion: reduce`.
- [ ] **Step 4: Lancer `npm test`** — attendu : PASS.
- [ ] **Step 5: Vérifier à l'œil** avec `npm run dev:emulateurs` + `npm run emulateurs` (un compte créé dans l'UI des émulateurs, `http://127.0.0.1:4000`) : comparer paysage et portrait à la maquette v5.
- [ ] **Step 6: Commit** — `git commit -m "feat: écran de comptage"`

---

### Task 15: Résultats, Terminer et Reprendre

**Files:**
- Create: `src/features/resultats/EcranResultats.tsx`
- Test: `src/features/resultats/EcranResultats.test.tsx`

**Interfaces:**
- Consumes: `usePresta`, `useVerres`, `useCocktails`, `useTypes`, `nomLigne`, `totauxParLigne`, `formatDate`, `depots.prestas.changerStatut`.

- [ ] **Step 1: Écrire les tests qui échouent** (spec §5.7)
  - `affiche date, client et type` ; `affiche « — » pour un client ou un type vide`.
  - `liste une ligne par variante, masquées comprises, dans l’ordre du comptage` (Avec alcool puis Sans alcool, totaux corrects).
  - `affiche un type archivé`.
  - `affiche « En cours » et « Retour au comptage » pour une presta en cours`.
  - `affiche « Terminée · lecture seule », « Modifier » et « Reprendre le comptage » pour une presta terminée`.
  - `reprend le comptage` (`changerStatut('p1', 'en-cours')` puis `/prestas/p1`) ; `ouvre Modifier` (`/prestas/p1/modifier`).
- [ ] **Step 2: Lancer `npm test`** — attendu : FAIL.
- [ ] **Step 3: Implémenter.**
- [ ] **Step 4: Lancer `npm test`** — attendu : PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: résultats, terminer et reprendre"`

---

### Task 16: PWA — installation, mise à jour, persistance

**Files:**
- Create: `public/icone.svg`, `pwa-assets.config.ts`
- Modify: `vite.config.ts`, `src/app/Bandeaux.tsx`, `src/main.tsx`, `index.html`, `src/app/Bandeaux.test.tsx`

**Interfaces:**
- Consumes: `useRegisterSW` de `virtual:pwa-register/react`.

- [ ] **Step 1: Écrire le test qui échoue** `Bandeaux.test.tsx` : `propose de recharger quand une nouvelle version est prête` (`vi.mock('virtual:pwa-register/react')` avec `needRefresh: [true, …]` → « Nouvelle version disponible », bouton « Recharger » qui appelle `updateServiceWorker(true)`) ; `ne recharge jamais tout seul` (sans clic, `updateServiceWorker` non appelé).
- [ ] **Step 2: Lancer `npm test`** — attendu : FAIL.
- [ ] **Step 3: Implémenter.**
  - **`vite.config.ts`** : `VitePWA({ registerType: 'prompt', manifest: { … } })`, avec dans le manifest :
    - `name: 'KiloCocktail'`, `short_name: 'KiloCocktail'`, `lang: 'fr'` ;
    - `display: 'standalone'`, `orientation: 'any'` ;
    - `background_color: '#323232'`, `theme_color: '#323232'` ;
    - les icônes générées.
  - **`workbox.navigateFallback: 'index.html'`**.
  - **Icônes** : un verre à cocktail blanc sur fond `#408533` dans `public/icone.svg`. Générer les icônes avec `@vite-pwa/assets-generator`, preset `minimal2023Preset`, script `icones`. Ajouter les balises `apple-touch-icon` et `apple-mobile-web-app-capable` dans `index.html`.
  - **`main.tsx`** : `navigator.storage?.persist?.()`.
- [ ] **Step 4: Lancer `npm test` puis `npm run build`** — attendu : PASS ; `dist/manifest.webmanifest` et `dist/sw.js` présents.
- [ ] **Step 5: Commit** — `git commit -m "feat: PWA installable avec mise à jour sur demande"`

---

### Task 17: Parcours de bout en bout, recette et mise en service

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/parcours.spec.ts`, `docs/recette-ipad.md`
- Modify: `package.json` (script `test:e2e`), `README.md`

**Interfaces:**
- Consumes: l'appli complète, `npm run dev:emulateurs`.

- [ ] **Step 1: Installer Playwright** (`@playwright/test`, `npx playwright install webkit`). `playwright.config.ts` : projet unique `webkit`, appareil `devices['iPad (gen 7) landscape']`, `webServer: { command: 'npm run dev:emulateurs', url: 'http://localhost:5173' }`. Script `test:e2e` : `firebase emulators:exec --only auth,firestore --project demo-kilococktail "playwright test"`.
- [ ] **Step 2: Écrire le parcours** `parcours.spec.ts` :
  - **Préparation** : créer le compte via l'émulateur Auth (`POST http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo`).
  - **Connexion**, puis création du cocktail « Mojito » (Les deux, « Nojito ») depuis l'onglet Cocktails.
  - **« Nouvelle presta »** : client « Julie Martin », Mojito coché, « Commencer la presta ».
  - **Comptage** : 3 taps sur « Mojito », 1 sur « Nojito », 1 « − » sur « Mojito ».
  - **Fin** : « Terminer ».
  - **Vérifications** :
    - les résultats affichent Mojito `2` et Nojito `1` ;
    - au retour sur l'accueil, la presta est dans « Terminées » avec « 3 servis ».
  - **Second test, `les noms longs ne débordent pas en portrait`** : viewport 390×844, un cocktail « Moscow Mule Gingembre Royal ». Sur l'écran de comptage, le `scrollWidth` du nom ne dépasse pas son `clientWidth`.
- [ ] **Step 3: Lancer `npm run test:e2e`** — attendu : PASS (2 tests).
- [ ] **Step 4: Écrire `docs/recette-ipad.md`** — reprendre la recette manuelle de la spec §9 en check-list cochable, plus le contrôle visuel paysage / portrait comparé à la maquette v5.
- [ ] **Step 5: Compléter `README.md`** : section « Mise en service » reprenant spec §10, avec ces précisions :
  - **Configuration** : renseigner `.env.local` avec la configuration web du projet Firebase, et `.firebaserc` avec son identifiant.
  - **Déploiement** : `npm run build && npx firebase deploy`.
  - **Compte du barman** : création dans la console Firebase, onglet Authentication.
- [ ] **Step 6: Lancer toute la suite** : `npm run typecheck && npm test && npm run test:data && npm run test:e2e` — attendu : tout PASS.
- [ ] **Step 7: Commit** — `git commit -m "test: parcours de bout en bout, recette et mise en service"`
