import { render, type RenderResult } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { App } from '../app/App'
import { ecouterUtilisateur, type Utilisateur } from '../data/auth'
import type { Depots } from '../data/depots'
import { DepotsProvider } from '../data/DepotsContext'

export function rendre(
  ui: ReactElement,
  { depots, route = '/' }: { depots: Depots; route?: string },
): RenderResult {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <DepotsProvider depots={depots}>{ui}</DepotsProvider>
    </MemoryRouter>,
  )
}

/**
 * Rend App avec un utilisateur simulé. Chaque fichier de test qui l'utilise DOIT mocker
 * le module d'authentification avec une fabrique (vi.mock est hissé par fichier), pour ne
 * jamais charger firebase.ts sous jsdom :
 *
 *   vi.mock('../data/auth', () => ({
 *     ecouterUtilisateur: vi.fn(), seConnecter: vi.fn(),
 *     envoyerReinitialisation: vi.fn(), seDeconnecter: vi.fn(),
 *   }))
 *
 * (adapter le chemin relatif au fichier de test)
 */
export function rendreApp({
  depots,
  route = '/',
  utilisateur,
}: {
  depots: Depots
  route?: string
  utilisateur: Utilisateur | null
}): RenderResult {
  vi.mocked(ecouterUtilisateur).mockImplementation((cb) => {
    cb(utilisateur)
    return () => {}
  })
  return render(
    <MemoryRouter initialEntries={[route]}>
      <App fabriqueDepots={() => depots} />
    </MemoryRouter>,
  )
}
