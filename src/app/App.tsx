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
            <Route path="/" element={<EcranPrestas />} />
            <Route path="/prestas/:id/resultats" element={<EcranResultats />} />
            <Route path="/cocktails" element={<EcranCocktails />} />
            <Route path="/reglages" element={<EcranReglages />} />
          </Route>
          <Route path="/prestas/nouvelle" element={<EcranNouvellePresta />} />
          <Route path="/prestas/:id" element={<EcranComptage />} />
          <Route path="/prestas/:id/modifier" element={<EcranModifierPresta />} />
        </Route>
      </Routes>
    </>
  )
}
