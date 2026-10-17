import { fireEvent, screen } from '@testing-library/react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { expect, it } from 'vitest'
import type { Cocktail, Ligne, Presta, Verre } from '../../domain/types'
import { creerDepotsFactices } from '../../test/depotsFactices'
import { rendre } from '../../test/rendre'
import { EcranComptage } from './EcranComptage'

const cocktail = (id: string, nom: string, extra: Partial<Cocktail> = {}): Cocktail => ({
  id, nom, nomNormalise: nom.toLowerCase(), variantes: 'les-deux', nomSansAlcool: null, archive: false, ...extra,
})
const ligne = (id: string, cocktailId: string, variante: 'avec' | 'sans', masquee = false): Ligne => ({
  id, cocktailId, variante, masquee,
})
const verre = (id: string, ligneId: string, creeLe: number): Verre => ({ id, ligneId, creeLe, enAttente: false })

const cocktails = [
  cocktail('c1', 'Mojito'),
  cocktail('c2', 'Mojito', { nomSansAlcool: 'Nojito' }),
  cocktail('c3', 'Vieux', { archive: true }),
]
const type = { id: 't1', nom: 'Anniversaire', nomNormalise: 'anniversaire', archive: false }
const presta = (p: Partial<Presta> = {}): Presta => ({
  id: 'p1', date: '2026-10-17', client: 'Julie Martin', typeId: 't1', statut: 'en-cours',
  lignes: [ligne('L1', 'c1', 'avec'), ligne('L2', 'c2', 'sans'), ligne('L3', 'c3', 'avec'), ligne('L4', 'c1', 'sans', true)],
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
  expect(screen.getByText('Anniversaire · samedi 17/10/2026')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: '← Prestas' })).toBeInTheDocument()
  for (const nom of ['Modifier', 'Résultats', 'Terminer']) {
    expect(screen.getByRole('button', { name: nom })).toBeInTheDocument()
  }
})

it('range les cartes en groupes Avec alcool puis Sans alcool, sans les masquées', () => {
  rendreEcran()
  expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['Avec alcool', 'Sans alcool'])
  const noms = ['Mojito', 'Vieux', 'Nojito']
  const cartes = screen.getAllByRole('button').filter((b) => noms.includes(b.getAttribute('aria-label') ?? ''))
  expect(cartes.map((c) => c.getAttribute('aria-label'))).toEqual(['Mojito', 'Vieux', 'Nojito'])
})

it('affiche une ligne dont le cocktail est archivé', () => {
  rendreEcran()
  expect(screen.getByRole('button', { name: 'Vieux' })).toBeInTheDocument()
})

it('sert un verre sur la bonne ligne', () => {
  const depots = rendreEcran()
  fireEvent.pointerDown(screen.getByRole('button', { name: 'Nojito' }))
  expect(depots.verres.servir).toHaveBeenCalledWith('p1', 'L2')
})

it('retire le dernier verre de la ligne', () => {
  const depots = rendreEcran(presta(), [verre('v1', 'L1', 1), verre('v3', 'L1', 3), verre('v2', 'L1', 2)])
  fireEvent.pointerDown(screen.getByRole('button', { name: 'Retirer un Mojito' }))
  expect(depots.verres.retirer).toHaveBeenCalledWith('p1', 'v3')
})

it('retire deux verres distincts sur deux taps rapides', () => {
  const depots = rendreEcran(presta(), [verre('v1', 'L1', 1), verre('v2', 'L1', 2), verre('v3', 'L1', 3)])
  const moins = screen.getByRole('button', { name: 'Retirer un Mojito' })
  fireEvent.pointerDown(moins)
  fireEvent.pointerDown(moins)
  const appels = (depots.verres.retirer as unknown as { mock: { calls: string[][] } }).mock.calls
  expect(appels.map((a) => a[1])).toEqual(['v3', 'v2'])
})

it('invite à passer par Modifier sans ligne visible', () => {
  rendreEcran(presta({ lignes: [] }))
  expect(screen.getByText('Aucun cocktail sur la carte. Ajoute-en avec « Modifier ».')).toBeInTheDocument()
})

it('termine la presta et ouvre les résultats', () => {
  const depots = rendreEcran()
  fireEvent.click(screen.getByRole('button', { name: 'Terminer' }))
  expect(depots.prestas.changerStatut).toHaveBeenCalledWith('p1', 'terminee')
  expect(screen.getByText('Lieu : /prestas/p1/resultats')).toBeInTheDocument()
})

it('redirige une presta terminée vers ses résultats', () => {
  rendreEcran(presta({ statut: 'terminee' }))
  expect(screen.getByText('Lieu : /prestas/p1/resultats')).toBeInTheDocument()
})

it('ne retire qu’un verre sur deux taps rapides avec un seul verre', () => {
  const depots = rendreEcran(presta(), [verre('v1', 'L1', 1)])
  const moins = screen.getByRole('button', { name: 'Retirer un Mojito' })
  fireEvent.pointerDown(moins)
  fireEvent.pointerDown(moins)
  expect(depots.verres.retirer).toHaveBeenCalledTimes(1)
  expect(screen.getByText('−1')).toBeInTheDocument()
})
