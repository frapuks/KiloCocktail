import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { Base, Cocktail } from '../../domain/types'
import { FicheCocktail } from './FicheCocktail'

const mojito: Cocktail = { id: 'm', nom: 'Mojito', nomNormalise: 'mojito', alcool: true, archive: false }
const nojito: Cocktail = { ...mojito, id: 'n', nom: 'Nojito', nomNormalise: 'nojito', alcool: false }

function monter(props: Partial<ComponentProps<typeof FicheCocktail>> = {}) {
  const onEnregistrer = vi.fn()
  const onAnnuler = vi.fn()
  render(<FicheCocktail cocktails={[]} bases={[]} onEnregistrer={onEnregistrer} onAnnuler={onAnnuler} {...props} />)
  return { onEnregistrer, onAnnuler }
}
const saisirNom = (v: string) => fireEvent.change(screen.getByLabelText('Nom'), { target: { value: v } })
const enregistrer = () => fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
const version = (nom: string) => screen.getByRole('button', { name: nom })
const rhum: Base = { id: 'r', nom: 'Rhum', nomNormalise: 'rhum', archive: false }
const vodka: Base = { id: 'v', nom: 'Vodka', nomNormalise: 'vodka', archive: false }
function choisirBase(champ: string, nom: string) {
  fireEvent.mouseDown(screen.getByRole('combobox', { name: champ }))
  fireEvent.click(screen.getByRole('option', { name: nom }))
}

