import { fireEvent, screen, waitFor } from '@testing-library/react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import type { Cocktail, Ligne, Presta, Verre } from '../../domain/types'
import { creerDepotsFactices } from '../../test/depotsFactices'
import { rendre } from '../../test/rendre'
import { EcranComptage } from './EcranComptage'

const cocktail = (id: string, nom: string, extra: Partial<Cocktail> = {}): Cocktail => ({
  id, nom, nomNormalise: nom.toLowerCase(), alcool: true, archive: false, ...extra,
})
const ligne = (id: string, cocktailId: string, masquee = false): Ligne => ({
  id, cocktailId, masquee,
})
const verre = (id: string, ligneId: string, creeLe: number): Verre => ({ id, ligneId, creeLe })

const cocktails = [
  cocktail('c1', 'Mojito'),
  cocktail('c2', 'Mojito', { alcool: false }),
  cocktail('c3', 'Vieux', { archive: true }),
]
const type = { id: 't1', nom: 'Anniversaire', nomNormalise: 'anniversaire', archive: false }
const presta = (p: Partial<Presta> = {}): Presta => ({
  id: 'p1', date: '2026-10-17', client: 'Julie Martin', typeId: 't1', statut: 'en-cours',
  lignes: [ligne('L1', 'c1'), ligne('L2', 'c2'), ligne('L3', 'c3'), ligne('L4', 'c1', true)],
  ...p,
})

function Lieu() {
  return <p>Lieu : {useLocation().pathname}</p>
}

function rendreEcran(p: Presta | null = presta(), verres: Verre[] = []) {
  const depots = creerDepotsFactices({ cocktails, types: [type], prestas: p ? [p] : [], verres: { p1: verres } })
  rendre(
    <Routes>
      <Route path="/prestas/:id" element={<EcranComptage />} />
      <Route path="*" element={<Lieu />} />
    </Routes>,
    { depots, route: '/prestas/p1' },
  )
  return depots
}

it('affiche l’en-tête de la presta', () => {
  rendreEcran()
  expect(screen.getByText('Julie Martin')).toBeInTheDocument()
  expect(screen.getByText('Anniversaire').closest('.MuiChip-root')).not.toBeNull()
  expect(screen.getByText('17/10/2026')).toBeInTheDocument()
  expect(screen.queryByRole('link', { name: '← Prestas' })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Terminer la presta' })).toBeNull()
  for (const nom of ['Modifier', 'Résultats', 'Fermer']) {
    expect(screen.getByRole('button', { name: nom })).toBeInTheDocument()
  }
})

it('range les cartes en groupes Avec alcool puis Sans alcool, sans les masquées', () => {
  rendreEcran()
  expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['Avec alcool', 'Sans alcool'])
  const noms = ['Mojito', 'Vieux', 'Mojito, sans alcool']
  const cartes = screen.getAllByRole('button').filter((b) => noms.includes(b.getAttribute('aria-label') ?? ''))
  expect(cartes.map((c) => c.getAttribute('aria-label'))).toEqual(['Mojito', 'Vieux', 'Mojito, sans alcool'])
})

it('affiche une ligne dont le cocktail est archivé', () => {
  rendreEcran()
  expect(screen.getByRole('button', { name: 'Vieux' })).toBeInTheDocument()
})

it('sert un verre sur la bonne ligne', () => {
  const depots = rendreEcran()
  fireEvent.pointerDown(screen.getByRole('button', { name: 'Mojito, sans alcool' }))
  expect(depots.verres.servir).toHaveBeenCalledWith('p1', 'L2')
})

it('nomme le bouton − d’une ligne sans alcool', () => {
  rendreEcran()
  expect(screen.getByRole('button', { name: 'Retirer un Mojito sans alcool' })).toBeInTheDocument()
})

