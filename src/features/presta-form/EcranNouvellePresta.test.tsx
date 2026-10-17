import { fireEvent, screen, within } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { dateDuJour } from '../../domain/affichage'
import type { Cocktail } from '../../domain/types'
import { creerDepotsFactices } from '../../test/depotsFactices'
import { rendre } from '../../test/rendre'
import { EcranNouvellePresta } from './EcranNouvellePresta'

const c = (id: string, nom: string, extra: Partial<Cocktail> = {}): Cocktail => ({
  id, nom, nomNormalise: nom.toLowerCase(), variantes: 'avec', nomSansAlcool: null, archive: false, ...extra,
})
const mojito = c('m', 'Mojito', { variantes: 'les-deux', nomSansAlcool: 'Nojito' })

function ecran(depots = creerDepotsFactices({ cocktails: [mojito, c('d', 'Daiquiri'), c('v', 'Vieux', { archive: true })] })) {
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

describe('EcranNouvellePresta', () => {
  it('préremplit la date du jour', () => {
    ecran()
    expect((screen.getByLabelText('Date') as HTMLInputElement).value).toBe(dateDuJour())
  })

  it('ignore une date vidée', () => {
    const depots = ecran()
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-12-31' } })
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '' } })
    expect((screen.getByLabelText('Date') as HTMLInputElement).value).toBe('2026-12-31')
    fireEvent.click(screen.getByRole('button', { name: 'Commencer la presta' }))
    expect(depots.prestas.creer).toHaveBeenCalledWith(expect.objectContaining({ date: '2026-12-31' }))
  })

  it('n’affiche pas les cocktails archivés', () => {
    ecran()
    expect(screen.queryByText('Vieux')).toBeNull()
    expect(screen.getByText('Daiquiri')).toBeTruthy()
  })

  it('coche toutes les variantes d’un cocktail', () => {
    ecran()
    fireEvent.click(screen.getByRole('checkbox', { name: /Mojito/ }))
    expect(carte('Avec alcool').getByText('Mojito')).toBeTruthy()
    expect(carte('Sans alcool').getByText('Nojito')).toBeTruthy()
  })

  it('éteint une variante, et décoche le cocktail quand plus aucune n’est active', () => {
    ecran()
    const case_ = screen.getByRole('checkbox', { name: /Mojito/ }) as HTMLInputElement
    fireEvent.click(case_)
    const ligne = case_.closest('li') as HTMLElement
    fireEvent.click(within(ligne).getByRole('button', { name: 'Sans alcool' }))
    expect(screen.queryByRole('list', { name: 'Sans alcool' })).toBeNull()
    expect(case_.checked).toBe(true)
    fireEvent.click(within(ligne).getByRole('button', { name: 'Avec alcool' }))
    expect(case_.checked).toBe(false)
    expect(screen.queryByRole('list', { name: 'Avec alcool' })).toBeNull()
  })

  it('crée un cocktail à la volée et le coche', () => {
    const depots = ecran()
    fireEvent.click(screen.getByRole('button', { name: '+ Créer un cocktail' }))
    fireEvent.change(screen.getByLabelText('Nom'), { target: { value: 'Spritz' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(depots.cocktails.creer).toHaveBeenCalledWith({ nom: 'Spritz', variantes: 'avec', nomSansAlcool: null })
    expect((screen.getByRole('checkbox', { name: /Spritz/ }) as HTMLInputElement).checked).toBe(true)
    expect(carte('Avec alcool').getByText('Spritz')).toBeTruthy()
  })

  it('refuse un nom déjà pris par un cocktail archivé', () => {
    const depots = ecran()
    fireEvent.click(screen.getByRole('button', { name: '+ Créer un cocktail' }))
    fireEvent.change(screen.getByLabelText('Nom'), { target: { value: 'vieux' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(screen.getByRole('alert').textContent).toBe(
      'Un cocktail “Vieux” existe déjà dans les archivés. Désarchive-le plutôt.',
    )
    expect(depots.cocktails.creer).not.toHaveBeenCalled()
  })

  it('ajoute un type à la volée et le sélectionne', () => {
    const depots = ecran()
    fireEvent.change(screen.getByLabelText('Type'), { target: { value: '__ajouter__' } })
    fireEvent.change(screen.getByLabelText('Nom'), { target: { value: 'Mariage' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(depots.types.creer).toHaveBeenCalledWith('Mariage')
    const select = screen.getByLabelText('Type') as HTMLSelectElement
    expect(select.value).toBe('nouvel-id')
    expect(select.selectedOptions[0].textContent).toBe('Mariage')
  })

  it('commence la presta même sans cocktail', () => {
    const depots = ecran()
    fireEvent.click(screen.getByRole('button', { name: 'Commencer la presta' }))
    expect(depots.prestas.creer).toHaveBeenCalledWith({ date: dateDuJour(), client: null, typeId: null, lignes: [] })
    expect(screen.getByText('COMPTAGE')).toBeTruthy()
  })

  it('enregistre le client saisi', () => {
    const depots = ecran()
    fireEvent.change(screen.getByLabelText('Client'), { target: { value: '  Léa  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Commencer la presta' }))
    expect(depots.prestas.creer).toHaveBeenCalledWith(expect.objectContaining({ client: 'Léa' }))
  })

  it('enregistre un client composé d’espaces comme null', () => {
    const depots = ecran()
    fireEvent.change(screen.getByLabelText('Client'), { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Commencer la presta' }))
    expect(depots.prestas.creer).toHaveBeenCalledWith(expect.objectContaining({ client: null }))
  })

  it('annule sans rien créer', () => {
    const depots = ecran()
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(screen.getByText('ACCUEIL')).toBeTruthy()
    expect(depots.prestas.creer).not.toHaveBeenCalled()
  })
})
