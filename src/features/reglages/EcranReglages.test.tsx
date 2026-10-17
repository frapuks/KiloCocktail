import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ecouterUtilisateur, seDeconnecter } from '../../data/auth'
import type { TypeEvenement } from '../../domain/types'
import { creerDepotsFactices } from '../../test/depotsFactices'
import { rendre } from '../../test/rendre'
import { EcranReglages } from './EcranReglages'

const t = (id: string, nom: string, archive = false): TypeEvenement => ({
  id, nom, nomNormalise: nom.toLowerCase(), archive,
})

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(ecouterUtilisateur).mockImplementation((cb) => {
    cb({ uid: 'u1', email: 'barman@exemple.fr' })
    return () => {}
  })
})

describe('EcranReglages', () => {
  it('liste les types actifs et archive', () => {
    const depots = creerDepotsFactices({
      types: [t('2', 'Mariage'), t('1', 'Anniversaire'), t('3', 'Ancien', true)],
    })
    rendre(<EcranReglages />, { depots })
    const noms = screen.getAllByRole('button', { name: /^(Mariage|Anniversaire)$/ }).map((b) => b.textContent)
    expect(noms).toEqual(['Anniversaire', 'Mariage'])
    const section = screen.getByText('Archivés').closest('details') as HTMLDetailsElement
    expect(section.open).toBe(false)
    expect(screen.getByText('Ancien')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Anniversaire/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Archiver' }))
    expect(depots.types.archiver).toHaveBeenCalledWith('1', true)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('masque la section Archivés s’il n’y en a pas', () => {
    rendre(<EcranReglages />, { depots: creerDepotsFactices({ types: [t('1', 'Anniversaire')] }) })
    expect(screen.queryByText('Archivés')).toBeNull()
  })

  it('ajoute un type', () => {
    const depots = creerDepotsFactices()
    rendre(<EcranReglages />, { depots })
    fireEvent.click(screen.getByRole('button', { name: '+ Ajouter un type' }))
    fireEvent.change(screen.getByLabelText('Nom'), { target: { value: '  Mariage ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(depots.types.creer).toHaveBeenCalledWith('Mariage')
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('refuse un nom vide', () => {
    const depots = creerDepotsFactices()
    rendre(<EcranReglages />, { depots })
    fireEvent.click(screen.getByRole('button', { name: '+ Ajouter un type' }))
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(screen.getByRole('alert').textContent).toBe('Donne un nom au type')
    expect(depots.types.creer).not.toHaveBeenCalled()
  })

  it('renomme un type', () => {
    const depots = creerDepotsFactices({ types: [t('1', 'Anniversaire')] })
    rendre(<EcranReglages />, { depots })
    fireEvent.click(screen.getByRole('button', { name: /Anniversaire/ }))
    fireEvent.change(screen.getByLabelText('Nom'), { target: { value: 'Fête' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(depots.types.renommer).toHaveBeenCalledWith('1', 'Fête')
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('refuse un type en doublon', () => {
    const depots = creerDepotsFactices({ types: [t('1', 'Anniversaire'), t('2', 'Mariage')] })
    rendre(<EcranReglages />, { depots })
    fireEvent.click(screen.getByRole('button', { name: '+ Ajouter un type' }))
    fireEvent.change(screen.getByLabelText('Nom'), { target: { value: ' anniversaire' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(screen.getByRole('alert').textContent).toBe('Un type “Anniversaire” existe déjà')
    expect(depots.types.creer).not.toHaveBeenCalled()
  })

  it('refuse un doublon archivé en proposant de le désarchiver', () => {
    const depots = creerDepotsFactices({ types: [t('1', 'Anniversaire', true)] })
    rendre(<EcranReglages />, { depots })
    fireEvent.click(screen.getByRole('button', { name: '+ Ajouter un type' }))
    fireEvent.change(screen.getByLabelText('Nom'), { target: { value: 'Anniversaire' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(screen.getByRole('alert').textContent).toBe(
      'Un type “Anniversaire” existe déjà dans les archivés. Désarchive-le plutôt.',
    )
  })

  it('désarchive depuis la section repliée', () => {
    const depots = creerDepotsFactices({ types: [t('3', 'Ancien', true)] })
    rendre(<EcranReglages />, { depots })
    fireEvent.click(screen.getByRole('button', { name: 'Désarchiver', hidden: true }))
    expect(depots.types.archiver).toHaveBeenCalledWith('3', false)
  })

  it('affiche l’e-mail connecté', () => {
    rendre(<EcranReglages />, { depots: creerDepotsFactices() })
    expect(screen.getByText('barman@exemple.fr')).toBeTruthy()
  })

  it('se déconnecte', async () => {
    vi.mocked(seDeconnecter).mockResolvedValue('ok')
    rendre(<EcranReglages />, { depots: creerDepotsFactices() })
    fireEvent.click(screen.getByRole('button', { name: 'Se déconnecter' }))
    await waitFor(() => expect(seDeconnecter).toHaveBeenCalledTimes(1))
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('bloque la déconnexion si des cocktails sont en attente', async () => {
    vi.mocked(seDeconnecter).mockResolvedValue('en-attente')
    rendre(<EcranReglages />, { depots: creerDepotsFactices() })
    const bouton = screen.getByRole('button', { name: 'Se déconnecter' })
    fireEvent.click(bouton)
    expect((bouton as HTMLButtonElement).disabled).toBe(true)
    const alerte = await screen.findByRole('alert')
    expect(alerte.textContent).toBe(
      'Des cocktails ne sont pas encore sauvegardés. Reconnecte-toi à internet avant de te déconnecter.',
    )
    expect((bouton as HTMLButtonElement).disabled).toBe(false)
  })
})
