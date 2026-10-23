import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { changerMotDePasse, ecouterUtilisateur, seDeconnecter } from '../../data/auth'
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

const ouvrir = () => fireEvent.click(screen.getByRole('button', { name: 'Modifier les types' }))

describe('EcranReglages', () => {
  it('ouvre la gestion des types et liste les actifs triés', async () => {
    const depots = creerDepotsFactices({
      types: [t('2', 'Mariage'), t('1', 'Anniversaire'), t('3', 'Ancien', true)],
    })
    rendre(<EcranReglages />, { depots })
    expect(screen.queryByRole('dialog')).toBeNull()
    ouvrir()
    // Liste simple : des noms, pas de champs ; Modifier et Archiver au bout de chaque ligne.
    expect(screen.queryByRole('textbox')).toBeNull()
    const lignes = screen.getAllByRole('listitem').map((li) => li.textContent)
    expect(lignes).toEqual(['Anniversaire', 'Mariage'])
    for (const nom of ['Anniversaire', 'Mariage']) {
      expect(screen.getByRole('button', { name: `Modifier ${nom}` })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: `Archiver ${nom}` })).toBeInTheDocument()
    }
    expect(screen.queryByText('Ancien')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('archive un type', () => {
    const depots = creerDepotsFactices({ types: [t('1', 'Anniversaire')] })
    rendre(<EcranReglages />, { depots })
    ouvrir()
    fireEvent.click(screen.getByRole('button', { name: 'Archiver Anniversaire' }))
    expect(depots.types.archiver).not.toHaveBeenCalled()
    const confirmation = within(screen.getByRole('dialog', { name: 'Archiver « Anniversaire » ?' }))
    fireEvent.click(confirmation.getByRole('button', { name: 'Archiver' }))
    expect(depots.types.archiver).toHaveBeenCalledWith('1', true)
  })

  it('renomme un type avec « Modifier », puis valide', () => {
    const depots = creerDepotsFactices({ types: [t('1', 'Anniversaire')] })
    rendre(<EcranReglages />, { depots })
    ouvrir()
    fireEvent.click(screen.getByRole('button', { name: 'Modifier Anniversaire' }))
    const champ = screen.getByRole('textbox', { name: 'Nouveau nom pour Anniversaire' })
    expect((champ as HTMLInputElement).value).toBe('Anniversaire')
    fireEvent.change(champ, { target: { value: ' Fête ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }))
    expect(depots.types.renommer).toHaveBeenCalledWith('1', 'Fête')
    expect(screen.queryByRole('textbox')).toBeNull()
  })

  it('annule la modification d’un nom sans rien enregistrer', () => {
    const depots = creerDepotsFactices({ types: [t('1', 'Anniversaire')] })
    rendre(<EcranReglages />, { depots })
    ouvrir()
    fireEvent.click(screen.getByRole('button', { name: 'Modifier Anniversaire' }))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Fête' } })
    fireEvent.click(screen.getByRole('button', { name: 'Annuler la saisie' }))
    expect(depots.types.renommer).not.toHaveBeenCalled()
    expect(screen.getByText('Anniversaire')).toBeInTheDocument()
  })

  it('ne renomme pas si le nom est inchangé, vide ou en doublon', () => {
    const depots = creerDepotsFactices({ types: [t('1', 'Anniversaire'), t('2', 'Mariage')] })
    rendre(<EcranReglages />, { depots })
    ouvrir()
    fireEvent.click(screen.getByRole('button', { name: 'Modifier Anniversaire' }))
    const champ = screen.getByRole('textbox', { name: 'Nouveau nom pour Anniversaire' })
    fireEvent.change(champ, { target: { value: '  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }))
    expect(screen.getByText('Donne un nom au type')).toBeTruthy()
    fireEvent.change(champ, { target: { value: 'mariage' } })
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }))
    expect(screen.getByText('Un type “Mariage” existe déjà')).toBeTruthy()
    fireEvent.change(champ, { target: { value: 'Anniversaire' } })
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }))
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(depots.types.renommer).not.toHaveBeenCalled()
  })

  it('ajoute un type depuis le bouton en haut de la feuille', () => {
    const depots = creerDepotsFactices()
    rendre(<EcranReglages />, { depots })
    ouvrir()
    expect(screen.queryByRole('textbox')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '+ Ajouter un type' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Nom du nouveau type' }), { target: { value: '  Mariage ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }))
    expect(depots.types.creer).toHaveBeenCalledWith('Mariage')
    expect(screen.queryByRole('textbox')).toBeNull()
  })

  it('refuse un nom vide', () => {
    const depots = creerDepotsFactices()
    rendre(<EcranReglages />, { depots })
    ouvrir()
    fireEvent.click(screen.getByRole('button', { name: '+ Ajouter un type' }))
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }))
    expect(screen.getByText('Donne un nom au type')).toBeTruthy()
    expect(depots.types.creer).not.toHaveBeenCalled()
  })

  it('refuse un doublon archivé en proposant de le désarchiver', () => {
    const depots = creerDepotsFactices({ types: [t('1', 'Anniversaire', true)] })
    rendre(<EcranReglages />, { depots })
    ouvrir()
    fireEvent.click(screen.getByRole('button', { name: '+ Ajouter un type' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Nom du nouveau type' }), { target: { value: 'Anniversaire' } })
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }))
    expect(
      screen.getByText('Un type “Anniversaire” existe déjà dans les archivés. Désarchive-le plutôt.'),
    ).toBeTruthy()
    expect(depots.types.creer).not.toHaveBeenCalled()
  })

  it('désarchive après avoir affiché les archivés', () => {
    const depots = creerDepotsFactices({ types: [t('3', 'Ancien', true)] })
    rendre(<EcranReglages />, { depots })
    ouvrir()
    fireEvent.click(screen.getByRole('switch', { name: 'Afficher les archivés' }))
    fireEvent.click(screen.getByRole('button', { name: 'Désarchiver Ancien' }))
    const confirmation = within(screen.getByRole('dialog', { name: 'Désarchiver « Ancien » ?' }))
    fireEvent.click(confirmation.getByRole('button', { name: 'Désarchiver' }))
    expect(depots.types.archiver).toHaveBeenCalledWith('3', false)
  })

  it('renomme un type archivé', () => {
    const depots = creerDepotsFactices({ types: [t('3', 'Ancien', true), t('1', 'Anniversaire')] })
    rendre(<EcranReglages />, { depots })
    ouvrir()
    fireEvent.click(screen.getByRole('switch', { name: 'Afficher les archivés' }))
    fireEvent.click(screen.getByRole('button', { name: 'Modifier Ancien' }))
    const champ = screen.getByRole('textbox', { name: 'Nouveau nom pour Ancien' })
    fireEvent.change(champ, { target: { value: 'anniversaire' } })
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }))
    expect(screen.getByText('Un type “Anniversaire” existe déjà')).toBeTruthy()
    fireEvent.change(champ, { target: { value: ' Baptême ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }))
    expect(depots.types.renommer).toHaveBeenCalledWith('3', 'Baptême')
    expect(screen.queryByRole('textbox')).toBeNull()
  })

  it('supprime un type archivé en disant combien de prestas le perdent', () => {
    const depots = creerDepotsFactices({
      types: [t('3', 'Ancien', true)],
      prestas: [
        { id: 'p1', date: '2026-10-17', client: 'A', typeId: '3', statut: 'terminee', lignes: [] },
        { id: 'p2', date: '2026-10-18', client: 'B', typeId: '3', statut: 'en-cours', lignes: [] },
        { id: 'p3', date: '2026-10-19', client: 'C', typeId: null, statut: 'en-cours', lignes: [] },
      ],
    })
    rendre(<EcranReglages />, { depots })
    ouvrir()
    fireEvent.click(screen.getByRole('switch', { name: 'Afficher les archivés' }))
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer Ancien' }))
    const confirmation = within(screen.getByRole('dialog', { name: 'Supprimer « Ancien » ?' }))
    expect(confirmation.getByText(/2 prestas l’utilisent : elles n’auront plus de type\. C’est définitif\./)).toBeTruthy()
    expect(depots.types.supprimer).not.toHaveBeenCalled()
    fireEvent.click(confirmation.getByRole('button', { name: 'Supprimer définitivement' }))
    expect(depots.types.supprimer).toHaveBeenCalledWith('3')
  })

  it('garde la confirmation ouverte et le dit si la suppression échoue (hors connexion)', async () => {
    const depots = creerDepotsFactices({ types: [t('3', 'Ancien', true)] })
    vi.mocked(depots.types.supprimer).mockRejectedValue(new Error('unavailable'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    rendre(<EcranReglages />, { depots })
    ouvrir()
    fireEvent.click(screen.getByRole('switch', { name: 'Afficher les archivés' }))
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer Ancien' }))
    const confirmation = within(screen.getByRole('dialog', { name: 'Supprimer « Ancien » ?' }))
    fireEvent.click(confirmation.getByRole('button', { name: 'Supprimer définitivement' }))
    expect(await confirmation.findByText(/une connexion internet est nécessaire/)).toBeTruthy()
    expect(screen.getByRole('dialog', { name: 'Supprimer « Ancien » ?' })).toBeInTheDocument()
  })

  it('n’efface rien si la suppression est annulée', () => {
    const depots = creerDepotsFactices({ types: [t('3', 'Ancien', true)] })
    rendre(<EcranReglages />, { depots })
    ouvrir()
    fireEvent.click(screen.getByRole('switch', { name: 'Afficher les archivés' }))
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer Ancien' }))
    const confirmation = within(screen.getByRole('dialog', { name: 'Supprimer « Ancien » ?' }))
    expect(confirmation.getByText(/Aucune presta ne l’utilise\./)).toBeTruthy()
    fireEvent.click(confirmation.getByRole('button', { name: 'Annuler' }))
    expect(depots.types.supprimer).not.toHaveBeenCalled()
  })

  describe('bases des cocktails', () => {
    const b = (id: string, nom: string, archive = false) => ({ id, nom, nomNormalise: nom.toLowerCase(), archive })
    const ouvrirBases = () => fireEvent.click(screen.getByRole('button', { name: 'Modifier les bases' }))

    it('ajoute une base, et refuse un doublon archivé au féminin', () => {
      const depots = creerDepotsFactices({ bases: [b('r', 'Rhum', true)] })
      rendre(<EcranReglages />, { depots })
      ouvrirBases()
      expect(screen.getByRole('dialog', { name: 'Bases' })).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: '+ Ajouter une base' }))
      const champ = screen.getByRole('textbox', { name: 'Nom de la nouvelle base' })
      fireEvent.change(champ, { target: { value: 'rhum' } })
      fireEvent.click(screen.getByRole('button', { name: 'Valider' }))
      expect(screen.getByText('Une base “Rhum” existe déjà dans les archivés. Désarchive-la plutôt.')).toBeTruthy()
      fireEvent.change(champ, { target: { value: ' Vodka ' } })
      fireEvent.click(screen.getByRole('button', { name: 'Valider' }))
      expect(depots.bases.creer).toHaveBeenCalledWith('Vodka')
    })

    it('archive une base avec un message au féminin', () => {
      const depots = creerDepotsFactices({ bases: [b('r', 'Rhum')] })
      rendre(<EcranReglages />, { depots })
      ouvrirBases()
      fireEvent.click(screen.getByRole('button', { name: 'Archiver Rhum' }))
      const confirmation = within(screen.getByRole('dialog', { name: 'Archiver « Rhum » ?' }))
      expect(confirmation.getByText(/Elle ne sera plus proposée pour les cocktails/)).toBeTruthy()
      fireEvent.click(confirmation.getByRole('button', { name: 'Archiver' }))
      expect(depots.bases.archiver).toHaveBeenCalledWith('r', true)
    })

    it('supprime une base archivée en disant combien de cocktails la perdent', () => {
      const depots = creerDepotsFactices({
        bases: [b('r', 'Rhum', true)],
        cocktails: [
          { id: 'm', nom: 'Mojito', nomNormalise: 'mojito', alcool: true, archive: false, baseId: 'r' },
          { id: 'n', nom: 'Nojito', nomNormalise: 'nojito', alcool: false, archive: false },
        ],
      })
      rendre(<EcranReglages />, { depots })
      ouvrirBases()
      fireEvent.click(screen.getByRole('switch', { name: 'Afficher les archivés' }))
      fireEvent.click(screen.getByRole('button', { name: 'Supprimer Rhum' }))
      const confirmation = within(screen.getByRole('dialog', { name: 'Supprimer « Rhum » ?' }))
      expect(confirmation.getByText(/1 cocktail l’utilise : il n’aura plus de base\./)).toBeTruthy()
      fireEvent.click(confirmation.getByRole('button', { name: 'Supprimer définitivement' }))
      expect(depots.bases.supprimer).toHaveBeenCalledWith('r')
    })
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

  it('dit que la déconnexion a échoué si elle lève une erreur', async () => {
    vi.mocked(seDeconnecter).mockRejectedValue(new Error('client arrêté'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    rendre(<EcranReglages />, { depots: creerDepotsFactices() })
    fireEvent.click(screen.getByRole('button', { name: 'Se déconnecter' }))
    expect((await screen.findByRole('alert')).textContent).toBe('La déconnexion a échoué. Réessaie.')
  })

  describe('modifier le mot de passe', () => {
    const saisir = (actuel: string, nouveau: string, confirmation = nouveau) => {
      fireEvent.click(screen.getByRole('button', { name: 'Modifier le mot de passe' }))
      fireEvent.change(screen.getByLabelText('Mot de passe actuel'), { target: { value: actuel } })
      fireEvent.change(screen.getByLabelText('Nouveau mot de passe'), { target: { value: nouveau } })
      fireEvent.change(screen.getByLabelText('Confirmer le nouveau mot de passe'), { target: { value: confirmation } })
      fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    }

    it('change le mot de passe et le confirme', async () => {
      vi.mocked(changerMotDePasse).mockResolvedValue()
      rendre(<EcranReglages />, { depots: creerDepotsFactices() })
      saisir('ancien1', 'nouveau1')
      expect(changerMotDePasse).toHaveBeenCalledWith('ancien1', 'nouveau1')
      expect(await screen.findByText('Mot de passe modifié')).toBeTruthy()
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it.each([
      ['', 'nouveau1', 'nouveau1', 'Saisis ton mot de passe actuel'],
      ['ancien1', 'court', 'court', 'Le nouveau mot de passe doit faire au moins 6 caractères'],
      ['ancien1', 'ancien1', 'ancien1', "Le nouveau mot de passe doit être différent de l'actuel"],
      ['ancien1', 'nouveau1', 'nouveau2', 'Les deux saisies du nouveau mot de passe ne correspondent pas'],
    ])('refuse une saisie invalide (%s / %s / %s)', (actuel, nouveau, confirmation, message) => {
      rendre(<EcranReglages />, { depots: creerDepotsFactices() })
      saisir(actuel, nouveau, confirmation)
      expect(screen.getByRole('alert').textContent).toBe(message)
      expect(changerMotDePasse).not.toHaveBeenCalled()
    })

    it('signale un mot de passe actuel incorrect', async () => {
      vi.mocked(changerMotDePasse).mockRejectedValue(new Error('identifiants'))
      rendre(<EcranReglages />, { depots: creerDepotsFactices() })
      saisir('faux123', 'nouveau1')
      expect((await screen.findByRole('alert')).textContent).toBe('Mot de passe actuel incorrect')
      expect(screen.getByRole('dialog', { name: 'Modifier le mot de passe' })).toBeTruthy()
    })
  })
})