it('retire le dernier verre de la ligne', () => {
  const depots = rendreEcran(presta(), [verre('v1', 'L1', 1), verre('v3', 'L1', 3), verre('v2', 'L1', 2)])
  fireEvent.click(screen.getByRole('button', { name: 'Retirer un Mojito' }))
  expect(depots.verres.retirer).toHaveBeenCalledWith('p1', 'v3')
})

it('retire deux verres distincts sur deux taps rapides', () => {
  const depots = rendreEcran(presta(), [verre('v1', 'L1', 1), verre('v2', 'L1', 2), verre('v3', 'L1', 3)])
  const moins = screen.getByRole('button', { name: 'Retirer un Mojito' })
  fireEvent.click(moins)
  fireEvent.click(moins)
  const appels = (depots.verres.retirer as unknown as { mock: { calls: string[][] } }).mock.calls
  expect(appels.map((a) => a[1])).toEqual(['v3', 'v2'])
})

it('invite à passer par Modifier sans ligne visible', () => {
  rendreEcran(presta({ lignes: [] }))
  expect(screen.getByText('Aucun cocktail sur la carte. Ajoute-en avec « Modifier ».')).toBeInTheDocument()
})

it('ferme le comptage et revient à la liste des prestas', () => {
  const depots = rendreEcran()
  fireEvent.click(screen.getByRole('button', { name: 'Fermer' }))
  expect(screen.getByText('Lieu : /')).toBeInTheDocument()
  expect(depots.prestas.changerStatut).not.toHaveBeenCalled()
})

it('ouvre les résultats en feuille par-dessus le comptage, sans changer de page', () => {
  rendreEcran()
  fireEvent.click(screen.getByRole('button', { name: 'Résultats' }))
  expect(screen.getByRole('dialog', { name: 'Résultats' })).toBeInTheDocument()
  expect(screen.queryByText(/^Lieu :/)).toBeNull()
})

it('redirige une presta terminée vers ses résultats', () => {
  rendreEcran(presta({ statut: 'terminee' }))
  expect(screen.getByText('Lieu : /prestas/p1/resultats')).toBeInTheDocument()
})

it('ne retire qu’un verre sur deux taps rapides avec un seul verre', () => {
  const depots = rendreEcran(presta(), [verre('v1', 'L1', 1)])
  const moins = screen.getByRole('button', { name: 'Retirer un Mojito' })
  fireEvent.click(moins)
  fireEvent.click(moins)
  expect(depots.verres.retirer).toHaveBeenCalledTimes(1)
  expect(screen.getByText('−1')).toBeInTheDocument()
})

it('annule le verre servi quand le toucher devient un défilement', () => {
  const depots = rendreEcran()
  vi.mocked(depots.verres.servir).mockReturnValueOnce('verre-servi')
  const carte = screen.getByRole('button', { name: 'Mojito, sans alcool' })
  fireEvent.pointerDown(carte, { pointerId: 3 })
  fireEvent.pointerCancel(carte, { pointerId: 3 })
  expect(depots.verres.servir).toHaveBeenCalledWith('p1', 'L2')
  expect(depots.verres.retirer).toHaveBeenCalledTimes(1)
  expect(depots.verres.retirer).toHaveBeenCalledWith('p1', 'verre-servi')
})

it('rend de nouveau retirable un verre dont le retrait est refusé', async () => {
  const depots = rendreEcran(presta(), [verre('v1', 'L1', 1)])
  vi.mocked(depots.verres.retirer).mockRejectedValueOnce(new Error('permission-denied'))
  const moins = screen.getByRole('button', { name: 'Retirer un Mojito' })
  fireEvent.click(moins)
  // Le refus revient du serveur : le verre, toujours là, est de nouveau proposé au retrait suivant.
  await waitFor(() => {
    fireEvent.click(moins)
    expect(depots.verres.retirer).toHaveBeenCalledTimes(2)
  })
  expect(vi.mocked(depots.verres.retirer).mock.calls.map((a) => a[1])).toEqual(['v1', 'v1'])
})
