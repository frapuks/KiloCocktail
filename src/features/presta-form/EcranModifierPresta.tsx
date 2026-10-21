import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useDepots } from '../../data/DepotsContext'
import { signalerErreurEcriture } from '../../data/erreurs'
import { useCocktails, usePresta, useTypes, useVerres } from '../../data/hooks'
import { libelleServis, nomLigne, nomPresta } from '../../domain/affichage'
import {
  deplacerDansGroupe,
  masquer,
  optionsAbsentes,
  reafficher,
  retirer,
  typeRetrait,
} from '../../domain/lignes'
import type { Ligne } from '../../domain/types'
import { totalPresta, totauxParLigne } from '../../domain/verres'
import { ChampDate } from '../../ui/ChampDate'
import { Confirmation } from '../../ui/Confirmation'
import { ouverteDepuisApp } from '../../app/historique'
import { FeuilleModale } from '../../ui/FeuilleModale'
import { TitreSection } from '../../ui/TitreSection'
import { ChampType } from './ChampType'
import { FeuilleAjoutCocktails } from './FeuilleAjoutCocktails'
import { SurLaCarte } from './SurLaCarte'

interface Brouillon {
  date: string
  client: string
  typeId: string | null
  lignes: Ligne[]
  lignesAPurger: string[]
}

type Dialogue =
  | { genre: 'retrait'; ligne: Ligne; nom: string; sousTitre: string | null; total: number }
  | { genre: 'abandon' }
  | { genre: 'suppression' }
  | null

