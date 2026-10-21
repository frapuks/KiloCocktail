import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
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
  expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['Avec alcool', 'Sans alcool'])
  const lignes = screen.getAllByRole('listitem').map((li) => li.textContent)
  expect(lignes).toEqual(['Mojito2', 'Vieux1', 'Mojito1'])
  expect(screen.queryByText('sans alcool')).toBeNull()
})

it('affiche le total de tous les verres servis, masqués compris', () => {
  rendreEcran()
  expect(screen.getByText('Total').parentElement).toHaveTextContent('Total4')
})

it('affiche un type archivé', () => {
  rendreEcran(presta(), [{ ...type, archive: true }])
  expect(screen.getByText('Anniversaire')).toBeInTheDocument()
})

it('affiche « En cours » et « Annuler », qui revient au comptage', async () => {
  const depots = rendreEcran()
  expect(screen.getByText('En cours')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Modifier' })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Reprendre' })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Annuler' }))
  expect(depots.prestas.changerStatut).not.toHaveBeenCalled()
  // La feuille redescend, puis on revient au comptage.
  expect(await screen.findByText('Lieu : /prestas/p1')).toBeInTheDocument()
})

it('ferme les résultats d’une presta terminée vers la liste', async () => {
  rendreEcran(presta({ statut: 'terminee' }))
  fireEvent.click(screen.getByRole('button', { name: 'Annuler' }))
  expect(await screen.findByText('Lieu : /')).toBeInTheDocument()
})

it('termine la presta et revient à la liste des prestas', async () => {
  const depots = rendreEcran()
  fireEvent.click(screen.getByRole('button', { name: 'Terminer la presta' }))
  // Statut changé une fois la feuille redescendue et le comptage quitté.
  expect(await screen.findByText('Lieu : /')).toBeInTheDocument()
  expect(depots.prestas.changerStatut).toHaveBeenCalledWith('p1', 'terminee')
})

it('n’affiche pas « Terminer la presta » pour une presta déjà terminée', () => {
  rendreEcran(presta({ statut: 'terminee' }))
  expect(screen.queryByRole('button', { name: 'Terminer la presta' })).toBeNull()
})

it('affiche « Terminée », « Reprendre », « Modifier » et « Annuler » pour une presta terminée', () => {
  rendreEcran(presta({ statut: 'terminee' }))
  expect(screen.getByText('Terminée')).toBeInTheDocument()
  for (const nom of ['Reprendre', 'Modifier', 'Annuler']) {
    expect(screen.getByRole('button', { name: nom })).toBeInTheDocument()
  }
})

it('ouvre la modification d’une presta terminée sans la rouvrir', () => {
  const depots = rendreEcran(presta({ statut: 'terminee' }))
  fireEvent.click(screen.getByRole('button', { name: 'Modifier' }))
  expect(screen.getByText('Lieu : /prestas/p1/resultats/modifier')).toBeInTheDocument()
  expect(depots.prestas.changerStatut).not.toHaveBeenCalled()
})

it('reprend une presta terminée après confirmation : en cours, puis son comptage', async () => {
  const depots = rendreEcran(presta({ statut: 'terminee' }))
  fireEvent.click(screen.getByRole('button', { name: 'Reprendre' }))
  const confirmation = within(screen.getByRole('dialog', { name: 'Reprendre la presta ?' }))
  expect(depots.prestas.changerStatut).not.toHaveBeenCalled()
  fireEvent.click(confirmation.getByRole('button', { name: 'Reprendre' }))
  expect(await screen.findByText('Lieu : /prestas/p1')).toBeInTheDocument()
  expect(depots.prestas.changerStatut).toHaveBeenCalledWith('p1', 'en-cours')
})

it('ne reprend pas la presta si la confirmation est annulée', () => {
  const depots = rendreEcran(presta({ statut: 'terminee' }))
  fireEvent.click(screen.getByRole('button', { name: 'Reprendre' }))
  fireEvent.click(within(screen.getByRole('dialog', { name: 'Reprendre la presta ?' })).getByRole('button', { name: 'Annuler' }))
  expect(depots.prestas.changerStatut).not.toHaveBeenCalled()
  expect(screen.getByRole('dialog', { name: 'Résultats' })).toBeInTheDocument()
})

it('referme simplement la feuille ouverte depuis le comptage', async () => {
  const onFermer = vi.fn()
  const depots = creerDepotsFactices({ cocktails, types: [type], prestas: [presta()], verres: { p1: verres } })
  rendre(
    <Routes>
      <Route path="/prestas/:id" element={<EcranResultats onFermer={onFermer} />} />
    </Routes>,
    { depots, route: '/prestas/p1' },
  )
  fireEvent.click(screen.getByRole('button', { name: 'Annuler' }))
  await waitFor(() => expect(onFermer).toHaveBeenCalledTimes(1))
  expect(depots.prestas.changerStatut).not.toHaveBeenCalled()
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
