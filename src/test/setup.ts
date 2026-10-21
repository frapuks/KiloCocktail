import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(cleanup)
import { vi } from 'vitest'

// Évite que firebase.ts soit chargé sous jsdom : tous les tests voient ce module simulé.
// Les tests configurent les vi.fn via vi.mocked(...) (ex. mockResolvedValue).
vi.mock('../data/auth', () => ({
  ecouterUtilisateur: vi.fn(),
  seConnecter: vi.fn(),
  envoyerReinitialisation: vi.fn(),
  changerMotDePasse: vi.fn(),
  seDeconnecter: vi.fn(),
}))
