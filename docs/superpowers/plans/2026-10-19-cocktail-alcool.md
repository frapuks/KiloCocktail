# Un cocktail par version (avec ou sans alcool) — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer `variantes` / `nomSansAlcool` / `Ligne.variante` par un booléen `Cocktail.alcool` : une version avec et une version sans alcool sont deux cocktails distincts.

**Architecture:** Le groupe « Avec / Sans alcool » d'une ligne de presta n'est plus stocké : il se lit sur `cocktail.alcool` via les fonctions du domaine (`groupes`, `deplacerDansGroupe`, `varianteDe`), qui reçoivent désormais la liste des cocktails. L'unicité des cocktails porte sur le couple (nom normalisé, alcool).

**Tech Stack:** React 19, TypeScript, Vite, Vitest + Testing Library, Firestore (émulateurs), Playwright.

**Spec:** `docs/superpowers/specs/2026-10-19-cocktail-alcool-design.md`

## Global Constraints

- Libellés exacts : groupes « Avec alcool » / « Sans alcool » ; sous-titre « sans alcool » ; boutons radio de la fiche « Avec alcool » / « Sans alcool » (défaut : avec).
- Messages de doublon d'un cocktail : `Un cocktail “Mojito” sans alcool existe déjà` / `Un cocktail “Mojito” avec alcool existe déjà dans les archivés. Désarchive-le plutôt.`
- Les types d'événement gardent `trouverDoublon` / `messageDoublon` inchangés (unicité par nom seul).
- Pas de migration de données ; règles Firestore inchangées.
- Code, noms et tests en français, au style du fichier modifié (points-virgules dans `src/domain`, pas dans `src/features`).
- Le typecheck global (`npm run typecheck`) ne repasse au vert qu'à la fin de la tâche 5 : chaque tâche lance les tests Vitest de ses propres fichiers.
- Le dépôt contient des modifications non commitées dans des fichiers touchés ici (`EcranCocktails.tsx`, `CarteCocktail.tsx`, …) : elles doivent être commitées par l'utilisateur avant de commencer.

## Review Focus

