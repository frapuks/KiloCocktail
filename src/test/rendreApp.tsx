import { render, type RenderResult } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { App } from '../app/App'
import { ecouterUtilisateur, type Utilisateur } from '../data/auth'
import type { Depots } from '../data/depots'

// Rend App avec un utilisateur simulé. src/data/auth est déjà simulé globalement (src/test/setup.ts).
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
