import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes, useLocation } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import type { Presta, TypeEvenement } from '../../domain/types'
import { creerDepotsFactices } from '../../test/depotsFactices'
import { rendre } from '../../test/rendre'
import { EcranPrestas } from './EcranPrestas'

const type: TypeEvenement = { id: 't1', nom: 'Anniversaire', nomNormalise: 'anniversaire', archive: true }
const presta = (p: Partial<Presta> & { id: string }): Presta => ({
  date: '2026-10-17', client: null, typeId: null, statut: 'en-cours', lignes: [], ...p,
})

function Lieu() {
  return <p>Lieu : {useLocation().pathname}</p>
}

function rendreEcran(prestas: Presta[], total: number | null = 39) {
  const depots = creerDepotsFactices({ prestas, types: [type] })
  vi.mocked(depots.prestas.compterServis).mockResolvedValue(total)
  rendre(
    <Routes>
      <Route path="/" element={<EcranPrestas />} />
      <Route path="*" element={<Lieu />} />
    </Routes>,
    { depots },
  )
}

it('ouvre « Nouvelle presta »', async () => {
  rendreEcran([])
  await userEvent.click(screen.getByRole('button', { name: 'Nouvelle presta' }))
  expect(screen.getByText('Lieu : /prestas/nouvelle')).toBeInTheDocument()
})

it('sépare « En cours » et « Terminées », triées par date décroissante', () => {
  rendreEcran([
    presta({ id: 'a', client: 'Ancienne', date: '2026-01-01' }),
    presta({ id: 'b', client: 'Récente', date: '2026-09-01' }),
    presta({ id: 'c', client: 'Finie', date: '2026-05-01', statut: 'terminee' }),
    presta({ id: 'd', client: 'Finie récente', date: '2026-06-01', statut: 'terminee' }),
  ])
  const enCours = screen.getByRole('region', { name: 'En cours' })
  expect(within(enCours).getAllByRole('link').map((l) => l.textContent)).toEqual([
    expect.stringContaining('Récente'),
    expect.stringContaining('Ancienne'),
  ])
  const terminees = screen.getByRole('region', { name: 'Terminées' })
  expect(within(terminees).getAllByRole('link').map((l) => l.textContent)).toEqual([
    expect.stringContaining('Finie récente'),
    expect.stringContaining('Finie'),
  ])
})

it('n’affiche pas une section vide', () => {
  rendreEcran([presta({ id: 'a', client: 'X' })])
  expect(screen.queryByRole('region', { name: 'Terminées' })).toBeNull()
})

it('affiche nom, type, date et total servi', async () => {
  rendreEcran([presta({ id: 'p1', client: 'Julie Martin', typeId: 't1' })])
  expect(screen.getByText('Julie Martin')).toBeInTheDocument()
  expect(screen.getByText('Anniversaire')).toBeInTheDocument()
  expect(screen.getByText('17/10/2026')).toBeInTheDocument()
  expect(await screen.findByText('39')).toBeInTheDocument()
  expect(screen.getByRole('link')).toHaveTextContent('39 servis')
})

it('affiche « — » quand le total est indisponible', async () => {
  rendreEcran([presta({ id: 'p1', client: 'Julie Martin' })], null)
  expect(await screen.findByText('—')).toBeInTheDocument()
  expect(screen.queryByText(/servi/)).toBeNull()
})

it('ouvre le comptage d’une presta en cours', async () => {
  rendreEcran([presta({ id: 'p1', client: 'Julie Martin' })])
  await userEvent.click(screen.getByRole('link', { name: /Julie Martin/ }))
  expect(screen.getByText('Lieu : /prestas/p1')).toBeInTheDocument()
})

it('ouvre les résultats d’une presta terminée', async () => {
  rendreEcran([presta({ id: 'p2', client: 'Paul', statut: 'terminee' })])
  await userEvent.click(screen.getByRole('link', { name: /Paul/ }))
  expect(screen.getByText('Lieu : /prestas/p2/resultats')).toBeInTheDocument()
})
