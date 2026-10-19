import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Cocktail } from '../../domain/types'
import { creerDepotsFactices } from '../../test/depotsFactices'
import { rendre } from '../../test/rendre'
import { EcranCocktails } from './EcranCocktails'

const c = (id: string, nom: string, extra: Partial<Cocktail> = {}): Cocktail => ({
  id, nom, nomNormalise: nom.toLowerCase(), alcool: true, archive: false, ...extra,
})

describe('EcranCocktails', () => {
  it('liste les cocktails actifs triés, une pastille par ligne', () => {
    const depots = creerDepotsFactices({
      cocktails: [
        c('1', 'Spritz'),
        c('2', 'Mojito', { alcool: false }),
        c('3', 'Mojito'),
        c('4', 'Vieux', { alcool: false, archive: true }),
      ],
    })
    rendre(<EcranCocktails />, { depots })
    const lignes = screen.getAllByRole('button', { name: /(Mojito|Spritz)/ }).map((b) => b.textContent ?? '')
    expect(lignes).toEqual(['MojitoAvec alcool', 'MojitoSans alcool', 'SpritzAvec alcool'])
    expect(screen.getAllByText('Avec alcool')).toHaveLength(2)
    expect(screen.getAllByText('Sans alcool')).toHaveLength(1)
    expect(screen.getByText('Vieux · sans alcool')).toBeTruthy()
  })

  it('range les archivés dans une section repliée et désarchive', () => {
    const depots = creerDepotsFactices({ cocktails: [c('4', 'Vieux', { archive: true })] })
    rendre(<EcranCocktails />, { depots })
    const section = screen.getByText('Archivés').closest('details') as HTMLDetailsElement
    expect(section.open).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'Désarchiver', hidden: true }))
    expect(depots.cocktails.archiver).toHaveBeenCalledWith('4', false)
  })

  it('masque la section Archivés s’il n’y en a pas', () => {
    rendre(<EcranCocktails />, { depots: creerDepotsFactices({ cocktails: [c('1', 'Daiquiri')] }) })
    expect(screen.queryByText('Archivés')).toBeNull()
  })

  it('crée un cocktail', () => {
    const depots = creerDepotsFactices()
    rendre(<EcranCocktails />, { depots })
    fireEvent.click(screen.getByRole('button', { name: 'Nouveau cocktail' }))
    fireEvent.change(screen.getByLabelText('Nom'), { target: { value: 'Spritz' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(depots.cocktails.creer).toHaveBeenCalledWith({ nom: 'Spritz', alcool: true })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('modifie un cocktail au tap sur sa ligne', () => {
    const depots = creerDepotsFactices({ cocktails: [c('1', 'Daiquiri')] })
    rendre(<EcranCocktails />, { depots })
    fireEvent.click(screen.getByRole('button', { name: /Daiquiri/ }))
    fireEvent.change(screen.getByLabelText('Nom'), { target: { value: 'Daiquiri fraise' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(depots.cocktails.modifier).toHaveBeenCalledWith('1', { nom: 'Daiquiri fraise', alcool: true })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('archive depuis la fiche', () => {
    const depots = creerDepotsFactices({ cocktails: [c('1', 'Daiquiri')] })
    rendre(<EcranCocktails />, { depots })
    fireEvent.click(screen.getByRole('button', { name: /Daiquiri/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Archiver' }))
    expect(depots.cocktails.archiver).toHaveBeenCalledWith('1', true)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('« Annuler » ferme la fiche sans enregistrer', () => {
    const depots = creerDepotsFactices()
    rendre(<EcranCocktails />, { depots })
    fireEvent.click(screen.getByRole('button', { name: 'Nouveau cocktail' }))
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(depots.cocktails.creer).not.toHaveBeenCalled()
  })
})
