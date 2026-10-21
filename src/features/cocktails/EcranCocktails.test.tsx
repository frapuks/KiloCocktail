import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Cocktail } from '../../domain/types'
import { creerDepotsFactices } from '../../test/depotsFactices'
import { rendre } from '../../test/rendre'
import { EcranCocktails } from './EcranCocktails'

const c = (id: string, nom: string, extra: Partial<Cocktail> = {}): Cocktail => ({
  id, nom, nomNormalise: nom.toLowerCase(), alcool: true, archive: false, ...extra,
})

// Texte des lignes de liste affichées (les icônes n'en ont pas).
const lignes = () => screen.queryAllByRole('listitem').map((li) => li.textContent ?? '')

describe('EcranCocktails', () => {
  it('liste les cocktails actifs triés, pastille sur les sans alcool seulement', () => {
    const depots = creerDepotsFactices({
      cocktails: [
        c('1', 'Spritz'),
        c('2', 'Nojito', { alcool: false }),
        c('3', 'Mojito'),
        c('4', 'Vieux', { alcool: false, archive: true }),
      ],
    })
    rendre(<EcranCocktails />, { depots })
    expect(lignes()).toEqual(['Mojito', 'NojitoSans alcool', 'Spritz'])
    for (const nom of ['Mojito', 'Nojito', 'Spritz']) {
      expect(screen.getByRole('button', { name: `Modifier ${nom}` })).toBeInTheDocument()
    }
    // L'archivage se fait depuis la fiche, plus depuis la liste.
    expect(screen.queryByRole('button', { name: /^Archiver/ })).toBeNull()
    fireEvent.click(screen.getByRole('switch', { name: 'Afficher les archivés' }))
    expect(screen.getByText('Vieux · sans alcool')).toBeTruthy()
  })

  it('filtre avec alcool, sans alcool, ou tous', () => {
    const depots = creerDepotsFactices({ cocktails: [c('1', 'Spritz'), c('2', 'Nojito', { alcool: false })] })
    rendre(<EcranCocktails />, { depots })
    const noms = lignes

    fireEvent.click(screen.getByRole('button', { name: 'Sans alcool (1)' }))
    expect(noms()).toEqual(['NojitoSans alcool'])
    fireEvent.click(screen.getByRole('button', { name: 'Avec alcool (1)' }))
    expect(noms()).toEqual(['Spritz'])
    fireEvent.click(screen.getByRole('button', { name: 'Tous (2)' }))
    expect(noms()).toEqual(['NojitoSans alcool', 'Spritz'])
  })

  it('masque les archivés derrière un interrupteur et désarchive', () => {
    const depots = creerDepotsFactices({ cocktails: [c('4', 'Vieux', { archive: true })] })
    rendre(<EcranCocktails />, { depots })
    expect(screen.getByRole('heading', { name: 'Archivés' })).toBeTruthy()
    expect(screen.queryByText('Vieux')).toBeNull()
    fireEvent.click(screen.getByRole('switch', { name: 'Afficher les archivés' }))
    fireEvent.click(screen.getByRole('button', { name: 'Désarchiver Vieux' }))
    const confirmation = within(screen.getByRole('dialog', { name: 'Désarchiver « Vieux » ?' }))
    expect(depots.cocktails.archiver).not.toHaveBeenCalled()
    fireEvent.click(confirmation.getByRole('button', { name: 'Désarchiver' }))
    expect(depots.cocktails.archiver).toHaveBeenCalledWith('4', false)
  })

  it('ne désarchive pas si la confirmation est annulée', () => {
    const depots = creerDepotsFactices({ cocktails: [c('4', 'Vieux', { archive: true })] })
    rendre(<EcranCocktails />, { depots })
    fireEvent.click(screen.getByRole('switch', { name: 'Afficher les archivés' }))
    fireEvent.click(screen.getByRole('button', { name: 'Désarchiver Vieux' }))
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(depots.cocktails.archiver).not.toHaveBeenCalled()
  })

  it('supprime un cocktail archivé en chiffrant les prestas et les verres perdus', async () => {
    const depots = creerDepotsFactices({ cocktails: [c('4', 'Vieux', { archive: true })] })
    vi.mocked(depots.cocktails.impactSuppression).mockResolvedValue({ prestas: 3, verres: 57 })
    rendre(<EcranCocktails />, { depots })
    fireEvent.click(screen.getByRole('switch', { name: 'Afficher les archivés' }))
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer Vieux' }))
    const confirmation = within(screen.getByRole('dialog', { name: 'Supprimer « Vieux » ?' }))
    expect(depots.cocktails.impactSuppression).toHaveBeenCalledWith('4')
    expect(
      await confirmation.findByText(
        'Le cocktail sera supprimé de l’appli et retiré de la carte de 3 prestas ; les 57 verres comptés pour lui seront perdus. C’est définitif.',
      ),
    ).toBeTruthy()
    expect(depots.cocktails.supprimer).not.toHaveBeenCalled()
    fireEvent.click(confirmation.getByRole('button', { name: 'Supprimer définitivement' }))
    expect(depots.cocktails.supprimer).toHaveBeenCalledWith('4')
  })

  it('ouvre la fiche d’un cocktail archivé, sans bouton Archiver', () => {
    rendre(<EcranCocktails />, { depots: creerDepotsFactices({ cocktails: [c('4', 'Vieux', { archive: true })] }) })
    fireEvent.click(screen.getByRole('switch', { name: 'Afficher les archivés' }))
    fireEvent.click(screen.getByRole('button', { name: 'Modifier Vieux' }))
    expect(screen.getByRole('dialog', { name: 'Modifier le cocktail' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Archiver' })).toBeNull()
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

  it('crée un cocktail sans alcool en coupant l’interrupteur', () => {
    const depots = creerDepotsFactices()
    rendre(<EcranCocktails />, { depots })
    fireEvent.click(screen.getByRole('button', { name: 'Nouveau cocktail' }))
    fireEvent.change(screen.getByLabelText('Nom'), { target: { value: 'Nojito' } })
    const alcool = screen.getByRole('switch', { name: 'Alcool' })
    expect(alcool).toBeChecked()
    fireEvent.click(alcool)
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(depots.cocktails.creer).toHaveBeenCalledWith({ nom: 'Nojito', alcool: false })
  })

  it('ferme la fiche sans enregistrer au tap à côté', async () => {
    const depots = creerDepotsFactices()
    rendre(<EcranCocktails />, { depots })
    fireEvent.click(screen.getByRole('button', { name: 'Nouveau cocktail' }))
    fireEvent.change(screen.getByLabelText('Nom'), { target: { value: 'Spritz' } })
    fireEvent.click(document.querySelector('.MuiBackdrop-root')!)
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(depots.cocktails.creer).not.toHaveBeenCalled()
  })

  it('modifie un cocktail avec l’icône Modifier, qui ouvre sa fiche', () => {
    const depots = creerDepotsFactices({ cocktails: [c('1', 'Daiquiri')] })
    rendre(<EcranCocktails />, { depots })
    fireEvent.click(screen.getByRole('button', { name: 'Modifier Daiquiri' }))
    fireEvent.change(screen.getByLabelText('Nom'), { target: { value: 'Daiquiri fraise' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(depots.cocktails.modifier).toHaveBeenCalledWith('1', { nom: 'Daiquiri fraise', alcool: true })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('archive depuis la fiche, après confirmation', () => {
    const depots = creerDepotsFactices({ cocktails: [c('1', 'Daiquiri')] })
    rendre(<EcranCocktails />, { depots })
    fireEvent.click(screen.getByRole('button', { name: 'Modifier Daiquiri' }))
    fireEvent.click(screen.getByRole('button', { name: 'Archiver' }))
    expect(depots.cocktails.archiver).not.toHaveBeenCalled()
    const confirmation = within(screen.getByRole('dialog', { name: 'Archiver « Daiquiri » ?' }))
    fireEvent.click(confirmation.getByRole('button', { name: 'Archiver' }))
    expect(depots.cocktails.archiver).toHaveBeenCalledWith('1', true)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('garde la fiche ouverte si l’archivage est annulé', () => {
    const depots = creerDepotsFactices({ cocktails: [c('1', 'Daiquiri')] })
    rendre(<EcranCocktails />, { depots })
    fireEvent.click(screen.getByRole('button', { name: 'Modifier Daiquiri' }))
    fireEvent.click(screen.getByRole('button', { name: 'Archiver' }))
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Archiver « Daiquiri » ?' })).getByRole('button', { name: 'Annuler' }))
    expect(depots.cocktails.archiver).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog', { name: 'Modifier le cocktail' })).toBeInTheDocument()
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
