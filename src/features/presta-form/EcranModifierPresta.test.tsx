import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEPUIS_APP } from '../../app/historique'
import { DepotsProvider } from '../../data/DepotsContext'
import { surErreurEcriture } from '../../data/erreurs'
import type { Cocktail, Presta, Verre } from '../../domain/types'
import { creerDepotsFactices } from '../../test/depotsFactices'
import { EcranModifierPresta } from './EcranModifierPresta'

const c = (id: string, nom: string, extra: Partial<Cocktail> = {}): Cocktail => ({
  id, nom, nomNormalise: nom.toLowerCase(), alcool: true, archive: false, ...extra,
})
const mojito = c('m', 'Mojito')
const nojito = c('n', 'Nojito', { alcool: false })
const spritz = c('s', 'Spritz', { archive: true })
const mule = c('mm', 'Moscow Mule')

const presta: Presta = {
  id: 'p1', date: '2026-10-17', client: 'Julie Martin', typeId: 't1', statut: 'en-cours',
  lignes: [
    { id: 'L1', cocktailId: 'm', masquee: false },
    { id: 'L2', cocktailId: 's', masquee: false },
    { id: 'L3', cocktailId: 'n', masquee: true },
  ],
}
const v = (id: string, ligneId: string): Verre => ({ id, ligneId, creeLe: 1 })
const verres = { p1: [v('1', 'L1'), v('2', 'L1'), v('3', 'L1'), v('4', 'L3'), v('5', 'L3')] }
const types = [
  { id: 't1', nom: 'Mariage', nomNormalise: 'mariage', archive: true },
  { id: 't2', nom: 'Anniversaire', nomNormalise: 'anniversaire', archive: false },
]

