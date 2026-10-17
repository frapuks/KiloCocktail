import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { Cocktail } from '../../domain/types'
import { FicheCocktail } from './FicheCocktail'

const mojito: Cocktail = { id: 'm', nom: 'Mojito', nomNormalise: 'mojito', variantes: 'avec', nomSansAlcool: null, archive: false }

function monter(props: Partial<ComponentProps<typeof FicheCocktail>> = {}) {
  const onEnregistrer = vi.fn()
  const onAnnuler = vi.fn()
  render(<FicheCocktail cocktails={[]} onEnregistrer={onEnregistrer} onAnnuler={onAnnuler} {...props} />)
  return { onEnregistrer, onAnnuler }
}
const saisirNom = (v: string) => fireEvent.change(screen.getByLabelText('Nom'), { target: { value: v } })
const enregistrer = () => fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

describe('FicheCocktail', () => {
  it('sélectionne « Avec alcool uniquement » par défaut', () => {
    monter()
    expect((screen.getByLabelText('Avec alcool uniquement') as HTMLInputElement).checked).toBe(true)
  })

  it('affiche le nom sans alcool seulement pour « Les deux »', () => {
    monter()
    expect(screen.queryByLabelText('Nom de la version sans alcool')).toBeNull()
    fireEvent.click(screen.getByLabelText('Sans alcool uniquement'))
    expect(screen.queryByLabelText('Nom de la version sans alcool')).toBeNull()
    fireEvent.click(screen.getByLabelText('Les deux'))
    expect(screen.getByLabelText('Nom de la version sans alcool')).toBeTruthy()
  })

  it('enregistre les données saisies', () => {
    const { onEnregistrer } = monter()
    saisirNom('  Mojito ')
    fireEvent.click(screen.getByLabelText('Les deux'))
    fireEvent.change(screen.getByLabelText('Nom de la version sans alcool'), { target: { value: 'Nojito' } })
    enregistrer()
    expect(onEnregistrer).toHaveBeenCalledWith({ nom: 'Mojito', variantes: 'les-deux', nomSansAlcool: 'Nojito' })
  })

  it('met nomSansAlcool à null si vide', () => {
    const { onEnregistrer } = monter()
    saisirNom('Mojito')
    fireEvent.click(screen.getByLabelText('Les deux'))
    enregistrer()
    expect(onEnregistrer).toHaveBeenCalledWith({ nom: 'Mojito', variantes: 'les-deux', nomSansAlcool: null })
  })

  it('met nomSansAlcool à null si variantes ≠ les-deux', () => {
    const { onEnregistrer } = monter()
    fireEvent.click(screen.getByLabelText('Les deux'))
    fireEvent.change(screen.getByLabelText('Nom de la version sans alcool'), { target: { value: 'Nojito' } })
    fireEvent.click(screen.getByLabelText('Sans alcool uniquement'))
    saisirNom('Mojito')
    enregistrer()
    expect(onEnregistrer).toHaveBeenCalledWith({ nom: 'Mojito', variantes: 'sans', nomSansAlcool: null })
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
    expect(screen.getByText('Un cocktail “Mojito” existe déjà')).toBeTruthy()
    expect(onEnregistrer).not.toHaveBeenCalled()
  })

  it('refuse un doublon archivé', () => {
    const { onEnregistrer } = monter({ cocktails: [{ ...mojito, archive: true }] })
    saisirNom('Mojito')
    enregistrer()
    expect(screen.getByText('Un cocktail “Mojito” existe déjà dans les archivés. Désarchive-le plutôt.')).toBeTruthy()
    expect(onEnregistrer).not.toHaveBeenCalled()
  })

  it('ne considère pas le cocktail modifié comme son propre doublon', () => {
    const { onEnregistrer } = monter({ cocktail: mojito, cocktails: [mojito] })
    enregistrer()
    expect(onEnregistrer).toHaveBeenCalledWith({ nom: 'Mojito', variantes: 'avec', nomSansAlcool: null })
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
