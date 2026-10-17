# KiloCocktail — Spécification de conception (MVP)

- **Date** : 2026-10-17
- **Statut** : en relecture
- **Maquette de référence de l'écran de comptage** : https://claude.ai/artifact/4CpJ7k3LCPJA8EAUhnfUwg (version 5, jetable : aucun code n'en est repris)
- **Sources** : [journal du brainstorming](../../brainstorming-etat.md)

## 1. Contexte et objectif

Un ami barman à domicile anime des événements (anniversaires, soirées d'entreprise…). Il propose une carte d'environ 4 cocktails, qui varie d'un événement à l'autre ; environ 2 existent aussi en version sans alcool. Aujourd'hui il compte les cocktails servis sur papier, puis reporte les totaux dans son fichier Excel.

KiloCocktail remplace le papier :
- **pendant l'événement** : un tap sur le cocktail commandé l'ajoute au comptage, avec un retour visuel sans ambiguïté ;
- **après l'événement** : un écran de résultats qu'il recopie dans son Excel.

**Critères de succès**
- Il compte toute une soirée sans jamais hésiter sur ce qu'il vient de taper.
- Aucun comptage n'est perdu : ni par une coupure réseau, ni par la perte de l'iPad (sauvegarde serveur), ni par une fausse manipulation (confirmations).
- Si l'iPad lâche en pleine soirée, il reprend sur son téléphone avec les chiffres à jour (si le réseau était disponible).
- Les résultats se recopient dans l'Excel de haut en bas, sans réflexion.

## 2. Périmètre

**Dans le MVP** : connexion, liste des prestas, création et modification d'une presta, écran de comptage, résultats, catalogue de cocktails, types d'événement, fonctionnement hors ligne avec synchronisation, sauvegarde serveur.

**Hors périmètre** : prix et facturation, statistiques, export (Excel, PDF, CSV), plusieurs utilisateurs ou comptes, inscription, code PIN ou mode verrouillé, gestion de la mise en veille de l'écran, boutons ×2/×3, recherche ou filtres dans les prestas, photos de cocktails, recettes, autre langue que le français.

## 3. Utilisateur et contraintes

- **Un seul utilisateur** : le barman, un seul compte, créé par le développeur dans la console Firebase.
- **Appareil principal** : iPad Air 5e génération, surtout en **paysage** sur un support, parfois en **portrait** posé à plat.
- **Appareil de secours** : son téléphone. Il n'utilise normalement pas deux appareils en même temps.
- **Réseau** : il est en principe toujours connecté, mais l'appli doit tenir une soirée entière hors ligne sans rien perdre.
- **Volume** : environ 100 cocktails servis sur une grosse soirée, quelques dizaines de prestas par an.
- **Couleurs imposées** : fond `#323232`, cases avec alcool `#408533`. Cases sans alcool : vert-gris « sauge » `#5d7656`.

## 4. Concepts et règles métier

| Concept | Définition |
|---|---|
| **Cocktail** | Fiche du catalogue : un nom, des variantes (`avec` uniquement, `sans` uniquement, ou `les-deux`), et pour `les-deux` un nom optionnel de la version sans alcool (ex. « Nojito »). |
| **Type d'événement** | Libellé géré par le barman (« Anniversaire », « Soirée d'entreprise » au départ). |
| **Presta** | Un événement : date, client (optionnel), type (optionnel), statut (`en-cours` ou `terminee`) et une liste ordonnée de **lignes**. |
| **Ligne** | Un cocktail dans une variante (avec ou sans alcool) proposé dans une presta. Elle correspond à une case de l'écran de comptage. Elle peut être **masquée**. |
| **Verre servi** | Un événement enregistré à chaque tap. Le total d'une ligne est son nombre de verres servis. |

