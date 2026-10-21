import { Route, Routes } from 'react-router-dom'
import type { Depots } from '../data/depots'
import { EcranCocktails } from '../features/cocktails/EcranCocktails'
import { EcranComptage } from '../features/comptage/EcranComptage'
import { EcranConnexion } from '../features/connexion/EcranConnexion'
import { EcranModifierPresta } from '../features/presta-form/EcranModifierPresta'
import { EcranNouvellePresta } from '../features/presta-form/EcranNouvellePresta'
import { EcranPrestas } from '../features/prestas/EcranPrestas'
import { EcranReglages } from '../features/reglages/EcranReglages'
import { EcranResultats } from '../features/resultats/EcranResultats'
import { AvecOnglets } from './AvecOnglets'
import { Bandeaux } from './Bandeaux'
import { RouteProtegee } from './RouteProtegee'

export function App({ fabriqueDepots }: { fabriqueDepots: (uid: string) => Depots }) {
  return (
    <>
      <Bandeaux />
      <Routes>
        <Route path="/connexion" element={<EcranConnexion />} />
        <Route element={<RouteProtegee fabriqueDepots={fabriqueDepots} />}>
          <Route element={<AvecOnglets />}>
            {/* Nouvelle presta : feuille par-dessus la liste, qui reste affichée derrière. */}
            {/* Résultats d'une presta terminée : feuille par-dessus la liste (jamais d'écran de comptage). */}
            <Route path="/" element={<EcranPrestas />}>
              <Route path="prestas/nouvelle" element={<EcranNouvellePresta />} />
              <Route path="prestas/:id/resultats" element={<EcranResultats />}>
                {/* Modifier une presta terminée sans la rouvrir : feuille par-dessus ses résultats. */}
                <Route path="modifier" element={<EcranModifierPresta />} />
              </Route>
            </Route>
            <Route path="/cocktails" element={<EcranCocktails />} />
            <Route path="/reglages" element={<EcranReglages />} />
          </Route>
          {/* Comptage d'une presta en cours ; « modifier » en route enfant : le comptage reste monté sous la feuille,
              sans clignoter. Ses résultats s'ouvrent en feuille depuis l'écran lui-même. */}
          <Route path="/prestas/:id" element={<EcranComptage />}>
            <Route path="modifier" element={<EcranModifierPresta />} />
          </Route>
        </Route>
      </Routes>
    </>
  )
}
