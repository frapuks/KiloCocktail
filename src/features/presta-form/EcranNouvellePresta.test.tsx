import { fireEvent, screen, within } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { dateDuJour } from '../../domain/affichage'
import type { Cocktail } from '../../domain/types'
import { creerDepotsFactices } from '../../test/depotsFactices'
import { rendre } from '../../test/rendre'
import { EcranNouvellePresta } from './EcranNouvellePresta'

const c = (id: string, nom: string, extra: Partial<Cocktail> = {}): Cocktail => ({
  id, nom, nomNormalise: nom.toLowerCase(), alcool: true, archive: false, ...extra,
})
const mojito = c('m', 'Mojito')
const nojito = c('n', 'Nojito', { alcool: false })

function ecran(depots = creerDepotsFactices({ cocktails: [mojito, nojito, c('d', 'Daiquiri'), c('v', 'Vieux', { archive: true })] })) {
  rendre(
    <Routes>
      <Route path="/" element={<p>ACCUEIL</p>} />
      <Route path="/prestas/nouvelle" element={<EcranNouvellePresta />} />
      <Route path="/prestas/:id" element={<p>COMPTAGE</p>} />
    </Routes>,
    { depots, route: '/prestas/nouvelle' },
  )
  return depots
}

const carte = (nom: 'Avec alcool' | 'Sans alcool') => within(screen.getByRole('list', { name: nom }))

function ouvrirAjout() {
  fireEvent.click(screen.getByRole('button', { name: '+ Ajouter un cocktail' }))
  return within(screen.getByRole('dialog', { name: 'Ajouter des cocktails' }))
}