**Règles**
- **Noms liés** : renommer un cocktail, son nom sans alcool ou un type s'applique à toutes les prestas, passées comprises. Pour changer de recette, on archive le cocktail et on en crée un nouveau.
- **Archivage, jamais de suppression** pour les cocktails et les types. Un élément archivé n'est plus proposé pour les nouvelles prestas, reste affiché dans les prestas qui l'utilisent, et peut être désarchivé.
- **Changer les variantes d'un cocktail** au catalogue ne modifie pas les lignes des prestas existantes ; cela ne joue que sur les sélections futures.
- **Nom affiché d'une ligne** : pour la variante avec alcool, le nom du cocktail. Pour la variante sans alcool, le nom sans alcool s'il existe, sinon le nom du cocktail ; dans les deux cas, accompagné du sous-titre « sans alcool ».
- **Nom affiché d'une presta** : le client, ou « Presta du JJ/MM/AAAA » si le client est vide.
- **Doublons refusés** : deux cocktails (ou deux types) ne peuvent pas avoir le même nom normalisé, archivés compris. Normalisation : espaces retirés en début et fin, espaces multiples réduits à un, minuscules, accents retirés (« Caïpirinha » = « caipirinha »).
- **Ordre des lignes** : les lignes sont réparties en deux groupes (avec alcool, sans alcool). Dans chaque groupe, l'ordre est celui de la liste, réordonnable. Un ajout se place à la fin de son groupe.
- **Un total ne descend jamais sous 0.**

## 5. Écrans

### 5.1 Navigation

Barre d'onglets en bas avec 3 onglets : **Prestas**, **Cocktails**, **Réglages**. Elle est **masquée sur l'écran de comptage**, pour laisser toute la hauteur aux cases et éviter qu'un tap sur une case du bas ne quitte le comptage. Elle est aussi masquée sur « Nouvelle presta » et « Modifier une presta », qui se quittent par leurs propres boutons (Annuler / Enregistrer / Commencer). Elle reste visible partout ailleurs, y compris sur les résultats.

### 5.2 Connexion

- Champs e-mail et mot de passe, bouton « Se connecter ».
- Erreurs : « E-mail ou mot de passe incorrect », « Pas de connexion internet, réessaie dans un instant ».
- Lien « Mot de passe oublié » : envoi d'un e-mail de réinitialisation (fourni par Firebase Auth).
- Pas d'inscription. La session reste ouverte : l'écran n'est revu qu'après « Se déconnecter ».

### 5.3 Onglet Prestas (accueil)

- Bouton principal **« Nouvelle presta »** en haut.
- Section **« En cours »** : une carte par presta en cours, avec le nom affiché, le type, la date et le total servi (« 39 servis »). Un tap ouvre l'écran de comptage.
- Section **« Terminées »** : liste triée de la plus récente à la plus ancienne, mêmes informations. Un tap ouvre les résultats en lecture seule.
- Les deux sections sont triées par date décroissante.
- Sans réseau, le total servi affiche « — » (voir §7.3).
- Pas de message particulier quand il n'y a encore aucune presta.

### 5.4 Nouvelle presta

De haut en bas :
- **Date** : aujourd'hui par défaut, modifiable.
- **Client** : texte, optionnel.
- **Type** : liste des types actifs, avec « + Ajouter un type » en fin de liste pour en créer un sans quitter l'écran. Optionnel.
- **Cocktails** : les cocktails actifs du catalogue, par ordre alphabétique. Chaque ligne affiche le nom et des pastilles pour les variantes qui existent ([Avec alcool] [Sans alcool]).
  - Cocher un cocktail active toutes ses variantes ; chaque pastille peut ensuite être éteinte. Éteindre toutes les pastilles décoche le cocktail.
  - « + Créer un cocktail » en bas de la liste ouvre le même formulaire que la fiche cocktail (§5.8). Le cocktail créé est ajouté au catalogue et coché.
- **Sur la carte** : les lignes sélectionnées, en deux groupes « Avec alcool » et « Sans alcool », réordonnables par glisser-déposer avec une poignée ≡. Une ligne nouvellement cochée s'ajoute à la fin de son groupe.
- **« Commencer la presta »**, toujours actif (une presta peut démarrer sans cocktail) : crée la presta et ouvre l'écran de comptage.
- **« Annuler »** : retour à l'accueil sans rien créer.

### 5.5 Écran de comptage

