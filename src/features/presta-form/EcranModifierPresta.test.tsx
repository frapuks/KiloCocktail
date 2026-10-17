import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DepotsProvider } from '../../data/DepotsContext'
import { surErreurEcriture } from '../../data/erreurs'
import type { Cocktail, Presta, Verre } from '../../domain/types'
import { creerDepotsFactices } from '../../test/depotsFactices'
import { EcranModifierPresta } from './EcranModifierPresta'

const c = (id: string, nom: string, extra: Partial<Cocktail> = {}): Cocktail => ({
  id, nom, nomNormalise: nom.toLowerCase(), variantes: 'avec', nomSansAlcool: null, archive: false, ...extra,
})
const mojito = c('m', 'Mojito', { variantes: 'les-deux', nomSansAlcool: 'Nojito' })
const spritz = c('s', 'Spritz', { archive: true })
const mule = c('mm', 'Moscow Mule', { variantes: 'les-deux' })

const presta: Presta = {
  id: 'p1', date: '2026-10-17', client: 'Julie Martin', typeId: 't1', statut: 'en-cours',
  lignes: [
    { id: 'L1', cocktailId: 'm', variante: 'avec', masquee: false },
    { id: 'L2', cocktailId: 's', variante: 'avec', masquee: false },
    { id: 'L3', cocktailId: 'm', variante: 'sans', masquee: true },
  ],
}
const v = (id: string, ligneId: string): Verre => ({ id, ligneId, creeLe: 1, enAttente: false })
const verres = { p1: [v('1', 'L1'), v('2', 'L1'), v('3', 'L1'), v('4', 'L3'), v('5', 'L3')] }
const types = [
  { id: 't1', nom: 'Mariage', nomNormalise: 'mariage', archive: true },
  { id: 't2', nom: 'Anniversaire', nomNormalise: 'anniversaire', archive: false },
]

function ecran(depots = creerDepotsFactices({ cocktails: [mojito, spritz, mule], types, prestas: [presta], verres })) {
  render(
    <MemoryRouter initialEntries={['/prestas/p1', '/prestas/p1/modifier']} initialIndex={1}>
      <DepotsProvider depots={depots}>
        <Routes>
          <Route path="/" element={<p>ACCUEIL</p>} />
          <Route path="/prestas/:id" element={<p>COMPTAGE</p>} />
          <Route path="/prestas/:id/modifier" element={<EcranModifierPresta />} />
        </Routes>
      </DepotsProvider>
    </MemoryRouter>,
  )
  return depots
}

const carte = () => within(screen.getByRole('region', { name: 'Sur la carte' }))
const ligne = (nom: string) => carte().getByText(nom).closest('li') as HTMLElement
const clic = (nom: string | RegExp) => fireEvent.click(screen.getByRole('button', { name: nom }))

