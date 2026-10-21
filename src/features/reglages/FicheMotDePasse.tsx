import { useState, type ChangeEvent } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import { changerMotDePasse } from '../../data/auth'
import { FeuilleModale } from '../../ui/FeuilleModale'

// Minimum imposé par Firebase Authentication.
const LONGUEUR_MIN = 6

const MESSAGES_ERREUR: Record<string, string> = {
  identifiants: 'Mot de passe actuel incorrect',
  faible: `Mot de passe trop faible (${LONGUEUR_MIN} caractères minimum)`,
  'trop-de-tentatives': 'Trop de tentatives, réessaie dans quelques minutes',
  reseau: 'Pas de connexion internet : réessaie une fois connecté',
}

function erreurSaisie(actuel: string, nouveau: string, confirmation: string): string | null {
  if (!actuel) return 'Saisis ton mot de passe actuel'
  if (nouveau.length < LONGUEUR_MIN) return `Le nouveau mot de passe doit faire au moins ${LONGUEUR_MIN} caractères`
  if (nouveau === actuel) return "Le nouveau mot de passe doit être différent de l'actuel"
  if (confirmation !== nouveau) return 'Les deux saisies du nouveau mot de passe ne correspondent pas'
  return null
}

interface Props {
  email: string | null
  onModifie(): void
  onAnnuler(): void
}

export function FicheMotDePasse({ email, onModifie, onAnnuler }: Props) {
  const [actuel, setActuel] = useState('')
  const [nouveau, setNouveau] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)

  async function enregistrer() {
    const e = erreurSaisie(actuel, nouveau, confirmation)
    if (e) {
      setErreur(e)
      return
    }
    setEnCours(true)
    try {
      await changerMotDePasse(actuel, nouveau)
      onModifie()
    } catch (err) {
      setErreur(MESSAGES_ERREUR[(err as Error).message] ?? 'Modification impossible, réessaie')
      setEnCours(false)
    }
  }

  const saisie = (setter: (v: string) => void) => (e: ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value)
    setErreur(null)
  }

  return (
    <FeuilleModale libelle="Modifier le mot de passe" onSubmit={enregistrer}>
      {/* Identifiant caché : les gestionnaires de mots de passe savent à quel compte rattacher le nouveau. */}
      <input type="email" name="username" autoComplete="username" value={email ?? ''} readOnly hidden />
      <TextField label="Mot de passe actuel" type="password" autoComplete="current-password" value={actuel} onChange={saisie(setActuel)} />
      <TextField label="Nouveau mot de passe" type="password" autoComplete="new-password" value={nouveau} onChange={saisie(setNouveau)} />
      <TextField
        label="Confirmer le nouveau mot de passe"
        type="password"
        autoComplete="new-password"
        value={confirmation}
        onChange={saisie(setConfirmation)}
      />
      {erreur && <Alert severity="warning">{erreur}</Alert>}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button type="submit" variant="contained" loading={enCours}>
          Enregistrer
        </Button>
        <Button variant="outlined" color="inherit" onClick={onAnnuler} disabled={enCours}>
          Annuler
        </Button>
      </Box>
    </FeuilleModale>
  )
}