**En-tête**
- Bouton retour **« ← Prestas »**.
- Nom affiché de la presta, puis type et date (ex. « Anniversaire · samedi 17/10/2026 »).
- Indicateur discret de sauvegarde : « Sauvegardé », ou « Hors connexion · N en attente » (voir §7.2).
- Actions : **Modifier**, **Résultats**, **Terminer**.

**Cases**
- Deux groupes dans cet ordre, chacun avec son libellé : **Avec alcool** (cases `#408533`), puis **Sans alcool** (cases `#5d7656`). Un groupe vide n'est pas affiché. Les lignes masquées ne sont pas affichées.
- Cartes allongées : **2 colonnes en paysage, 1 en portrait**. Jusqu'à 8 cases tiennent sans défilement en paysage ; au-delà, l'écran défile.
- Disposition d'une carte (« Sous le nom ») :
  - à gauche, le **nom** en grand, le **sous-titre « sans alcool »** uniquement pour les cases sans alcool, puis le total en texte simple : icône de verre, le nombre, « servi » (0 ou 1) ou « servis » (2 et plus) ;
  - à droite, un **grand indicateur « +N »**, dont la place est réservée pour que rien ne bouge quand il apparaît ;
  - dans le coin en bas à droite, un **bouton « − » discret**, inactif quand le total vaut 0.
- Le nom est l'information principale, puis l'indicateur « +N », puis le total.

**Interactions**
- **Tap n'importe où sur la carte (hors bouton −) : +1 immédiat**, déclenché dès que le doigt touche l'écran. **Aucun anti-rebond** : chaque tap compte, même très rapprochés.
- À chaque tap, la carte flashe brièvement dans une teinte plus claire, le total se met à jour avec un petit effet de rebond, et l'indicateur affiche « +1 ».
- **Cumul** : chaque nouveau tap sur la même carte, tant que l'indicateur est visible, l'incrémente (« +2 », « +3 »…). L'indicateur disparaît **1,3 s** après le dernier tap sur cette carte, et le cumul repart de zéro. Chaque carte a son propre cumul.
- **Bouton − : retire 1**. La carte s'assombrit brièvement et l'indicateur affiche « −1 » dans une couleur distincte (orange `#e0ad4a`). Des « − » répétés cumulent (« −2 », « −3 »…) selon la même règle de 1,3 s. Un tap sur la carte après un « − » repart à « +1 », et inversement.
- Le bouton − ne peut pas être déclenché par un tap sur la carte, ni la carte par un tap sur le bouton −.
- Neutralisés sur tout l'écran : zoom au double tap, sélection de texte, menu contextuel à l'appui long.
- Animations réduites à un simple changement d'état si l'appareil demande moins d'animations (`prefers-reduced-motion`).

**Presta sans aucune ligne visible** : un message invite à ajouter des cocktails via « Modifier ».

### 5.6 Modifier une presta

Accessible depuis l'écran de comptage et depuis les résultats d'une presta terminée.
- **Date, client, type** : préremplis, mêmes règles qu'à la création.
- **Sur la carte** : les lignes actives en deux groupes, réordonnables par glisser-déposer (poignée ≡). Chaque ligne affiche son total et un bouton **« Retirer »** :
  - total à 0 : la ligne est retirée directement ;
  - total supérieur à 0 : choix entre **« Masquer du comptage (garder les N servis) »**, **« Supprimer avec ses N servis »** et **« Annuler »**.
- **Masquées** (section présente seulement s'il y en a) : chaque ligne masquée avec son total et un bouton **« Réafficher »**, qui la remet à la fin de son groupe.
- **« + Ajouter »** : ouvre la liste de sélection de la création (§5.4), limitée aux cocktails et variantes absents de la presta (ni actifs, ni masqués), avec « + Créer un cocktail ». Les ajouts se placent à la fin de leur groupe.
- **« Enregistrer »** applique toutes les modifications d'un coup, y compris les suppressions de verres choisies. **« Annuler »** les abandonne, après confirmation s'il y a des modifications non enregistrées.
- **« Supprimer la presta »**, en bas et séparé du reste : confirmation « Supprimer “{nom affiché}” et ses N cocktails servis ? ». La suppression est définitive, sur l'appareil et sur le serveur, puis retour à l'accueil.

### 5.7 Résultats et fin de presta

**Résultats** (accessibles à tout moment depuis le comptage)
- Badge de statut : « En cours » ou « Terminée · lecture seule ».
- **Date, client, type**, puis **une ligne par ligne de presta** avec son total : groupe Avec alcool puis groupe Sans alcool, dans l'ordre de l'écran de comptage, **lignes masquées comprises**. Un type ou un client vide s'affiche « — ».
- Pour une presta en cours : bouton « Retour au comptage ».

**Terminer**
- Passe la presta au statut `terminee` et affiche ses résultats en lecture seule.
- Depuis les résultats d'une presta terminée : **« Modifier »** (§5.6) et **« Reprendre le comptage »** (repasse au statut `en-cours` et ouvre l'écran de comptage).