describe('EcranModifierPresta', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('préremplit date, client et type', () => {
    ecran()
    expect((screen.getByLabelText('Date') as HTMLInputElement).value).toBe('2026-10-17')
    expect((screen.getByLabelText('Client') as HTMLInputElement).value).toBe('Julie Martin')
    expect((screen.getByLabelText('Type') as HTMLSelectElement).value).toBe('t1')
    expect(screen.getByRole('option', { name: 'Mariage' })).toBeTruthy()
  })

  it('retire directement une ligne à 0', () => {
    ecran()
    fireEvent.click(within(ligne('Spritz')).getByRole('button', { name: 'Retirer' }))
    expect(carte().queryByText('Spritz')).toBeNull()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('propose trois choix pour une ligne comptée', () => {
    ecran()
    fireEvent.click(within(ligne('Mojito')).getByRole('button', { name: 'Retirer' }))
    const d = within(screen.getByRole('dialog', { name: 'Retirer Mojito ?' }))
    expect(d.getByRole('button', { name: 'Masquer du comptage (garder les 3 servis)' })).toBeTruthy()
    expect(d.getByRole('button', { name: 'Supprimer avec ses 3 servis' })).toBeTruthy()
    expect(d.getByRole('button', { name: 'Annuler' })).toBeTruthy()
  })

  it('nomme la variante sans alcool dans le dialogue de retrait', () => {
    const p = { ...presta, lignes: [presta.lignes[0], { ...presta.lignes[2], masquee: false }] }
    ecran(creerDepotsFactices({ cocktails: [mojito], types, prestas: [p], verres }))
    fireEvent.click(within(ligne('Nojito')).getByRole('button', { name: 'Retirer' }))
    const d = within(screen.getByRole('dialog', { name: 'Retirer Nojito (sans alcool) ?' }))
    expect(d.getByRole('button', { name: 'Masquer du comptage (garder les 2 servis)' })).toBeTruthy()
    expect(d.getByRole('button', { name: 'Supprimer avec ses 2 servis' })).toBeTruthy()
  })

  it('accorde le dialogue de retrait pour un seul verre servi', () => {
    ecran(creerDepotsFactices({ cocktails: [mojito, spritz, mule], types, prestas: [presta], verres: { p1: [v('1', 'L1')] } }))
    fireEvent.click(within(ligne('Mojito')).getByRole('button', { name: 'Retirer' }))
    const d = within(screen.getByRole('dialog', { name: 'Retirer Mojito ?' }))
    expect(d.getByRole('button', { name: 'Masquer du comptage (garder le 1 servi)' })).toBeTruthy()
    expect(d.getByRole('button', { name: 'Supprimer avec son 1 servi' })).toBeTruthy()
  })

  it('masque une ligne comptée', () => {
    const depots = ecran()
    fireEvent.click(within(ligne('Mojito')).getByRole('button', { name: 'Retirer' }))
    clic('Masquer du comptage (garder les 3 servis)')
    expect(carte().queryByText('Mojito')).toBeNull()
    clic('Enregistrer')
    expect(depots.prestas.modifier).toHaveBeenCalledWith(
      'p1',
      expect.objectContaining({
        lignes: [{ id: 'L1', cocktailId: 'm', variante: 'avec', masquee: true }, presta.lignes[1], presta.lignes[2]],
      }),
      [],
    )
  })

  it('supprime une ligne comptée avec ses verres', () => {
    const depots = ecran()
    fireEvent.click(within(ligne('Mojito')).getByRole('button', { name: 'Retirer' }))
    clic('Supprimer avec ses 3 servis')
    clic('Enregistrer')
    expect(depots.prestas.modifier).toHaveBeenCalledWith(
      'p1',
      expect.objectContaining({ lignes: [presta.lignes[1], presta.lignes[2]] }),
      ['L1'],
    )
  })

  it('réaffiche une ligne masquée à la fin de son groupe', () => {
    ecran()
    const masquees = within(screen.getByRole('region', { name: 'Masquées' }))
    expect(masquees.getByText('Nojito · sans alcool')).toBeTruthy()
    expect(masquees.getByText('2')).toBeTruthy()
    fireEvent.click(masquees.getByRole('button', { name: 'Réafficher' }))
    expect(screen.queryByRole('region', { name: 'Masquées' })).toBeNull()
    expect(within(screen.getByRole('list', { name: 'Sans alcool' })).getByText('Nojito')).toBeTruthy()
  })

  it('ajoute seulement les cocktails et variantes absents', () => {
    const depots = ecran()
    clic('+ Ajouter')
    const feuille = within(screen.getByRole('dialog', { name: 'Ajouter des cocktails' }))
    const cases = feuille.getAllByRole('checkbox')
    expect(cases).toHaveLength(1)
    expect(cases[0].closest('li')?.textContent).toContain('Moscow Mule')
    expect(feuille.queryByText('Mojito')).toBeNull()
    expect(feuille.queryByText('Spritz')).toBeNull()
    fireEvent.click(cases[0])
    fireEvent.click(feuille.getByRole('button', { name: 'Ajouter' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    const avec = within(screen.getByRole('list', { name: 'Avec alcool' }))
    expect(avec.getAllByRole('listitem').map((e) => e.textContent)).toEqual([
      expect.stringContaining('Mojito'),
      expect.stringContaining('Spritz'),
      expect.stringContaining('Moscow Mule'),
    ])
    expect(within(screen.getByRole('list', { name: 'Sans alcool' })).getByText('Moscow Mule')).toBeTruthy()
    clic('Enregistrer')
    expect(depots.prestas.modifier).toHaveBeenCalledWith(
      'p1',
      expect.objectContaining({
        lignes: [
          ...presta.lignes,
          expect.objectContaining({ cocktailId: 'mm', variante: 'avec', masquee: false }),
          expect.objectContaining({ cocktailId: 'mm', variante: 'sans', masquee: false }),
        ],
      }),
      [],
    )
  })

  it('n’ajoute pas une variante déjà présente quand le cocktail est partiellement présent', () => {
    const depots = ecran()
    fireEvent.click(within(ligne('Mojito')).getByRole('button', { name: 'Retirer' }))
    clic('Supprimer avec ses 3 servis')
    clic('+ Ajouter')
    const feuille = within(screen.getByRole('dialog', { name: 'Ajouter des cocktails' }))
    fireEvent.click(feuille.getByRole('checkbox', { name: /Mojito/ }))
    fireEvent.click(feuille.getByRole('button', { name: 'Ajouter' }))
    clic('Enregistrer')
    expect(depots.prestas.modifier).toHaveBeenCalledWith(
      'p1',
      expect.objectContaining({
        lignes: [
          presta.lignes[1],
          presta.lignes[2],
          { id: expect.any(String), cocktailId: 'm', variante: 'avec', masquee: false },
        ],
      }),
      ['L1'],
    )
  })

  it('affiche une ligne dont le cocktail est archivé', () => {
    ecran()
    expect(carte().getByText('Spritz')).toBeTruthy()
  })

  it('n’applique rien avant « Enregistrer »', () => {
    const depots = ecran()
    fireEvent.change(screen.getByLabelText('Client'), { target: { value: 'Paul' } })
    fireEvent.click(within(ligne('Spritz')).getByRole('button', { name: 'Retirer' }))
    expect(depots.prestas.modifier).not.toHaveBeenCalled()
    expect(depots.prestas.supprimer).not.toHaveBeenCalled()
  })

  it('enregistre puis revient à la page précédente', async () => {
    const depots = ecran()
    fireEvent.change(screen.getByLabelText('Client'), { target: { value: '  Paul ' } })
    clic('Enregistrer')
    expect(depots.prestas.modifier).toHaveBeenCalledWith(
      'p1',
      { date: '2026-10-17', client: 'Paul', typeId: 't1', lignes: presta.lignes },
      [],
    )
    await waitFor(() => expect(screen.getByText('COMPTAGE')).toBeTruthy())
  })

  it('demande confirmation avant d’abandonner des modifications', async () => {
    ecran()
    fireEvent.change(screen.getByLabelText('Client'), { target: { value: 'Paul' } })
    clic('Annuler')
    expect(screen.getByRole('dialog', { name: 'Abandonner les modifications ?' })).toBeTruthy()
    clic('Continuer à modifier')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.queryByText('COMPTAGE')).toBeNull()
    clic('Annuler')
    clic('Abandonner')
    await waitFor(() => expect(screen.getByText('COMPTAGE')).toBeTruthy())
  })

  it('revient directement sans modification', async () => {
    ecran()
    clic('Annuler')
    await waitFor(() => expect(screen.getByText('COMPTAGE')).toBeTruthy())
  })

  it('supprime la presta après confirmation', async () => {
    const depots = ecran()
    clic('Supprimer la presta')
    expect(screen.getByRole('dialog', { name: 'Supprimer “Julie Martin” et ses 5 cocktails servis ?' })).toBeTruthy()
    expect(depots.prestas.supprimer).not.toHaveBeenCalled()
    clic('Supprimer')
    expect(depots.prestas.supprimer).toHaveBeenCalledWith('p1')
    await waitFor(() => expect(screen.getByText('ACCUEIL')).toBeTruthy())
  })

  it('n’enregistre qu’une fois sur un double tap', async () => {
    const depots = creerDepotsFactices({ cocktails: [mojito, spritz, mule], types, prestas: [presta], verres })
    let terminer = () => {}
    vi.mocked(depots.prestas.modifier).mockReturnValue(new Promise<void>((r) => (terminer = r)))
    ecran(depots)
    clic('Enregistrer')
    clic('Enregistrer')
    expect(depots.prestas.modifier).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeDisabled()
    terminer()
    await waitFor(() => expect(screen.getByText('COMPTAGE')).toBeTruthy())
  })

  it('signale un échec d’enregistrement et reste sur l’écran', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const abonne = vi.fn()
    const desabonner = surErreurEcriture(abonne)
    const depots = creerDepotsFactices({ cocktails: [mojito, spritz, mule], types, prestas: [presta], verres })
    vi.mocked(depots.prestas.modifier).mockRejectedValue(new Error('hors cache'))
    ecran(depots)
    clic('Enregistrer')
    await waitFor(() => expect(abonne).toHaveBeenCalledTimes(1))
    expect(screen.queryByText('COMPTAGE')).toBeNull()
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeEnabled()
    desabonner()
  })

  it('ne supprime qu’une fois sur un double tap', () => {
    const depots = creerDepotsFactices({ cocktails: [mojito, spritz, mule], types, prestas: [presta], verres })
    vi.mocked(depots.prestas.supprimer).mockReturnValue(new Promise<void>(() => {}))
    ecran(depots)
    clic('Supprimer la presta')
    clic('Supprimer')
    clic('Supprimer')
    expect(depots.prestas.supprimer).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Supprimer' })).toBeDisabled()
  })

  it('signale un échec de suppression sans rejet non géré', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const abonne = vi.fn()
    const desabonner = surErreurEcriture(abonne)
    const depots = creerDepotsFactices({ cocktails: [mojito, spritz, mule], types, prestas: [presta], verres })
    vi.mocked(depots.prestas.supprimer).mockRejectedValue(new Error('hors cache'))
    ecran(depots)
    clic('Supprimer la presta')
    clic('Supprimer')
    await waitFor(() => expect(abonne).toHaveBeenCalledTimes(1))
    expect(screen.queryByText('ACCUEIL')).toBeNull()
    expect(screen.getByRole('button', { name: 'Supprimer' })).toBeEnabled()
    desabonner()
  })

  it('retourne à l’accueil si la presta n’existe pas', async () => {
    ecran(creerDepotsFactices({ cocktails: [mojito], types, prestas: [] }))
    await waitFor(() => expect(screen.getByText('ACCUEIL')).toBeTruthy())
  })
})