function ecran(
  depots = creerDepotsFactices({ cocktails: [mojito, nojito, spritz, mule], types, prestas: [presta], verres }),
  // Page d'avant dans l'historique, et marque « ouverte depuis l'appli » de la feuille.
  { precedente = '/prestas/p1', depuisApp = true }: { precedente?: string; depuisApp?: boolean } = {},
) {
  render(
    <MemoryRouter
      initialEntries={[precedente, { pathname: '/prestas/p1/modifier', state: depuisApp ? DEPUIS_APP : null }]}
      initialIndex={1}
    >
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

// Écran ouvert directement (lien, rechargement) : aucune page précédente dans l'historique.
function ecranSansHistorique(p: Presta) {
  const depots = creerDepotsFactices({ cocktails: [mojito, nojito, spritz, mule], types, prestas: [p], verres })
  render(
    <MemoryRouter initialEntries={['/prestas/p1/modifier']}>
      <DepotsProvider depots={depots}>
        <Routes>
          <Route path="/prestas/:id" element={<p>COMPTAGE</p>} />
          <Route path="/prestas/:id/resultats" element={<p>RÉSULTATS</p>} />
          <Route path="/prestas/:id/modifier" element={<EcranModifierPresta />} />
        </Routes>
      </DepotsProvider>
    </MemoryRouter>,
  )
  return depots
}

const carte = () => within(screen.getByRole('region', { name: 'Cocktails' }))
const ligne = (nom: string) => carte().getByText(nom).closest('li') as HTMLElement
const clic = (nom: string | RegExp) => fireEvent.click(screen.getByRole('button', { name: nom }))

describe('EcranModifierPresta', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('préremplit date, client et type', () => {
    ecran()
    expect(screen.getByRole('group', { name: 'Date' }).textContent).toContain('17/10/2026')
    expect((screen.getByLabelText('Client') as HTMLInputElement).value).toBe('Julie Martin')
    // Type archivé : reste affiché et proposé puisque c'est celui de la presta.
    expect(screen.getByRole('combobox', { name: 'Type' }).textContent).toBe('Mariage')
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Type' }))
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Aucun', 'Anniversaire', 'Mariage'])
  })

  it('retire directement une ligne à 0', () => {
    ecran()
    fireEvent.click(within(ligne('Spritz')).getByRole('button', { name: /^Retirer/ }))
    expect(carte().queryByText('Spritz')).toBeNull()
    expect(screen.queryByRole('dialog', { name: /^Retirer/ })).toBeNull()
  })

  it('propose trois choix pour une ligne comptée', () => {
    ecran()
    fireEvent.click(within(ligne('Mojito')).getByRole('button', { name: /^Retirer/ }))
    const d = within(screen.getByRole('dialog', { name: 'Retirer Mojito ?' }))
    expect(d.getByRole('button', { name: 'Masquer du comptage (garder les 3 servis)' })).toBeTruthy()
    expect(d.getByRole('button', { name: 'Supprimer avec ses 3 servis' })).toBeTruthy()
    expect(d.getByRole('button', { name: 'Annuler' })).toBeTruthy()
  })

  it('nomme la version sans alcool dans le dialogue de retrait', () => {
    const p = { ...presta, lignes: [presta.lignes[0], { ...presta.lignes[2], masquee: false }] }
    ecran(creerDepotsFactices({ cocktails: [mojito, nojito], types, prestas: [p], verres }))
    fireEvent.click(within(ligne('Nojito')).getByRole('button', { name: /^Retirer/ }))
    const d = within(screen.getByRole('dialog', { name: 'Retirer Nojito (sans alcool) ?' }))
    expect(d.getByRole('button', { name: 'Masquer du comptage (garder les 2 servis)' })).toBeTruthy()
    expect(d.getByRole('button', { name: 'Supprimer avec ses 2 servis' })).toBeTruthy()
  })

  it('accorde le dialogue de retrait pour un seul verre servi', () => {
    ecran(creerDepotsFactices({ cocktails: [mojito, nojito, spritz, mule], types, prestas: [presta], verres: { p1: [v('1', 'L1')] } }))
    fireEvent.click(within(ligne('Mojito')).getByRole('button', { name: /^Retirer/ }))
    const d = within(screen.getByRole('dialog', { name: 'Retirer Mojito ?' }))
    expect(d.getByRole('button', { name: 'Masquer du comptage (garder le 1 servi)' })).toBeTruthy()
    expect(d.getByRole('button', { name: 'Supprimer avec son 1 servi' })).toBeTruthy()
  })

  it('masque une ligne comptée', () => {
    const depots = ecran()
    fireEvent.click(within(ligne('Mojito')).getByRole('button', { name: /^Retirer/ }))
    clic('Masquer du comptage (garder les 3 servis)')
    expect(carte().queryByText('Mojito')).toBeNull()
    clic('Enregistrer')
    expect(depots.prestas.modifier).toHaveBeenCalledWith(
      'p1',
      expect.objectContaining({
        lignes: [{ id: 'L1', cocktailId: 'm', masquee: true }, presta.lignes[1], presta.lignes[2]],
      }),
      [],
    )
  })

  it('supprime une ligne comptée avec ses verres', () => {
    const depots = ecran()
    fireEvent.click(within(ligne('Mojito')).getByRole('button', { name: /^Retirer/ }))
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

  it('ajoute seulement les cocktails absents', () => {
    const depots = ecran()
    clic('+ Ajouter un cocktail')
    const feuille = within(screen.getByRole('dialog', { name: 'Ajouter des cocktails' }))
    const cases = feuille.getAllByRole('checkbox')
    expect(cases).toHaveLength(1)
    expect(cases[0].closest('li')?.textContent).toContain('Moscow Mule')
    expect(feuille.queryByText('Mojito')).toBeNull()
    expect(feuille.queryByText('Spritz')).toBeNull()
    fireEvent.click(cases[0])
    fireEvent.click(feuille.getByRole('button', { name: 'Ajouter' }))
    expect(screen.queryByRole('dialog', { name: 'Ajouter des cocktails' })).toBeNull()
    const avec = within(screen.getByRole('list', { name: 'Avec alcool' }))
    expect(avec.getAllByRole('listitem').map((e) => e.textContent)).toEqual([
      expect.stringContaining('Mojito'),
      expect.stringContaining('Spritz'),
      expect.stringContaining('Moscow Mule'),
    ])
    clic('Enregistrer')
    expect(depots.prestas.modifier).toHaveBeenCalledWith(
      'p1',
      expect.objectContaining({
        lignes: [
          ...presta.lignes,
          expect.objectContaining({ cocktailId: 'mm', masquee: false }),
        ],
      }),
      [],
    )
  })

  it('affiche une ligne dont le cocktail est archivé', () => {
    ecran()
    expect(carte().getByText('Spritz')).toBeTruthy()
  })

  it('n’applique rien avant « Enregistrer »', () => {
    const depots = ecran()
    fireEvent.change(screen.getByLabelText('Client'), { target: { value: 'Paul' } })
    fireEvent.click(within(ligne('Spritz')).getByRole('button', { name: /^Retirer/ }))
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
    clic('Annuler')
    expect(screen.queryByRole('dialog', { name: 'Abandonner les modifications ?' })).toBeNull()
    expect(screen.queryByText('COMPTAGE')).toBeNull()
    clic('Annuler')
    clic('Abandonner')
    await waitFor(() => expect(screen.getByText('COMPTAGE')).toBeTruthy())
  })

  it('traite un tap à côté de la feuille comme Annuler', async () => {
    ecran()
    fireEvent.change(screen.getByLabelText('Client'), { target: { value: 'Paul' } })
    fireEvent.click(document.querySelector('.MuiBackdrop-root')!)
    expect(screen.getByRole('dialog', { name: 'Abandonner les modifications ?' })).toBeTruthy()
    clic('Abandonner')
    await waitFor(() => expect(screen.getByText('COMPTAGE')).toBeTruthy())
  })

  it('revient directement sans modification', async () => {
    ecran()
    clic('Annuler')
    await waitFor(() => expect(screen.getByText('COMPTAGE')).toBeTruthy())
  })

  it('ouverte depuis l’appli, revient à la page d’avant', async () => {
    ecran(undefined, { precedente: '/' })
    clic('Annuler')
    await waitFor(() => expect(screen.getByText('ACCUEIL')).toBeTruthy())
  })

  it('arrivée par une redirection (sans la marque de l’appli), va au comptage plutôt qu’en arrière', async () => {
    ecran(undefined, { precedente: '/', depuisApp: false })
    clic('Annuler')
    await waitFor(() => expect(screen.getByText('COMPTAGE')).toBeTruthy())
  })

  it('supprime la presta après confirmation', async () => {
    const depots = ecran()
    clic('Supprimer')
    expect(screen.getByRole('dialog', { name: 'Supprimer “Julie Martin” et ses 5 cocktails servis ?' })).toBeTruthy()
    expect(depots.prestas.supprimer).not.toHaveBeenCalled()
    clic('Supprimer')
    expect(depots.prestas.supprimer).toHaveBeenCalledWith('p1')
    await waitFor(() => expect(screen.getByText('ACCUEIL')).toBeTruthy())
  })

  it('n’enregistre qu’une fois sur un double tap', async () => {
    const depots = creerDepotsFactices({ cocktails: [mojito, nojito, spritz, mule], types, prestas: [presta], verres })
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
    const depots = creerDepotsFactices({ cocktails: [mojito, nojito, spritz, mule], types, prestas: [presta], verres })
    vi.mocked(depots.prestas.modifier).mockRejectedValue(new Error('hors cache'))
    ecran(depots)
    clic('Enregistrer')
    await waitFor(() => expect(abonne).toHaveBeenCalledTimes(1))
    expect(screen.queryByText('COMPTAGE')).toBeNull()
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeEnabled()
    desabonner()
  })

  it('ne supprime qu’une fois sur un double tap', () => {
    const depots = creerDepotsFactices({ cocktails: [mojito, nojito, spritz, mule], types, prestas: [presta], verres })
    vi.mocked(depots.prestas.supprimer).mockReturnValue(new Promise<void>(() => {}))
    ecran(depots)
    clic('Supprimer')
    clic('Supprimer')
    clic('Supprimer')
    expect(depots.prestas.supprimer).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Supprimer' })).toBeDisabled()
  })

  it('signale un échec de suppression sans rejet non géré', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const abonne = vi.fn()
    const desabonner = surErreurEcriture(abonne)
    const depots = creerDepotsFactices({ cocktails: [mojito, nojito, spritz, mule], types, prestas: [presta], verres })
    vi.mocked(depots.prestas.supprimer).mockRejectedValue(new Error('hors cache'))
    ecran(depots)
    clic('Supprimer')
    clic('Supprimer')
    await waitFor(() => expect(abonne).toHaveBeenCalledTimes(1))
    expect(screen.queryByText('ACCUEIL')).toBeNull()
    expect(screen.getByRole('button', { name: 'Supprimer' })).toBeEnabled()
    desabonner()
  })

  it('enregistre la date choisie dans le calendrier', async () => {
    const depots = ecran()
    fireEvent.click(screen.getByRole('button', { name: /Choisir la date/ }))
    fireEvent.click(screen.getByRole('gridcell', { name: '24' }))
    // Le calendrier se referme en fondu : l'écran redevient accessible ensuite.
    fireEvent.click(await screen.findByRole('button', { name: 'Enregistrer' }))
    expect(depots.prestas.modifier).toHaveBeenCalledWith('p1', expect.objectContaining({ date: '2026-10-24' }), [])
    await waitFor(() => expect(screen.getByText('COMPTAGE')).toBeTruthy())
  })

  it('sans page précédente, revient au comptage d’une presta en cours', async () => {
    ecranSansHistorique(presta)
    clic('Annuler')
    await waitFor(() => expect(screen.getByText('COMPTAGE')).toBeTruthy())
  })

  it('sans page précédente, revient aux résultats d’une presta terminée', async () => {
    ecranSansHistorique({ ...presta, statut: 'terminee' })
    clic('Enregistrer')
    await waitFor(() => expect(screen.getByText('RÉSULTATS')).toBeTruthy())
  })

  it('retourne à l’accueil si la presta n’existe pas', async () => {
    ecran(creerDepotsFactices({ cocktails: [mojito], types, prestas: [] }))
    await waitFor(() => expect(screen.getByText('ACCUEIL')).toBeTruthy())
  })
})
