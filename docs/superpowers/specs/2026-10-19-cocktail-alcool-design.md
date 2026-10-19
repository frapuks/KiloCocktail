# Un cocktail = une version (avec ou sans alcool)

Date : 2026-10-19

## Objectif

Simplifier la gestion des cocktails avec et sans alcool. Un cocktail qui existe dans les deux versions devient **deux cocktails distincts** dans le catalogue (ex. « Mojito » et « Nojito », ou deux « Moscow Mule »). Chaque cocktail porte un booléen `alcool`.

## Décisions

- **Unicité par couple (nom, alcool).** Deux cocktails peuvent porter le même nom s'ils diffèrent par `alcool`. La règle s'applique à la création **et** à la modification : passer « Mojito » avec alcool en sans alcool échoue si un « Mojito » sans alcool existe déjà (actif ou archivé).
- **`alcool` reste modifiable et tout suit.** Le groupe d'une ligne de presta se lit sur `cocktail.alcool` ; changer le booléen déplace le cocktail de groupe dans toutes les prestas, passées comprises. Ce changement est vu comme une correction de saisie.
- **Pas de migration.** Firebase n'est pas encore en production ; seul le script de remplissage des émulateurs est mis à jour.

## Modèle de données

`src/domain/types.ts` :

```ts
export type Variante = 'avec' | 'sans'; // groupe d'affichage, dérivé de cocktail.alcool
export interface Cocktail { id: string; nom: string; nomNormalise: string; alcool: boolean; archive: boolean }
export interface Ligne { id: string; cocktailId: string; masquee: boolean }
```

- Supprimés : le type `Variantes`, `Cocktail.variantes`, `Cocktail.nomSansAlcool`, `Ligne.variante`.
- `DonneesCocktail` (`src/data/depots.ts`) devient `{ nom: string; alcool: boolean }`.
- Dépôt Firestore des cocktails : écrit `nom`, `nomNormalise`, `alcool`.
- Règles Firestore : inchangées (cocktails et prestas ne sont pas validés champ par champ).
- Les anciennes lignes contenant `variante` sont tolérées : le champ est ignoré et disparaît à la prochaine écriture de la presta.

## Domaine

### `noms.ts`

- `trouverDoublon` reste générique pour les types d'événement (nom seul).
- Nouvelle recherche de doublon pour les cocktails : même `nomNormalise` **et** même `alcool`, en excluant l'id en cours de modification.
- Le message de doublon d'un cocktail précise la version : « Un cocktail “Mojito” sans alcool existe déjà » (et la variante « … dans les archivés. Désarchive-le plutôt. »).

### `lignes.ts`

- `varianteDe(cocktail): Variante` — `'avec'` si `alcool`, sinon `'sans'`.
- `groupes(lignes, cocktails, options)` — répartit selon `cocktail.alcool` ; une ligne dont le cocktail est introuvable est ignorée.
- `deplacerDansGroupe(lignes, cocktails, variante, de, vers)` — même logique de groupe.
- `basculerCocktail(lignes, cocktail, genId)` — ajoute ou retire **une** ligne.
- `optionsAbsentes(cocktails, lignes): Cocktail[]` — cocktails actifs absents de la carte, triés par nom puis avec alcool avant sans alcool.
- Supprimés : `variantesDisponibles`, `basculerVariante`.

### `affichage.ts`

- `nomLigne(cocktail)` → `{ nom: cocktail.nom, sousTitre: cocktail.alcool ? null : 'sans alcool' }`.

## Écrans

- **Fiche cocktail** : deux boutons radio « Avec alcool » / « Sans alcool » (défaut : avec). Plus de champ « Nom de la version sans alcool ». Erreur de doublon à l'enregistrement, création comme modification.
- **Catalogue** : une ligne par cocktail, une seule pastille (« Avec alcool » ou « Sans alcool »). Tri par nom puis avec avant sans. Dans les archivés, « · sans alcool » suit le nom des cocktails sans alcool.
- **Formulaire de presta (sélecteur)** : une case à cocher par cocktail avec sa pastille ; plus de boutons « Avec / Sans alcool » par ligne. Un cocktail créé depuis le formulaire ajoute une seule ligne.
- **Sur la carte, comptage, résultats** : rendu inchangé (bandes « Avec alcool » / « Sans alcool », sous-titre « sans alcool »), groupement via `cocktail.alcool`. Le dialogue de retrait garde « Retirer Mojito (sans alcool) ? ».
- **Accessibilité** : l'`aria-label` des cartes de comptage inclut « sans alcool » pour les cocktails sans alcool (point repris du backlog, à retirer de `docs/backlog-apres-mvp.md`).

## Données de démo

`scripts/remplir-emulateurs.ts` : chaque cocktail « les deux » devient deux documents (`mojito` / `nojito`, `moscow-mule` / `moscow-mule-sans-alcool`, etc.) ; les lignes des prestas de démo pointent vers le bon document.

## Tests

- Adapter toutes les données de test au nouveau modèle.
- Nouveaux cas :
  - doublon (nom, alcool) refusé en création et en modification, y compris le passage avec → sans alcool face à un homonyme sans alcool existant (actif ou archivé) ;
  - deux homonymes acceptés s'ils diffèrent par `alcool` ;
  - `groupes` et `deplacerDansGroupe` lisent `cocktail.alcool` ;
  - une ligne change de groupe quand le booléen de son cocktail change.
- Adapter le test du dépôt sur émulateur (`tests/data/cocktails.test.ts`) et le parcours e2e.

## Hors périmètre

- Lien entre les deux versions d'un même cocktail (aucun : ce sont deux cocktails indépendants).
- Migration de données existantes.