- Modifier un cocktail sans rien changer alors que son homonyme de l'autre version existe → l'enregistrement est accepté (tâche 2).
- Une ligne dont le cocktail est introuvable, placée entre deux lignes d'un groupe → `deplacerDansGroupe` la laisse en place et réordonne correctement les autres (tâche 1).
- Un document cocktail sans champ `alcool` (données d'émulateur antérieures) → lu comme avec alcool (tâche 1).
- Deux homonymes sur la même carte de comptage → VoiceOver les distingue : cartes « Mojito » / « Mojito, sans alcool », boutons « Retirer un Mojito » / « Retirer un Mojito sans alcool » (tâche 4).
- Cocktail sans alcool créé depuis le formulaire de presta → une seule ligne, dans la liste « Sans alcool » (tâche 3).

---

### Task 1: Modèle, domaine et dépôt

**Files:**
- Modify: `src/domain/types.ts`, `src/domain/noms.ts`, `src/domain/lignes.ts`, `src/domain/affichage.ts`, `src/data/depots.ts`, `src/data/firestore/cocktails.ts`
- Test: `src/domain/noms.test.ts`, `src/domain/lignes.test.ts`, `src/domain/affichage.test.ts`, `tests/data/cocktails.test.ts`

**Interfaces:**
- Produces:
  - `Cocktail = { id; nom; nomNormalise; alcool: boolean; archive }` ; `Ligne = { id; cocktailId; masquee }` ; `Variante = 'avec' | 'sans'` conservé ; `Variantes` supprimé.
  - `DonneesCocktail = { nom: string; alcool: boolean }`.
  - `noms.ts` : `trouverDoublonCocktail(cocktails: Cocktail[], nom: string, alcool: boolean, idExclu?: string): Cocktail | null` ; `messageDoublonCocktail(doublon: Cocktail): string`.
  - `lignes.ts` : `varianteDe(c: Cocktail): Variante` ; `groupes(lignes: Ligne[], cocktails: Cocktail[], options?: { masquees?: boolean }): { avec: Ligne[]; sans: Ligne[] }` ; `basculerCocktail(lignes: Ligne[], c: Cocktail, genId: () => string): Ligne[]` ; `deplacerDansGroupe(lignes: Ligne[], cocktails: Cocktail[], variante: Variante, de: number, vers: number): Ligne[]` ; `optionsAbsentes(cocktails: Cocktail[], lignes: Ligne[]): Cocktail[]`. `variantesDisponibles` et `basculerVariante` supprimés ; `masquer`, `reafficher`, `retirer`, `typeRetrait` inchangés.
  - `affichage.ts` : `nomLigne(c: Cocktail): { nom: string; sousTitre: 'sans alcool' | null }` ; `comparerCocktails(a: Cocktail, b: Cocktail): number` (nom via `localeCompare('fr', { sensitivity: 'base' })`, puis avec alcool avant sans).

- [ ] **Step 1: Réécrire les tests du domaine**

Fixtures : `const mojito = { id: 'm', nom: 'Mojito', nomNormalise: 'mojito', alcool: true, archive: false }`, `nojito = { ...mojito, id: 'n', alcool: false }` (homonyme sans alcool), `mule = { id: 'u', nom: 'Moscow Mule', nomNormalise: 'moscow mule', alcool: true, archive: false }`, `spritz` archivé. Supprimer les tests de `variantesDisponibles` / `basculerVariante`. Cas à écrire :

```ts
// noms.test.ts
it('cherche un doublon de cocktail sur le couple (nom, alcool)', () => {
  expect(trouverDoublonCocktail([mojito], 'MOJITO', true)?.id).toBe('m');
  expect(trouverDoublonCocktail([mojito], 'Mojito', false)).toBeNull();
  expect(trouverDoublonCocktail([mojito, nojito], 'Mojito', false, 'm')?.id).toBe('n'); // passage avec → sans
  expect(trouverDoublonCocktail([mojito, nojito], 'Mojito', true, 'm')).toBeNull();     // rien changé
});
it('précise la version dans le message de doublon', () => {
  expect(messageDoublonCocktail(nojito)).toBe('Un cocktail “Mojito” sans alcool existe déjà');
  expect(messageDoublonCocktail({ ...mojito, archive: true })).toBe(
    'Un cocktail “Mojito” avec alcool existe déjà dans les archivés. Désarchive-le plutôt.');
});

// lignes.test.ts  (l = (id, cocktailId, masquee = false) => ({ id, cocktailId, masquee }))
it('range les lignes selon cocktail.alcool et ignore les cocktails introuvables', () => {
  const g = groupes([l('A', 'm'), l('S', 'n'), l('X', 'inconnu'), l('H', 'm', true)], [mojito, nojito]);
  expect(ids(g.avec)).toEqual(['A']); expect(ids(g.sans)).toEqual(['S']);
});
it('change le groupe d’une ligne quand le booléen du cocktail change', () => {
  expect(ids(groupes([l('A', 'm')], [{ ...mojito, alcool: false }]).sans)).toEqual(['A']);
});
it('déplace dans un groupe sans toucher l’autre ni les lignes orphelines', () => {
  const t = [l('A1', 'm'), l('S1', 'n'), l('X', 'inconnu'), l('A2', 'm'), l('A3', 'm')];
  expect(ids(deplacerDansGroupe(t, [mojito, nojito], 'avec', 2, 0))).toEqual(['A3', 'S1', 'X', 'A1', 'A2']);
});
it('coche et décoche un cocktail avec une seule ligne', () => {
  const t = basculerCocktail([], nojito, seq());
  expect(t).toEqual([{ id: 'id0', cocktailId: 'n', masquee: false }]);
  expect(basculerCocktail(t, nojito, seq())).toEqual([]);
});
it('propose les cocktails actifs absents, triés par nom puis avec avant sans', () => {
  expect(optionsAbsentes([spritz, nojito, mule, mojito], [l('L', 'u', true)])).toEqual([mojito, nojito]);
});

// affichage.test.ts
expect(nomLigne(mojito)).toEqual({ nom: 'Mojito', sousTitre: null });
expect(nomLigne(nojito)).toEqual({ nom: 'Mojito', sousTitre: 'sans alcool' });
expect([nojito, mule, mojito].sort(comparerCocktails)).toEqual([mojito, nojito, mule]);
```

Garder les tests existants de masquage, retrait, déplacement avec masquées (adapter les fixtures).

- [ ] **Step 2: Lancer les tests — échec attendu**

Run: `npx vitest run src/domain`
Expected: FAIL (`trouverDoublonCocktail`, `varianteDe`, `comparerCocktails` non exportés).

- [ ] **Step 3: Implémenter les types et le domaine**

Signatures de l'Interfaces block. `groupes` et `deplacerDansGroupe` construisent une `Map` id → cocktail ; une ligne sans cocktail n'appartient à aucun groupe. `optionsAbsentes` filtre les non archivés absents des lignes (masquées comprises) et trie avec `comparerCocktails`.

- [ ] **Step 4: Lancer les tests — succès attendu**

Run: `npx vitest run src/domain`
Expected: PASS

- [ ] **Step 5: Adapter le dépôt et son test sur émulateur**

`champs(d)` écrit `{ nom, nomNormalise, alcool }`. `ecouter` lit `alcool: data.alcool ?? true`. Dans `tests/data/cocktails.test.ts`, remplacer `variantes`/`nomSansAlcool` par `alcool` (le test de modification passe `{ nom: 'Môjito Royal', alcool: false }` et attend `alcool: false`) et ajouter :

```ts
it('lit un cocktail sans champ alcool comme avec alcool', async () => {
  // écrire directement { nom: 'Spritz', nomNormalise: 'spritz', archive: false } via setDoc sur colCocktails
  expect((await prochaineValeur(depot.ecouter))[0].alcool).toBe(true);
});
```

- [ ] **Step 6: Lancer le test du dépôt**

Run: `npm run test:data -- tests/data/cocktails.test.ts`
Expected: PASS (si la commande ne filtre pas, lancer `npm run test:data` et vérifier que `dépôt des cocktails` passe).

- [ ] **Step 7: Commit**

```bash
git add src/domain src/data/depots.ts src/data/firestore/cocktails.ts tests/data/cocktails.test.ts
git commit -m "refactor(domaine): un booléen alcool par cocktail, groupe dérivé du cocktail"
```

---

### Task 2: Fiche et catalogue des cocktails

**Files:**
- Modify: `src/features/cocktails/FicheCocktail.tsx`, `src/features/cocktails/EcranCocktails.tsx`
- Test: `src/features/cocktails/FicheCocktail.test.tsx`, `src/features/cocktails/EcranCocktails.test.tsx`

**Interfaces:**
- Consumes: `trouverDoublonCocktail`, `messageDoublonCocktail`, `comparerCocktails`, `DonneesCocktail` (tâche 1).

- [ ] **Step 1: Réécrire les tests**

```tsx
// FicheCocktail.test.tsx — mojito: alcool true ; nojito = { ...mojito, id: 'n', alcool: false }
it('sélectionne « Avec alcool » par défaut, sans champ de nom sans alcool', () => {
  monter()
  expect((screen.getByLabelText('Avec alcool') as HTMLInputElement).checked).toBe(true)
  expect(screen.queryByLabelText('Nom de la version sans alcool')).toBeNull()
})
it('enregistre un cocktail sans alcool', () => {
  const { onEnregistrer } = monter(); saisirNom('  Nojito '); fireEvent.click(screen.getByLabelText('Sans alcool')); enregistrer()
  expect(onEnregistrer).toHaveBeenCalledWith({ nom: 'Nojito', alcool: false })
})
it('accepte un homonyme de l’autre version', () => {
  const { onEnregistrer } = monter({ cocktails: [mojito] }); saisirNom('Mojito'); fireEvent.click(screen.getByLabelText('Sans alcool')); enregistrer()
  expect(onEnregistrer).toHaveBeenCalledWith({ nom: 'Mojito', alcool: false })
})
it('refuse de passer en sans alcool si l’homonyme sans alcool existe', () => {
  const { onEnregistrer } = monter({ cocktail: mojito, cocktails: [mojito, nojito] })
  fireEvent.click(screen.getByLabelText('Sans alcool')); enregistrer()
  expect(screen.getByRole('alert').textContent).toBe('Un cocktail “Mojito” sans alcool existe déjà')
  expect(onEnregistrer).not.toHaveBeenCalled()
})
it('signale un homonyme archivé de la même version', () => { /* cocktails: [{ ...nojito, archive: true }], création « Mojito » sans alcool → message « … sans alcool existe déjà dans les archivés. Désarchive-le plutôt. » */ })
it('enregistre sans changement alors que l’homonyme de l’autre version existe', () => {
  const { onEnregistrer } = monter({ cocktail: mojito, cocktails: [mojito, nojito] }); enregistrer()
  expect(onEnregistrer).toHaveBeenCalledWith({ nom: 'Mojito', alcool: true })
})

// EcranCocktails.test.tsx — cocktails : Mojito (avec), Mojito (sans), Spritz (avec), Vieux (sans, archivé)
// - chaque ligne active a exactement une pastille : getAllByText('Avec alcool') longueur 2, getAllByText('Sans alcool') longueur 1
// - ordre des lignes : Mojito (Avec alcool), Mojito (Sans alcool), Spritz
// - archivés : getByText('Vieux · sans alcool')
// - création / modification appellent creer / modifier avec { nom, alcool }
```

- [ ] **Step 2: Lancer les tests — échec attendu**

Run: `npx vitest run src/features/cocktails`
Expected: FAIL

- [ ] **Step 3: Implémenter**

Fiche : état `alcool: boolean` (défaut `cocktail?.alcool ?? true`), `<fieldset>` légende « Alcool » avec deux radios `name="alcool"`, suppression du champ nom sans alcool, doublon via `trouverDoublonCocktail(cocktails, nomPropre, alcool, cocktail?.id)` et `messageDoublonCocktail`. Catalogue : tri `comparerCocktails`, grille `1fr ${LARGEUR_COLONNE}px` avec une seule pastille (`var(--avec)` ou `var(--sans)`), plus de ligne « → nomSansAlcool » ; archivés affichent `${c.nom} · sans alcool` quand `!c.alcool`.

- [ ] **Step 4: Lancer les tests — succès attendu**

Run: `npx vitest run src/features/cocktails`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/cocktails
git commit -m "feat(cocktails): fiche et catalogue avec un booléen alcool"
```

---

### Task 3: Formulaires de presta

**Files:**
- Modify: `src/features/presta-form/SelecteurCocktails.tsx`, `SurLaCarte.tsx`, `EcranNouvellePresta.tsx`, `EcranModifierPresta.tsx`
- Test: `src/features/presta-form/SurLaCarte.test.tsx`, `EcranNouvellePresta.test.tsx`, `EcranModifierPresta.test.tsx`

**Interfaces:**
- Consumes: `groupes`, `deplacerDansGroupe`, `basculerCocktail`, `optionsAbsentes`, `nomLigne`, `varianteDe` (tâche 1).
- Produces: `SelecteurCocktails` prop `options: Cocktail[]` (au lieu de `{ cocktail; variantes }[]`). `SurLaCarte` garde `onDeplacer(variante, de, vers)` ; les écrans appellent `deplacerDansGroupe(lignes, cocktails, variante, de, vers)`.

- [ ] **Step 1: Adapter les tests**

Fixtures : `mojito` (avec) et `nojito = c('n', 'Nojito', { alcool: false })` remplacent `mojito` « les deux » ; les lignes perdent `variante`. Supprimer les tests des boutons « Avec / Sans alcool » par cocktail et de « variante déjà présente quand le cocktail est partiellement présent ». Cas à garantir :

```tsx
// EcranNouvellePresta.test.tsx
it('n’a plus de bouton de version par cocktail', () => {
  ecran(); expect(screen.queryByRole('button', { name: 'Sans alcool' })).toBeNull()
})
it('range un cocktail coché selon son booléen', () => {
  ecran(); fireEvent.click(screen.getByRole('checkbox', { name: /Nojito/ }))
  expect(carte('Sans alcool').getByText('Nojito')).toBeTruthy()
  expect(screen.queryByRole('list', { name: 'Avec alcool' })).toBeNull()
})
it('ajoute une seule ligne sans alcool pour un cocktail créé sans alcool', () => {
  // « + Créer un cocktail », nom « Virgin Mary », radio « Sans alcool », Enregistrer
  expect(depots.cocktails.creer).toHaveBeenCalledWith({ nom: 'Virgin Mary', alcool: false })
  expect(carte('Sans alcool').getAllByRole('listitem')).toHaveLength(1)
})

// EcranModifierPresta.test.tsx
it('nomme la version sans alcool dans le dialogue de retrait', () => {
  // ligne comptée de nojito → dialog 'Retirer Nojito (sans alcool) ?'
})
it('ajoute seulement les cocktails absents', () => {
  // la feuille d'ajout liste les cocktails actifs non présents, un par case à cocher
})

// SurLaCarte.test.tsx — groupes « Avec alcool » / « Sans alcool » selon cocktail.alcool ; sous-titre « sans alcool » sous Nojito.
```

- [ ] **Step 2: Lancer les tests — échec attendu**

Run: `npx vitest run src/features/presta-form`
Expected: FAIL

- [ ] **Step 3: Implémenter**

`SelecteurCocktails` : une `<li>` par cocktail avec une case à cocher dont le `<label>` contient le nom puis une pastille « Avec alcool » / « Sans alcool » (couleur `var(--avec)` / `var(--sans)`, style des pastilles du catalogue) ; suppression des boutons de version et de `LIBELLES`. Création : `basculerCocktail(lignes, cree, genId)`. `SurLaCarte` : `groupes(lignes, cocktails)`, `nomLigne(cocktail)`. Écrans : `optionsAbsentes(...)` passé tel quel, `deplacerDansGroupe` avec `cocktails`, `nomLigne(cocktail)` dans le dialogue de retrait et la liste des masquées.

- [ ] **Step 4: Lancer les tests — succès attendu**

Run: `npx vitest run src/features/presta-form src/ui`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/presta-form
git commit -m "feat(presta): une case par cocktail, groupe lu sur le booléen alcool"
```

---

### Task 4: Comptage et résultats

**Files:**
- Modify: `src/features/comptage/EcranComptage.tsx`, `src/features/comptage/CarteCocktail.tsx`, `src/features/resultats/EcranResultats.tsx`, `docs/backlog-apres-mvp.md`
- Test: `src/features/comptage/EcranComptage.test.tsx`, `src/features/comptage/CarteCocktail.test.tsx`, `src/features/resultats/EcranResultats.test.tsx`

**Interfaces:**
- Consumes: `groupes`, `varianteDe`, `nomLigne` (tâche 1).

- [ ] **Step 1: Adapter les tests**

Fixtures : `c1 = Mojito (avec)`, `c2 = Mojito (sans)` (homonymes), `c3 = Vieux (avec, archivé)` ; lignes sans `variante`. Assertions :

```tsx
// EcranComptage.test.tsx
expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['Avec alcool', 'Sans alcool'])
expect(cartes.map((c) => c.getAttribute('aria-label'))).toEqual(['Mojito', 'Vieux', 'Mojito, sans alcool'])
expect(screen.getByRole('button', { name: 'Retirer un Mojito sans alcool' })).toBeInTheDocument()

// CarteCocktail.test.tsx
// <CarteCocktail nom="Mojito" sousTitre="sans alcool" …/> → button 'Mojito, sans alcool' et 'Retirer un Mojito sans alcool'
// sans sous-titre → 'Mojito' et 'Retirer un Mojito' (inchangé)

// EcranResultats.test.tsx — mêmes fixtures : la ligne de c2 apparaît sous « Sans alcool » avec le texte
// 'Mojito' + 'sans alcool' + son total ; l'ancienne ligne masquée « c1 sans » est retirée des fixtures.
```

- [ ] **Step 2: Lancer les tests — échec attendu**

Run: `npx vitest run src/features/comptage src/features/resultats`
Expected: FAIL

- [ ] **Step 3: Implémenter**

Comptage : `groupes(presta.lignes, cocktails)`, `nomLigne(c)`. `CarteCocktail` : `aria-label` = `sousTitre ? `${nom}, ${sousTitre}` : nom` ; libellé du bouton moins = `Retirer un ${nom}` suivi de ` ${sousTitre}` s'il existe. Résultats : filtrer par `varianteDe(c) === variante` (ou `groupes(presta.lignes, cocktails)` avec et sans masquées, en conservant l'ordre actuel des lignes). Retirer de `docs/backlog-apres-mvp.md` la ligne « `aria-label` des cartes de comptage sans « sans alcool » ».