### 5.8 Onglet Cocktails (catalogue)

- Liste des cocktails actifs par ordre alphabétique : nom, pastilles des variantes, nom sans alcool le cas échéant (« → Nojito »).
- Bouton **« + Nouveau cocktail »**.
- **Fiche cocktail** (création et modification) :
  - **Nom** (obligatoire).
  - **Variantes**, boutons radio : « Avec alcool uniquement » (par défaut), « Sans alcool uniquement », « Les deux ».
  - **Nom de la version sans alcool** : optionnel, affiché seulement pour « Les deux ».
  - Lors d'une modification du nom : rappel « Le nouveau nom s'affichera aussi dans les prestas passées. »
  - Boutons « Enregistrer », « Annuler », et « Archiver » (en modification).
- Erreurs : nom vide (« Donne un nom au cocktail ») ; doublon (« Un cocktail “Mojito” existe déjà » ou, s'il est archivé, « …existe déjà dans les archivés. Désarchive-le plutôt. »).
- Section **« Archivés »** repliée en bas, avec « Désarchiver » sur chaque ligne.

### 5.9 Onglet Réglages

- **Types d'événement** : liste des types actifs, bouton « + Ajouter un type ». Un tap sur un type permet de le renommer (le nouveau nom s'applique partout) ou de l'archiver. Doublons refusés selon la même normalisation. Section « Archivés » repliée, avec « Désarchiver ».
- **Compte** : e-mail connecté, bouton **« Se déconnecter »** (voir §8).

## 6. Architecture technique

