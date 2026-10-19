# Backlog après le MVP

Points relevés pendant les revues de code du MVP, jugés non bloquants. À reprendre après la démo au barman.

## À vérifier pendant la recette iPad
- Un pincement à deux doigts sur l'écran de comptage peut annuler un tap (le navigateur envoie `pointercancel`). Vérifier qu'en usage réel ça n'arrive pas.
- Défilement par bande (avec / sans alcool) plutôt que de tout l'écran au-delà de 8 cases : vérifier que c'est acceptable.
- En ligne, des taps continus pendant plus de 2 s peuvent afficher brièvement « Hors connexion · N en attente ».

## Robustesse
- `CarteCocktail` : la référence du dernier pointeur n'est pas effacée au `pointerup` (cas d'un pointeur réutilisé : souris, Apple Pencil).
- « Modifier une presta » : « Annuler » / « Abandonner » restent actifs pendant l'enregistrement.
- Suppressions en attente lancées par une purge (« Supprimer avec ses N servis ») hors ligne : l'indicateur du comptage ne les signale pas (seul le « − » est suivi).
- `onSnapshot` sans fonction d'erreur dans les dépôts : un écran peut rester vide si une écoute échoue.
- `seDeconnecter` : minuteur jamais effacé, rejet tardif non traité.
- `initialiserSiVide` (types de départ) pourrait réécrire les types si la première lecture se fait sur un cache vide hors ligne.
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
- Barre d'onglets : aucun onglet actif sur les résultats d'une presta.
- Couleurs en dur (`#323232`, `rgba(0,0,0,0.18)`) à remplacer par les jetons du thème.
- `key={libelle}` dans `Confirmation` ; message de succès en `role="alert"` ; badge de statut des résultats en simple `<p>`.
- Renommer un type sans changer le nom réécrit quand même.
- Favicon : le `.ico` généré n'est pas lié ; les polices `.woff` (anciennes) sont aussi précachées.
- README : scripts `lint` et `preview` non documentés.
- e2e : le bandeau d'avertissement de l'émulateur Auth est masqué par une feuille de style injectée (plus propre : `connectAuthEmulator(..., { disableWarnings: true })`) ; `reuseExistingServer` peut réutiliser un serveur de dev hors émulateurs.