- [ ] **Step 4: Lancer les tests — succès attendu**

Run: `npx vitest run src/features/comptage src/features/resultats`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/comptage src/features/resultats docs/backlog-apres-mvp.md
git commit -m "feat(comptage): groupes lus sur le booléen alcool, cartes sans alcool nommées pour VoiceOver"
```

---

### Task 5: Données de démo, e2e et vérification complète

**Files:**
- Modify: `scripts/remplir-emulateurs.ts`, `tests/e2e/parcours.spec.ts`

**Interfaces:**
- Consumes: `Cocktail`, `Ligne` (tâche 1) ; libellés de la fiche (tâche 2) ; `aria-label` des cartes (tâche 4).

- [ ] **Step 1: Script de démo**

`COCKTAILS: { id; nom; alcool: boolean; archive? }[]`. Chaque entrée `'les-deux'` devient deux : `mojito` / `nojito` (« Nojito »), `pina-colada` / `virgin-colada` (« Virgin Colada »), `moscow-mule` / `moscow-mule-sans-alcool` (« Moscow Mule »), `daiquiri` / `virgin-daiquiri` (« Virgin Daïquiri »), `sex-on-the-beach` / `safe-sex-on-the-beach` (« Safe Sex on the Beach »), `tequila-sunrise` / `sunrise` (« Sunrise »). `'avec'` → `alcool: true`, `'sans'` → `alcool: false`. `PrestaDemo.cocktails` devient `string[]` : une entrée sans `variantes` d'un cocktail « les deux » devient ses deux ids ; `variantes: ['sans']` devient l'id sans alcool, `['avec']` l'id avec alcool. Les lignes s'écrivent `{ id, cocktailId, masquee: false }` ; supprimer `variantesDe`.

- [ ] **Step 2: Parcours e2e**

`creerCocktail(page, nom, alcool = true)` coche `getByLabel('Sans alcool')` quand `alcool` est faux. `demarrerPresta(page, client, cocktails: string[])` coche chaque `getByRole('checkbox', { name: new RegExp(nom) })`. Le parcours crée `Mojito` puis `Nojito` sans alcool, démarre la presta avec les deux, et vise la carte `getByRole('button', { name: 'Nojito, sans alcool', exact: true })`. Les attentes de résultats (2 Mojito, 1 Nojito, « 3 servis ») sont inchangées ; le test « noms longs » passe `[nom]`.

- [ ] **Step 3: Vérification complète**

Run: `npm run typecheck && npm run lint && npm test`
Expected: aucune erreur, tous les tests passent.

Run: `npm run test:data` puis `npm run test:e2e`
Expected: PASS

Run: `npm run emulateurs` (dans un autre terminal) puis `npm run remplir`
Expected: le script se termine sans erreur.

- [ ] **Step 4: Commit**

```bash
git add scripts/remplir-emulateurs.ts tests/e2e/parcours.spec.ts
git commit -m "chore(demo,e2e): cocktails avec et sans alcool en documents distincts"
```