describe('EcranNouvellePresta', () => {
  it('préremplit la date du jour', () => {
    const depots = ecran()
    fireEvent.click(screen.getByRole('button', { name: 'Créer la presta' }))
    expect(depots.prestas.creer).toHaveBeenCalledWith(expect.objectContaining({ date: dateDuJour() }))
  })

  it('prend la date choisie dans le calendrier', async () => {
    const depots = ecran()
    fireEvent.click(screen.getByRole('button', { name: /Choisir la date/ }))
    fireEvent.click(screen.getByRole('gridcell', { name: '28' }))
    // Le calendrier se referme en fondu : la feuille redevient accessible ensuite.
    fireEvent.click(await screen.findByRole('button', { name: 'Créer la presta' }))
    expect(depots.prestas.creer).toHaveBeenCalledWith(expect.objectContaining({ date: `${dateDuJour().slice(0, 8)}28` }))
  })

  it('n’affiche plus la liste des cocktails dans le formulaire', () => {
    ecran()
    expect(screen.queryByRole('checkbox')).toBeNull()
    expect(screen.getByRole('heading', { name: 'Cocktails' })).toBeTruthy()
  })

  it('propose les cocktails actifs à cocher, sans les archivés', () => {
    ecran()
    const feuille = ouvrirAjout()
    expect(feuille.queryByText('Vieux')).toBeNull()
    expect(feuille.getAllByRole('checkbox')).toHaveLength(3)
  })

  it('titre la feuille d’ajout et filtre avec ou sans alcool, sans perdre les cases cochées', () => {
    ecran()
    const feuille = ouvrirAjout()
    expect(feuille.getByRole('heading', { name: 'Ajouter des cocktails' })).toBeInTheDocument()
    fireEvent.click(feuille.getByRole('checkbox', { name: /Mojito/ }))
    fireEvent.click(feuille.getByRole('button', { name: 'Sans alcool (1)' }))
    expect(feuille.getAllByRole('checkbox').map((c) => c.closest('li')?.textContent)).toEqual(['NojitoSans alcool'])
    fireEvent.click(feuille.getByRole('button', { name: 'Tous (3)' }))
    expect((feuille.getByRole('checkbox', { name: /Mojito/ }) as HTMLInputElement).checked).toBe(true)
  })

  it('filtre la feuille d’ajout par base', () => {
    ecran(
      creerDepotsFactices({
        cocktails: [c('m', 'Mojito', { baseId: 'r' }), c('d', 'Daiquiri', { baseId: 'r' }), c('s', 'Spritz')],
        bases: [{ id: 'r', nom: 'Rhum', nomNormalise: 'rhum', archive: false }],
      }),
    )
    const feuille = ouvrirAjout()
    fireEvent.mouseDown(feuille.getByRole('combobox', { name: 'Base' }))
    fireEvent.click(screen.getByRole('option', { name: 'Rhum' }))
    expect(feuille.getAllByRole('checkbox').map((c) => c.closest('li')?.textContent)).toEqual(['Daiquiri', 'Mojito'])
    expect(feuille.getByRole('button', { name: 'Tous (2)' })).toBeInTheDocument()
  })

  it('n’a plus de bouton de version par cocktail', () => {
    ecran()
    expect(screen.queryByRole('button', { name: 'Sans alcool' })).toBeNull()
  })

  it('ajoute les cocktails cochés à la carte, rangés selon leur booléen', () => {
    ecran()
    const feuille = ouvrirAjout()
    fireEvent.click(feuille.getByRole('checkbox', { name: /Nojito/ }))
    fireEvent.click(feuille.getByRole('checkbox', { name: /Mojito/ }))
    fireEvent.click(feuille.getByRole('button', { name: 'Ajouter' }))
    expect(screen.queryByRole('dialog', { name: 'Ajouter des cocktails' })).toBeNull()
    expect(carte('Sans alcool').getByText('Nojito')).toBeTruthy()
    expect(carte('Avec alcool').getByText('Mojito')).toBeTruthy()
  })

  it('annule l’ajout sans rien mettre sur la carte', () => {
    ecran()
    const feuille = ouvrirAjout()
    fireEvent.click(feuille.getByRole('checkbox', { name: /Mojito/ }))
    fireEvent.click(feuille.getByRole('button', { name: 'Annuler' }))
    expect(screen.queryByRole('list', { name: 'Avec alcool' })).toBeNull()
  })

  it('ne repropose pas un cocktail déjà sur la carte, et le retire sans confirmation', () => {
    ecran()
    let feuille = ouvrirAjout()
    fireEvent.click(feuille.getByRole('checkbox', { name: /Mojito/ }))
    fireEvent.click(feuille.getByRole('button', { name: 'Ajouter' }))
    feuille = ouvrirAjout()
    expect(feuille.queryByRole('checkbox', { name: /Mojito/ })).toBeNull()
    fireEvent.click(feuille.getByRole('button', { name: 'Annuler' }))
    fireEvent.click(carte('Avec alcool').getByRole('button', { name: 'Retirer Mojito' }))
    expect(screen.queryByRole('list', { name: 'Avec alcool' })).toBeNull()
  })

  it('ne propose pas de créer un cocktail à la volée', () => {
    ecran()
    const feuille = ouvrirAjout()
    expect(feuille.queryByRole('button', { name: /Créer un cocktail/ })).toBeNull()
  })

  it('choisit un type actif dans le menu, sans proposer d’en créer', async () => {
    const depots = ecran(
      creerDepotsFactices({
        types: [
          { id: 't2', nom: 'Mariage', nomNormalise: 'mariage', archive: false },
          { id: 't1', nom: 'Anniversaire', nomNormalise: 'anniversaire', archive: false },
          { id: 't3', nom: 'Ancien', nomNormalise: 'ancien', archive: true },
        ],
      }),
    )
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Type' }))
    const options = screen.getAllByRole('option').map((o) => o.textContent)
    expect(options).toEqual(['Aucun', 'Anniversaire', 'Mariage'])
    fireEvent.click(screen.getByRole('option', { name: 'Mariage' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Créer la presta' }))
    expect(depots.prestas.creer).toHaveBeenCalledWith(expect.objectContaining({ typeId: 't2' }))
  })

  it('ne crée qu’une presta sur un double tap de « Créer la presta »', () => {
    const depots = ecran()
    const bouton = screen.getByRole('button', { name: 'Créer la presta' })
    fireEvent.click(bouton)
    fireEvent.click(bouton)
    expect(depots.prestas.creer).toHaveBeenCalledTimes(1)
  })

  it('crée la presta même sans cocktail, puis revient à la liste sans ouvrir le comptage', async () => {
    const depots = ecran()
    fireEvent.click(screen.getByRole('button', { name: 'Créer la presta' }))
    expect(depots.prestas.creer).toHaveBeenCalledWith({ date: dateDuJour(), client: null, typeId: null, lignes: [] })
    expect(await screen.findByText('ACCUEIL')).toBeTruthy()
    expect(screen.queryByText('COMPTAGE')).toBeNull()
  })

  it('enregistre le client saisi', () => {
    const depots = ecran()
    fireEvent.change(screen.getByLabelText('Client'), { target: { value: '  Léa  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Créer la presta' }))
    expect(depots.prestas.creer).toHaveBeenCalledWith(expect.objectContaining({ client: 'Léa' }))
  })

  it('enregistre un client composé d’espaces comme null', () => {
    const depots = ecran()
    fireEvent.change(screen.getByLabelText('Client'), { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Créer la presta' }))
    expect(depots.prestas.creer).toHaveBeenCalledWith(expect.objectContaining({ client: null }))
  })

  it('annule sans rien créer', async () => {
    const depots = ecran()
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(await screen.findByText('ACCUEIL')).toBeTruthy()
    expect(depots.prestas.creer).not.toHaveBeenCalled()
  })
})