describe('FicheCocktail', () => {
  it('crée avec alcool par défaut, avec le choix Avec / Sans / Les deux', () => {
    monter()
    expect(version('Avec alcool')).toHaveAttribute('aria-pressed', 'true')
    expect(version('Les deux')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.queryByRole('switch', { name: 'Alcool' })).toBeNull()
  })

  it('enregistre un cocktail sans alcool', () => {
    const { onEnregistrer } = monter()
    saisirNom('  Nojito ')
    fireEvent.click(version('Sans alcool'))
    enregistrer()
    expect(onEnregistrer).toHaveBeenCalledWith([{ nom: 'Nojito', alcool: false, description: '', baseId: null }])
  })

  it('accepte un homonyme dans l’autre version', () => {
    const { onEnregistrer } = monter({ cocktails: [mojito] })
    saisirNom('Mojito')
    fireEvent.click(version('Sans alcool'))
    enregistrer()
    expect(onEnregistrer).toHaveBeenCalledWith([{ nom: 'Mojito', alcool: false, description: '', baseId: null }])
  })

  it('signale un homonyme archivé de la même version', () => {
    const { onEnregistrer } = monter({ cocktails: [{ ...nojito, archive: true }] })
    saisirNom('nojito')
    fireEvent.click(version('Sans alcool'))
    enregistrer()
    expect(
      screen.getByText('Un cocktail sans alcool “Nojito” existe déjà dans les archivés. Désarchive-le plutôt.'),
    ).toBeTruthy()
    expect(onEnregistrer).not.toHaveBeenCalled()
  })

  it('crée les deux versions, chacune avec sa description', () => {
    const { onEnregistrer } = monter()
    saisirNom('Mojito')
    fireEvent.click(version('Les deux'))
    fireEvent.change(screen.getByLabelText('Description avec alcool'), { target: { value: 'Rhum, menthe' } })
    fireEvent.change(screen.getByLabelText('Description sans alcool'), { target: { value: 'Menthe' } })
    enregistrer()
    expect(onEnregistrer).toHaveBeenCalledWith([
      { nom: 'Mojito', alcool: true, description: 'Rhum, menthe', baseId: null },
      { nom: 'Mojito', alcool: false, description: 'Menthe', baseId: null },
    ])
  })

  it('copie la base et la description avec alcool vers la version sans alcool', () => {
    const { onEnregistrer } = monter({ bases: [rhum, vodka] })
    saisirNom('Mojito')
    fireEvent.click(version('Les deux'))
    const copier = screen.getByRole('button', { name: 'Copier vers la version sans alcool' })
    expect(copier).toBeDisabled()
    choisirBase('Base avec alcool', 'Rhum')
    fireEvent.change(screen.getByLabelText('Description avec alcool'), { target: { value: 'Rhum, menthe' } })
    fireEvent.click(copier)
    expect(screen.getByLabelText('Description sans alcool')).toHaveValue('Rhum, menthe')
    enregistrer()
    expect(onEnregistrer).toHaveBeenCalledWith([
      { nom: 'Mojito', alcool: true, description: 'Rhum, menthe', baseId: 'r' },
      { nom: 'Mojito', alcool: false, description: 'Rhum, menthe', baseId: 'r' },
    ])
  })

  it('propose les bases actives, et garde l’archivée déjà choisie', () => {
    const vieille = { ...vodka, archive: true }
    const { onEnregistrer } = monter({ cocktail: { ...mojito, baseId: 'v' }, cocktails: [mojito], bases: [rhum, vieille] })
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Base' }))
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Aucune', 'Rhum', 'Vodka'])
    fireEvent.click(screen.getByRole('option', { name: 'Rhum' }))
    enregistrer()
    expect(onEnregistrer).toHaveBeenCalledWith([{ nom: 'Mojito', alcool: true, description: '', baseId: 'r' }])
  })

  it('refuse « Les deux » si l’une des versions existe déjà', () => {
    const { onEnregistrer } = monter({ cocktails: [{ ...nojito, nom: 'Mojito', nomNormalise: 'mojito' }] })
    saisirNom('Mojito')
    fireEvent.click(version('Les deux'))
    enregistrer()
    expect(screen.getByRole('alert').textContent).toBe('Un cocktail sans alcool “Mojito” existe déjà')
    expect(onEnregistrer).not.toHaveBeenCalled()
  })

  it('passe en sans alcool sans changer de nom', () => {
    const { onEnregistrer } = monter({ cocktail: mojito, cocktails: [mojito, nojito] })
    fireEvent.click(screen.getByRole('switch', { name: 'Alcool' }))
    enregistrer()
    expect(onEnregistrer).toHaveBeenCalledWith([{ nom: 'Mojito', alcool: false, description: '', baseId: null }])
  })

  it('refuse de passer en sans alcool si ce nom existe déjà sans alcool', () => {
    const mojitoSans = { ...nojito, nom: 'Mojito', nomNormalise: 'mojito' }
    const { onEnregistrer } = monter({ cocktail: mojito, cocktails: [mojito, mojitoSans] })
    fireEvent.click(screen.getByRole('switch', { name: 'Alcool' }))
    enregistrer()
    expect(screen.getByRole('alert').textContent).toBe('Un cocktail sans alcool “Mojito” existe déjà')
    expect(onEnregistrer).not.toHaveBeenCalled()
  })

  it('enregistre la description, sans les espaces autour', () => {
    const { onEnregistrer } = monter()
    saisirNom('Spritz')
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: '  Apérol, prosecco\n' } })
    enregistrer()
    expect(onEnregistrer).toHaveBeenCalledWith([{ nom: 'Spritz', alcool: true, description: 'Apérol, prosecco', baseId: null }])
  })

  it('reprend la description en modification', () => {
    monter({ cocktail: { ...mojito, description: 'Rhum, menthe' }, cocktails: [mojito] })
    expect(screen.getByLabelText('Description')).toHaveValue('Rhum, menthe')
  })

  it('refuse un nom vide', () => {
    const { onEnregistrer } = monter()
    saisirNom('   ')
    enregistrer()
    expect(screen.getByText('Donne un nom au cocktail')).toBeTruthy()
    expect(onEnregistrer).not.toHaveBeenCalled()
  })

  it('refuse un doublon actif', () => {
    const { onEnregistrer } = monter({ cocktails: [mojito] })
    saisirNom('mojito')
    enregistrer()
    expect(screen.getByText('Un cocktail avec alcool “Mojito” existe déjà')).toBeTruthy()
    expect(onEnregistrer).not.toHaveBeenCalled()
  })

  it('rappelle que le renommage s’applique partout', () => {
    monter({ cocktail: mojito, cocktails: [mojito] })
    const rappel = "Le nouveau nom s'affichera aussi dans les prestas passées."
    expect(screen.queryByText(rappel)).toBeNull()
    saisirNom('Mojito royal')
    expect(screen.getByText(rappel)).toBeTruthy()
  })

  it('propose « Archiver » seulement en modification', () => {
    monter()
    expect(screen.queryByRole('button', { name: 'Archiver' })).toBeNull()
    cleanup()
    const onArchiver = vi.fn()
    monter({ cocktail: mojito, onArchiver })
    fireEvent.click(screen.getByRole('button', { name: 'Archiver' }))
    expect(onArchiver).toHaveBeenCalled()
  })

  it('« Annuler » appelle onAnnuler', () => {
    const { onAnnuler } = monter()
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(onAnnuler).toHaveBeenCalled()
  })
})
