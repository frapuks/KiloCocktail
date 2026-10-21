# Backlog après le MVP

Points relevés pendant les revues de code du MVP, jugés non bloquants. À reprendre après la démo au barman.

## À vérifier pendant la recette iPad
- Un pincement à deux doigts sur l'écran de comptage peut annuler un tap (le navigateur envoie `pointercancel`). Vérifier qu'en usage réel ça n'arrive pas.
- Défilement par bande (avec / sans alcool) plutôt que de tout l'écran au-delà de 8 cases : vérifier que c'est acceptable.
- En ligne, des taps continus pendant plus de 2 s peuvent afficher brièvement « Hors connexion · N en attente ».

## Robustesse
- `CarteCocktail` : la référence du dernier pointeur n'est pas effacée au `pointerup` (cas d'un pointeur réutilisé : souris, Apple Pencil).
- « Modifier une presta » : « Annuler » / « Abandonner » restent actifs pendant l'enregistrement.
- `onSnapshot` sans fonction d'erreur dans les dépôts : un écran peut rester vide si une écoute échoue.
- `seDeconnecter` : minuteur jamais effacé (le rejet est maintenant affiché dans Réglages).
- Total servi des cartes de la liste (`compterServis`) : `getCountFromServer` ignore les verres encore en attente sur l'appareil ; sur réseau lent, la carte (et le total mémorisé) peut afficher moins que le comptage.
- Plusieurs appareils : la purge d'une ligne (« Supprimer avec ses N servis ») et la suppression d'une presta lisent les verres dans le cache local (choix assumé : marche hors connexion). Des verres comptés sur un autre appareil et pas encore reçus restent orphelins (invisibles ; le Total des résultats les ignore, mais pas le total de la carte de la liste).
- « Modifier une presta » : le brouillon est copié à l'ouverture et réécrit en entier à l'enregistrement ; une suppression de cocktail ou de type faite entre-temps ailleurs est écrasée (ligne ou typeId réapparaissent).
- Plusieurs appareils : retirer une ligne à 0 dans « Modifier » ne purge rien ; un verre servi entre-temps sur un autre appareil reste sans ligne. De même, la suppression d'un cocktail ne voit pas une ligne ajoutée ou un verre servi entre sa lecture et sa transaction.
- Suppression d'un cocktail : la confirmation (chiffrage) puis la suppression parcourent chacune toutes les prestas sur le serveur. Pistes : réutiliser le chiffrage, ou stocker les `cocktailIds` sur la presta pour une requête `array-contains`.
- Liste des prestas : chaque carte lance sa propre requête de comptage à chaque affichage (N requêtes par retour sur l'onglet). Piste : ne recompter que les prestas en cours, ou stocker le total sur la presta.
- `usePresta` / `useVerres` renvoient une fois les données de l'id précédent quand l'id change sans démontage.
- Pas de vérification périodique d'une nouvelle version (`registration.update()`) : le bandeau n'apparaît qu'au lancement ou à la navigation.
- L'authentification (`src/data/auth.ts`) n'est pas derrière une interface (migration vers le Pi).

## Tests à compléter
- Règles de sécurité : mise à jour d'un verre avec champ en trop, autre compte sur un verre, collections `types` / `prestas` ; `hasOnly` ne vérifie ni la présence ni le type des champs.
- `tests/` et `vitest.data.config.ts` ne sont couverts par aucun tsconfig (pas de typecheck des tests sur émulateur).
- Écrans : bouton « Fermer » du bandeau, e-mail vide pour « Mot de passe oublié », erreur de connexion « autre », barre d'onglets masquée sur `/prestas/nouvelle` et `/modifier`, « — » pendant le chargement du total de l'accueil, Escape / clic sur le fond des boîtes de dialogue, assertions de navigation plus strictes (nouvelle presta, déplacement).
- Mocks d'auth partagés non réinitialisés globalement (`mockReset`).

## Accessibilité et finitions
- Focus initial sur le bouton dangereux dans les confirmations ; pas de piège de focus ni d'autofocus dans les fiches.
- Couleurs en dur (`#323232`, `rgba(0,0,0,0.18)`) à remplacer par les jetons du thème.
- `key={libelle}` dans `Confirmation` ; message de succès en `role="alert"` ; badge de statut des résultats en simple `<p>`.
- Renommer un type sans changer le nom réécrit quand même.
- Favicon : le `.ico` généré n'est pas lié ; les polices `.woff` (anciennes) sont aussi précachées.
- README : scripts `lint` et `preview` non documentés.
- e2e : le bandeau d'avertissement de l'émulateur Auth est masqué par une feuille de style injectée (plus propre : `connectAuthEmulator(..., { disableWarnings: true })`) ; `reuseExistingServer` peut réutiliser un serveur de dev hors émulateurs.