**Briques**
- **PWA** React + Vite + TypeScript, installable sur l'écran d'accueil via `vite-plugin-pwa` (manifest, service worker qui met l'appli en cache pour un lancement hors ligne).
- **Firebase** : Auth (e-mail et mot de passe), Firestore avec cache local persistant (`persistentLocalCache`), Hosting (HTTPS). Plan gratuit (Spark). Base Firestore en région Europe.
- **Bibliothèques** : React Router (navigation), dnd-kit (glisser-déposer tactile).

**Organisation du code** — chaque couche ne dépend que des couches inférieures :

```
src/
  domain/    logique pure, sans React ni Firebase : nom affiché d'une ligne et d'une presta,
             totaux, normalisation des noms, règles de retrait, réordonnancement, cumul +N/−N
  data/      interfaces des dépôts (cocktails, types, prestas, verres servis) et leur
             implémentation Firestore ; seule couche qui importe le SDK Firebase
  features/  un dossier par écran : connexion, prestas, presta-form, comptage, resultats,
             cocktails, reglages
  ui/        composants partagés : barre d'onglets, boutons, boîte de confirmation,
             liste réordonnable, indicateur de sauvegarde
```

- `domain/` se teste seul, sans navigateur ni base.
- `data/` isole Firebase : une migration future vers un autre serveur (le Raspberry Pi par exemple) ne demanderait qu'une nouvelle implémentation de ces interfaces.
- Les écrans de `features/` n'utilisent que les interfaces de `data/` et les fonctions de `domain/`.

**Fichiers à la racine** : `firebase.json`, `firestore.rules`, `firestore.indexes.json`, configuration Vite et PWA.

## 7. Données

### 7.1 Modèle Firestore

Toutes les données sont rangées sous le compte : `users/{uid}/…`.

```
users/{uid}/cocktails/{cocktailId}
  nom            string            "Mojito"
  nomNormalise   string            "mojito"
  variantes      "avec" | "sans" | "les-deux"
  nomSansAlcool  string | null     seulement si variantes = "les-deux"
  archive        boolean

users/{uid}/types/{typeId}
  nom            string            "Anniversaire"
  nomNormalise   string
  archive        boolean

users/{uid}/prestas/{prestaId}
  date           string            "2026-10-17" (date seule, sans fuseau horaire)
  client         string | null
  typeId         string | null
  statut         "en-cours" | "terminee"
  lignes         array de { id: string, cocktailId: string, variante: "avec" | "sans", masquee: boolean }
                 l'ordre du tableau donne l'ordre des cases dans chaque groupe

users/{uid}/prestas/{prestaId}/verres/{verreId}
  ligneId        string
  creeLe         number            horodatage de l'appareil (ms), sert à trouver le dernier verre
  horodatage     timestamp         heure serveur
  appareil       string            identifiant aléatoire de l'appareil, conservé en stockage local
```

- **Types de départ** : au premier lancement, si la collection `types` est vide, l'appli crée « Anniversaire » et « Soirée d'entreprise » avec des identifiants fixes (`anniversaire`, `soiree-entreprise`), pour qu'une double création soit sans effet.
- **Identifiants** générés sur l'appareil (`crypto.randomUUID()`) pour les verres et les lignes : une écriture renvoyée après une coupure réécrit le même document, donc un tap n'est jamais compté deux fois.

### 7.2 Opérations

| Action | Opération Firestore |
|---|---|
| Tap (+1) | Création d'un document `verres/{uuid}`. |
| Bouton − | Suppression du verre de la ligne ayant le `creeLe` le plus récent (lu dans le cache local, donc possible hors ligne). |
| Total d'une ligne | Nombre de documents `verres` de cette ligne, via une écoute en temps réel des verres de la presta ouverte. |
| Masquer une ligne | `masquee: true` dans `lignes`. |
| Supprimer une ligne avec ses verres | Dans un même lot d'écritures (`writeBatch`) : retrait de la ligne et suppression de ses verres. |
| Réordonner | Réécriture du tableau `lignes`. |
| Supprimer une presta | Suppression de ses verres, puis du document de la presta. |
| Total sur l'accueil | Comptage côté serveur (`getCountFromServer`) des verres de chaque presta. |

Aucune transaction n'est utilisée (elles échouent hors ligne) ; uniquement des écritures simples et des lots. Un lot Firestore étant limité à 500 opérations, les suppressions de verres sont découpées en lots successifs si nécessaire (rare : ~100 verres par soirée).

**Indicateur de sauvegarde** : l'écoute des verres de la presta ouverte inclut les métadonnées (`includeMetadataChanges`). L'indicateur affiche « Sauvegardé » quand aucune écriture n'est en attente, sinon « Hors connexion · N en attente », où N est le nombre de verres créés pas encore confirmés par le serveur. Si seules des suppressions sont en attente, il affiche « Hors connexion · modifications en attente ».

### 7.3 Hors ligne et synchronisation

- Toutes les écritures sont d'abord enregistrées dans la base locale de l'appareil (IndexedDB) et mises en file d'attente. La file survit à la fermeture de l'appli et au redémarrage de l'iPad, et se vide dès que l'appli est ouverte avec du réseau.
- **Fonctionne hors ligne** : compter, corriger, créer ou modifier une presta, terminer, consulter les résultats, gérer le catalogue et les types.
- **Ne fonctionne pas hors ligne** : le total servi sur l'accueil (affiche « — »), la première connexion sur un appareil, « Mot de passe oublié », la reprise sur un autre appareil des données pas encore synchronisées.
- **Conditions** : l'appli doit avoir été ouverte au moins une fois avec du réseau sur l'appareil (installation, connexion, catalogue en cache), et être installée sur l'écran d'accueil, sinon iOS peut effacer les données locales.
- **Continuité** : avec du réseau, un verre servi sur un appareil apparaît sur l'autre en environ une seconde.

### 7.4 Règles de sécurité

- Lecture et écriture sous `users/{uid}/**` autorisées uniquement si `request.auth.uid == uid`.
- Documents `verres` : seuls les champs `ligneId`, `creeLe`, `horodatage`, `appareil` sont acceptés.
- Tout le reste est refusé.

## 8. Gestion des erreurs

- **Sans réseau** : aucun message d'erreur ; l'indicateur de sauvegarde informe.
- **Écriture refusée par le serveur** (règles, session invalide) : bandeau « Une modification n'a pas pu être sauvegardée » ; l'écran se recale sur l'état réel des données.
- **« Se déconnecter » avec des écritures en attente** : l'appli attend jusqu'à 3 s leur confirmation (`waitForPendingWrites`). Si elles ne sont pas confirmées, la déconnexion est bloquée avec le message « Des cocktails ne sont pas encore sauvegardés. Reconnecte-toi à internet avant de te déconnecter. »
- **Première ouverture sans réseau sur un nouvel appareil** : « Connecte-toi à internet pour la première ouverture. »
- **Stockage** : au démarrage, l'appli demande un stockage persistant (`navigator.storage.persist()`).
- **Nouvelle version déployée** : bandeau « Nouvelle version disponible » avec un bouton « Recharger ». L'appli ne se recharge jamais d'elle-même.
- **Formulaires** : messages sous le champ concerné (nom vide, doublon).
- **Actions destructives** (retirer une ligne comptée, supprimer une presta, abandonner des modifications) : toujours une confirmation qui dit ce qui va se passer.

## 9. Tests

- **`domain/`** — tests unitaires Vitest, écrits avant le code (TDD) : nom affiché d'une ligne et d'une presta, totaux, normalisation et doublons, règles de retrait (0 / supérieur à 0), réordonnancement dans un groupe, ajout en fin de groupe, cumul « +N » / « −N » et son délai de 1,3 s (horloge simulée), pluriel « servi » / « servis ».
- **`data/`** — tests d'intégration sur l'émulateur Firebase local : création et lecture de chaque entité ; un verre écrit deux fois avec le même identifiant ne compte qu'une fois ; le − supprime le verre le plus récent de la bonne ligne ; suppression d'une ligne avec ses verres ; suppression d'une presta ; création idempotente des types de départ.
- **Règles de sécurité** — `@firebase/rules-unit-testing` : un autre compte ne peut ni lire ni écrire ; un verre avec des champs en trop est refusé.
- **`features/`** — React Testing Library : comptage (tap → +1, cumul, bouton − inactif à 0, groupes et sous-titre « sans alcool »), formulaire de presta (variantes cochées par défaut, les trois choix au retrait d'une ligne comptée, ajout en fin de groupe), fiche cocktail (boutons radio, champ nom sans alcool visible seulement pour « Les deux »).
- **Bout en bout** — un parcours Playwright dans le moteur WebKit contre l'émulateur : connexion, nouvelle presta, quelques taps, Terminer, résultats.
- **Recette manuelle sur un vrai iPad** : installation sur l'écran d'accueil ; soirée simulée en mode avion (taps, −, modification de la presta, fermeture et réouverture de l'appli) ; retour du réseau ; vérification que tout est arrivé et visible depuis un téléphone ; contrôle visuel en paysage et en portrait.

## 10. Mise en service

1. Créer le projet Firebase (plan Spark), activer Auth e-mail/mot de passe et Firestore (région Europe).
2. Créer le compte du barman dans la console Firebase.
3. Déployer l'appli, les règles et les index avec `firebase deploy`.
4. Sur l'iPad du barman : ouvrir l'URL dans Safari, « Ajouter à l'écran d'accueil », se connecter, saisir son catalogue.
5. Idem sur son téléphone, en secours.

## 11. À valider avec le barman lors de la démo du MVP

- Le nom optionnel de la version sans alcool (« Nojito »), sinon « Mojito » + « sans alcool ».
- Résultats avec une ligne par variante : hypothèse que son Excel a des colonnes séparées avec / sans alcool.
- L'indicateur de sauvegarde dans l'en-tête du comptage.
- « Reprendre le comptage » depuis une presta terminée.
- La teinte sauge des cases sans alcool.