export function EcranModifierPresta() {
  const { id = '' } = useParams()
  const depots = useDepots()
  const navigate = useNavigate()
  const location = useLocation()
  const presta = usePresta(id)
  const cocktailsHook = useCocktails()
  const typesHook = useTypes()
  const donneesVerres = useVerres(id)
  const [initial, setInitial] = useState<Brouillon | null>(null)
  const [brouillon, setBrouillon] = useState<Brouillon | null>(null)
  const [dialogue, setDialogue] = useState<Dialogue>(null)
  const [ajout, setAjout] = useState(false)
  // Enregistrement ou suppression lancé : évite un second appel (et un double retour) sur un double tap.
  const [enCours, setEnCours] = useState(false)
  // Navigation à faire une fois la feuille redescendue ; non nulle = feuille en train de se fermer.
  const [sortie, setSortie] = useState<(() => void) | null>(null)

  useEffect(() => {
    if (presta === null) navigate('/', { replace: true })
  }, [presta, navigate])

  if (presta && !brouillon) {
    const depart: Brouillon = {
      date: presta.date,
      client: presta.client ?? '',
      typeId: presta.typeId,
      lignes: presta.lignes,
      lignesAPurger: [],
    }
    setInitial(depart)
    setBrouillon(depart)
  }

  if (!presta || !brouillon || !initial || !cocktailsHook || !typesHook || !donneesVerres) return null

  const verres = donneesVerres.verres
  const totaux = totauxParLigne(verres)
  const cocktails = cocktailsHook
  const types = typesHook
  const modifie = JSON.stringify(brouillon) !== JSON.stringify(initial)
  const maj = (p: Partial<Brouillon>) => setBrouillon((b) => (b ? { ...b, ...p } : b))
  const masquees = brouillon.lignes.filter((l) => l.masquee)

  function demanderRetrait(ligneId: string) {
    const ligne = brouillon!.lignes.find((l) => l.id === ligneId)
    if (!ligne) return
    const total = totaux.get(ligneId) ?? 0
    if (typeRetrait(total) === 'direct') {
      maj({ lignes: retirer(brouillon!.lignes, ligneId) })
      return
    }
    const cocktail = cocktails.find((c) => c.id === ligne.cocktailId)
    const { nom, sousTitre } = cocktail ? nomLigne(cocktail) : { nom: '', sousTitre: null }
    setDialogue({ genre: 'retrait', ligne, nom, sousTitre, total })
  }

  async function enregistrer() {
    const b = brouillon!
    setEnCours(true)
    try {
      await depots.prestas.modifier(
        id,
        { date: b.date, client: b.client.trim() || null, typeId: b.typeId, lignes: b.lignes },
        b.lignesAPurger,
      )
    } catch (raison) {
      setEnCours(false)
      signalerErreurEcriture(raison)
      return
    }
    retour()
  }

  // Retour à la page précédente ; ouvert sans historique (lien, rechargement), vers la presta elle-même.
  // La feuille redescend d'abord, la navigation suit (onFermer).
  function retour() {
    setDialogue(null)
    setSortie(() => revenir)
  }

  function revenir() {
    if (ouverteDepuisApp(location)) navigate(-1)
    else navigate(presta!.statut === 'en-cours' ? `/prestas/${id}` : `/prestas/${id}/resultats`, { replace: true })
  }

  function annuler() {
    if (modifie) setDialogue({ genre: 'abandon' })
    else retour()
  }

  async function supprimer() {
    setEnCours(true)
    try {
      await depots.prestas.supprimer(id)
    } catch (raison) {
      setEnCours(false)
      signalerErreurEcriture(raison)
      return
    }
    navigate('/', { replace: true })
  }

  function rendreDialogue() {
    if (!dialogue) return null
    const fermer = () => setDialogue(null)
    if (dialogue.genre === 'retrait') {
      const { ligne, nom, sousTitre, total } = dialogue
      const servis = `${total} ${libelleServis(total)}`
      return (
        <Confirmation
          titre={`Retirer ${nom}${sousTitre ? ` (${sousTitre})` : ''} ?`}
          onFermer={fermer}
          actions={[
            {
              libelle: `Masquer du comptage (garder ${total >= 2 ? 'les' : 'le'} ${servis})`,
              onClick: () => {
                maj({ lignes: masquer(brouillon!.lignes, ligne.id) })
                fermer()
              },
            },
            {
              libelle: `Supprimer avec ${total >= 2 ? 'ses' : 'son'} ${servis}`,
              danger: true,
              onClick: () => {
                maj({
                  lignes: retirer(brouillon!.lignes, ligne.id),
                  lignesAPurger: [...brouillon!.lignesAPurger, ligne.id],
                })
                fermer()
              },
            },
            { libelle: 'Annuler', onClick: fermer },
          ]}
        />
      )
    }
    if (dialogue.genre === 'abandon') {
      return (
        <Confirmation
          titre="Abandonner les modifications ?"
          onFermer={fermer}
          actions={[
            { libelle: 'Abandonner', danger: true, onClick: retour },
            { libelle: 'Annuler', onClick: fermer },
          ]}
        />
      )
    }
    return (
      <Confirmation
        titre={`Supprimer “${nomPresta(presta!)}” et ses ${totalPresta(verres)} cocktails servis ?`}
        onFermer={fermer}
        actions={[
          { libelle: 'Supprimer', danger: true, desactive: enCours, onClick: () => void supprimer() },
          { libelle: 'Annuler', onClick: fermer },
        ]}
      />
    )
  }

  return (
    <FeuilleModale
      libelle="Modifier la presta"
      fermee={sortie !== null}
      onFermer={() => sortie?.()}
      // Tap à côté = Annuler : confirmation si des modifications seraient perdues.
      onDemandeFermeture={annuler}
    >
      <Typography variant="h2">Modifier la presta</Typography>
      <ChampDate label="Date" valeur={brouillon.date} onChange={(date) => maj({ date })} />
      <TextField label="Client" value={brouillon.client} onChange={(e) => maj({ client: e.target.value })} />
      <ChampType
        types={types}
        valeur={brouillon.typeId}
        onChange={(t) => maj({ typeId: t })}
      />
      <SurLaCarte
        lignes={brouillon.lignes}
        cocktails={cocktails}
        totaux={totaux}
        onDeplacer={(variante, de, vers) => maj({ lignes: deplacerDansGroupe(brouillon.lignes, cocktails, variante, de, vers) })}
        onRetirer={demanderRetrait}
        onAjouter={() => setAjout(true)}
      />
      {masquees.length > 0 && (
        <Box component="section" aria-labelledby="titre-masquees">
          <Box sx={{ mb: 1 }}>
            {/* Trait gris : cocktails retirés du comptage, en retrait. */}
            <TitreSection titre="Masquées" id="titre-masquees" niveau="h3" couleur="divider" />
          </Box>
          <List disablePadding>
            {masquees.map((ligne) => {
              const cocktail = cocktails.find((c) => c.id === ligne.cocktailId)
              const noms = cocktail ? nomLigne(cocktail) : null
              return (
                <ListItem key={ligne.id} disableGutters sx={{ gap: 1, minHeight: 44 }}>
                  <Box component="span" sx={{ flex: 1 }}>
                    {noms ? (noms.sousTitre ? `${noms.nom} · ${noms.sousTitre}` : noms.nom) : ''}
                  </Box>
                  <Typography component="span" sx={{ fontWeight: 700 }}>
                    {totaux.get(ligne.id) ?? 0}
                  </Typography>
                  <Button
                    variant="outlined"
                    color="inherit"
                    onClick={() => maj({ lignes: reafficher(brouillon.lignes, ligne.id) })}
                  >
                    Réafficher
                  </Button>
                </ListItem>
              )
            })}
          </List>
        </Box>
      )}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button variant="contained" onClick={() => void enregistrer()} loading={enCours}>
          Enregistrer
        </Button>
        <Button variant="outlined" color="inherit" onClick={annuler}>
          Annuler
        </Button>
        <Button
          variant="outlined"
          color="error"
          onClick={() => setDialogue({ genre: 'suppression' })}
          sx={{ ml: 'auto' }}
        >
          Supprimer
        </Button>
      </Box>
      {ajout && (
        <FeuilleAjoutCocktails
          options={optionsAbsentes(cocktails, brouillon.lignes)}
          onAjouter={(lignes) => {
            maj({ lignes: [...brouillon.lignes, ...lignes] })
            setAjout(false)
          }}
          onAnnuler={() => setAjout(false)}
        />
      )}
      {rendreDialogue()}
    </FeuilleModale>
  )
}
