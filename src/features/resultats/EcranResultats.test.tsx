import { fireEvent, screen } from '@testing-library/react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { expect, it } from 'vitest'
import type { Cocktail, Ligne, Presta, TypeEvenement, Verre } from '../../domain/types'
import { creerDepotsFactices } from '../../test/depotsFactices'
import { rendre } from '../../test/rendre'
import { EcranResultats } from './EcranResultats'

const cocktail = (id: string, nom: string, extra: Partial<Cocktail> = {}): Cocktail => ({
  id, nom, nomNormalise: nom.toLowerCase(), alcool: true, archive: false, ...extra,
})
const ligne = (id: string, cocktailId: string, masquee = false): Ligne => ({
  id, cocktailId, masquee,
})
const verre = (id: string, ligneId: string, creeLe: number): Verre => ({ id, ligneId, creeLe, enAttente: false })

const cocktails = [cocktail('c1', 'Mojito'), cocktail('c2', 'Mojito', { alcool: false }), cocktail('c3', 'Vieux')]
const type: TypeEvenement = { id: 't1', nom: 'Anniversaire', nomNormalise: 'anniversaire', archive: false }
const presta = (p: Partial<Presta> = {}): Presta => ({
  id: 'p1', date: '2026-10-17', client: 'Julie Martin', typeId: 't1', statut: 'en-cours',
  lignes: [ligne('L1', 'c1'), ligne('L2', 'c2'), ligne('L3', 'c3', true)],
  ...p,
})
const verres = [verre('v1', 'L1', 1), verre('v2', 'L1', 2), verre('v3', 'L2', 3), verre('v4', 'L3', 4)]

function Lieu() {
  return <p>Lieu : {useLocation().pathname}</p>
}

function rendreEcran(p: Presta = presta(), types: TypeEvenement[] = [type]) {
  const depots = creerDepotsFactices({ cocktails, types, prestas: [p], verres: { p1: verres } })
  rendre(
    <Routes>
      <Route path="/prestas/:id/resultats" element={<EcranResultats />} />
      <Route path="*" element={<Lieu />} />
    </Routes>,
    { depots, route: '/prestas/p1/resultats' },
  )
  return depots
}

it('affiche date, client et type', () => {
  rendreEcran()
  expect(screen.getByText('17/10/2026')).toBeInTheDocument()
  expect(screen.getByText('Julie Martin')).toBeInTheDocument()
  expect(screen.getByText('Anniversaire')).toBeInTheDocument()
})

it('affiche « — » pour un client ou un type vide', () => {
  rendreEcran(presta({ client: null, typeId: null }))
  expect(screen.getAllByText('—')).toHaveLength(2)
})

it('liste une ligne par cocktail, masquées comprises, dans l’ordre du comptage', () => {
  rendreEcran()
  expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['Avec alcool', 'Sans alcool'])
  const lignes = screen.getAllByRole('listitem').map((li) => li.textContent)
  expect(lignes).toEqual(['Mojito2', 'Vieux1', 'Mojitosans alcool1'])
})

it('affiche un type archivé', () => {
  rendreEcran(presta(), [{ ...type, archive: true }])
  expect(screen.getByText('Anniversaire')).toBeInTheDocument()
})

it('affiche « En cours » et « Retour au comptage » pour une presta en cours', () => {
  rendreEcran()
  expect(screen.getByText('En cours')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Retour au comptage' }))
  expect(screen.getByText('Lieu : /prestas/p1')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Modifier' })).toBeNull()
})

it('affiche « Terminée · lecture seule », « Modifier » et « Reprendre le comptage » pour une presta terminée', () => {
  rendreEcran(presta({ statut: 'terminee' }))
  expect(screen.getByText('Terminée · lecture seule')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Modifier' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Reprendre le comptage' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Retour au comptage' })).toBeNull()
})

it('reprend le comptage', () => {
  const depots = rendreEcran(presta({ statut: 'terminee' }))
  fireEvent.click(screen.getByRole('button', { name: 'Reprendre le comptage' }))
  expect(depots.prestas.changerStatut).toHaveBeenCalledWith('p1', 'en-cours')
  expect(screen.getByText('Lieu : /prestas/p1')).toBeInTheDocument()
})

it('ouvre Modifier', () => {
  rendreEcran(presta({ statut: 'terminee' }))
  fireEvent.click(screen.getByRole('button', { name: 'Modifier' }))
  expect(screen.getByText('Lieu : /prestas/p1/modifier')).toBeInTheDocument()
})

it('redirige vers l’accueil si la presta n’existe pas', () => {
  const depots = creerDepotsFactices({ cocktails, types: [type], prestas: [], verres: { p1: [] } })
  rendre(
    <Routes>
      <Route path="/prestas/:id/resultats" element={<EcranResultats />} />
      <Route path="*" element={<Lieu />} />
    </Routes>,
    { depots, route: '/prestas/p1/resultats' },
  )
  expect(screen.getByText('Lieu : /')).toBeInTheDocument()
})
