import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { envoyerReinitialisation, seConnecter } from '../../data/auth'
import { creerDepotsFactices } from '../../test/depotsFactices'
import { rendre } from '../../test/rendre'
import { EcranConnexion } from './EcranConnexion'

vi.mock('../../data/auth', () => ({
  ecouterUtilisateur: vi.fn(),
  seConnecter: vi.fn(),
  envoyerReinitialisation: vi.fn(),
  seDeconnecter: vi.fn(),
}))

beforeEach(() => vi.resetAllMocks())
afterEach(() => vi.restoreAllMocks())

function rendreEcran() {
  return rendre(
    <Routes>
      <Route path="/connexion" element={<EcranConnexion />} />
      <Route path="/" element={<p>Accueil</p>} />
    </Routes>,
    { depots: creerDepotsFactices(), route: '/connexion' },
  )
}

async function remplir(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('E-mail'), 'a@b.fr')
  await user.type(screen.getByLabelText('Mot de passe'), 'secret')
}

it('connecte puis ouvre l’accueil', async () => {
  vi.mocked(seConnecter).mockResolvedValue()
  const user = userEvent.setup()
  rendreEcran()
  await remplir(user)
  await user.click(screen.getByRole('button', { name: 'Se connecter' }))
  expect(seConnecter).toHaveBeenCalledWith('a@b.fr', 'secret')
  expect(await screen.findByText('Accueil')).toBeInTheDocument()
})

it('affiche « E-mail ou mot de passe incorrect »', async () => {
  vi.mocked(seConnecter).mockRejectedValue(new Error('identifiants'))
  const user = userEvent.setup()
  rendreEcran()
  await remplir(user)
  await user.click(screen.getByRole('button', { name: 'Se connecter' }))
  expect(await screen.findByText('E-mail ou mot de passe incorrect')).toBeInTheDocument()
})

it('affiche « Pas de connexion internet, réessaie dans un instant »', async () => {
  vi.mocked(seConnecter).mockRejectedValue(new Error('reseau'))
  const user = userEvent.setup()
  rendreEcran()
  await remplir(user)
  await user.click(screen.getByRole('button', { name: 'Se connecter' }))
  expect(await screen.findByText('Pas de connexion internet, réessaie dans un instant')).toBeInTheDocument()
})

it('envoie l’e-mail de réinitialisation', async () => {
  vi.mocked(envoyerReinitialisation).mockResolvedValue()
  const user = userEvent.setup()
  rendreEcran()
  await user.type(screen.getByLabelText('E-mail'), 'a@b.fr')
  await user.click(screen.getByRole('button', { name: 'Mot de passe oublié' }))
  await waitFor(() => expect(envoyerReinitialisation).toHaveBeenCalledWith('a@b.fr'))
  expect(await screen.findByText('E-mail de réinitialisation envoyé.')).toBeInTheDocument()
})

it('prévient qu’il faut internet pour la première ouverture', () => {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
  rendreEcran()
  expect(screen.getByText('Connecte-toi à internet pour la première ouverture.')).toBeInTheDocument()
})
