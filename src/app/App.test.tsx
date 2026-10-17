import { screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { creerDepotsFactices } from '../test/depotsFactices'
import { rendreApp } from '../test/rendreApp'

const utilisateur = { uid: 'u1', email: 'a@b.fr' }

it('redirige vers la connexion sans utilisateur', () => {
  rendreApp({ depots: creerDepotsFactices(), utilisateur: null })
  expect(screen.getByRole('button', { name: 'Se connecter' })).toBeInTheDocument()
})

it('affiche la barre d’onglets sur l’accueil', () => {
  rendreApp({ depots: creerDepotsFactices(), utilisateur })
  expect(screen.getByRole('link', { name: 'Prestas' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Cocktails' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Réglages' })).toBeInTheDocument()
})

it('masque la barre d’onglets sur le comptage', () => {
  const presta = { id: 'p1', date: '2026-10-17', client: 'Julie', typeId: null, statut: 'en-cours' as const, lignes: [] }
  rendreApp({ depots: creerDepotsFactices({ prestas: [presta] }), utilisateur, route: '/prestas/p1' })
  expect(screen.getByRole('heading', { name: 'Julie' })).toBeInTheDocument()
  expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
})

it('initialise les types après connexion', () => {
  const depots = creerDepotsFactices()
  rendreApp({ depots, utilisateur })
  expect(depots.types.initialiserSiVide).toHaveBeenCalledTimes(1)
})
