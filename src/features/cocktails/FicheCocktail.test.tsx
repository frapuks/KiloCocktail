import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { Cocktail } from '../../domain/types'
import { FicheCocktail } from './FicheCocktail'

const mojito: Cocktail = { id: 'm', nom: 'Mojito', nomNormalise: 'mojito', alcool: true, archive: false }
const nojito: Cocktail = { ...mojito, id: 'n', alcool: false }

function monter(props: Partial<ComponentProps<typeof FicheCocktail>> = {}) {
  const onEnregistrer = vi.fn()
  const onAnnuler = vi.fn()
  render(<FicheCocktail cocktails={[]} onEnregistrer={onEnregistrer} onAnnuler={onAnnuler} {...props} />)
  return { onEnregistrer, onAnnuler }
}
const saisirNom = (v: string) => fireEvent.change(screen.getByLabelText('Nom'), { target: { value: v } })
const enregistrer = () => fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

describe('FicheCocktail', () => {
  it('sélectionne « Avec alcool » par défaut, sans champ de nom sans alcool', () => {
    monter()
    expect((screen.getByLabelText('Avec alcool') as HTMLInputElement).checked).toBe(true)
    expect(screen.queryByLabelText('Nom de la version sans alcool')).toBeNull()
  })

  it('enregistre un cocktail sans alcool', () => {
    const { onEnregistrer } = monter()
    saisirNom('  Nojito ')
    fireEvent.click(screen.getByLabelText('Sans alcool'))
    enregistrer()
    expect(onEnregistrer).toHaveBeenCalledWith({ nom: 'Nojito', alcool: false })
  })

  it('accepte un homonyme de l’autre version', () => {
    const { onEnregistrer } = monter({ cocktails: [mojito] })
    saisirNom('Mojito')
    fireEvent.click(screen.getByLabelText('Sans alcool'))
    enregistrer()
    expect(onEnregistrer).toHaveBeenCalledWith({ nom: 'Mojito', alcool: false })
  })

  it('refuse de passer en sans alcool si l’homonyme sans alcool existe', () => {
    const { onEnregistrer } = monter({ cocktail: mojito, cocktails: [mojito, nojito] })
    fireEvent.click(screen.getByLabelText('Sans alcool'))
    enregistrer()
    expect(screen.getByRole('alert').textContent).toBe('Un cocktail “Mojito” sans alcool existe déjà')
    expect(onEnregistrer).not.toHaveBeenCalled()
  })

  it('signale un homonyme archivé de la même version', () => {
    const { onEnregistrer } = monter({ cocktails: [{ ...nojito, archive: true }] })
    saisirNom('Mojito')
    fireEvent.click(screen.getByLabelText('Sans alcool'))
    enregistrer()
    expect(
      screen.getByText('Un cocktail “Mojito” sans alcool existe déjà dans les archivés. Désarchive-le plutôt.'),
    ).toBeTruthy()
    expect(onEnregistrer).not.toHaveBeenCalled()
  })

  it('enregistre sans changement alors que l’homonyme de l’autre version existe', () => {
    const { onEnregistrer } = monter({ cocktail: mojito, cocktails: [mojito, nojito] })
    enregistrer()
    expect(onEnregistrer).toHaveBeenCalledWith({ nom: 'Mojito', alcool: true })
  })

  it('refuse un nom vide', () => {
    const { onEnregistrer } = monter()
    saisirNom('   ')
    enregistrer()
    expect(screen.getByText('Donne un nom au cocktail')).toBeTruthy()
    expect(onEnregistrer).not.toHaveBeenCalled()
  })

  it('refuse un doublon actif de la même version', () => {
    const { onEnregistrer } = monter({ cocktails: [mojito] })
    saisirNom('mojito')
    enregistrer()
    expect(screen.getByText('Un cocktail “Mojito” avec alcool existe déjà')).toBeTruthy()
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
