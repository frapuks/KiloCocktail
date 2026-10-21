import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import LocalBarIcon from '@mui/icons-material/LocalBar'
import Alert, { type AlertColor } from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { envoyerReinitialisation, seConnecter } from '../../data/auth'

const MESSAGES_ERREUR: Record<string, string> = {
  identifiants: 'E-mail ou mot de passe incorrect',
  reseau: 'Pas de connexion internet, réessaie dans un instant',
}

interface Message {
  texte: string
  gravite: AlertColor
}

export function EcranConnexion() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [message, setMessage] = useState<Message | null>(null)
  const [enCours, setEnCours] = useState(false)

  async function soumettre(e: FormEvent) {
    e.preventDefault()
    setMessage(null)
    setEnCours(true)
    try {
      await seConnecter(email, motDePasse)
      navigate('/')
    } catch (err) {
      const texte = MESSAGES_ERREUR[(err as Error).message] ?? 'Connexion impossible, réessaie'
      setMessage({ texte, gravite: 'error' })
    } finally {
      setEnCours(false)
    }
  }

  async function reinitialiser() {
    if (!email.trim()) {
      setMessage({ texte: "Saisis ton e-mail d'abord.", gravite: 'warning' })
      return
    }
    try {
      await envoyerReinitialisation(email.trim())
      setMessage({ texte: 'E-mail de réinitialisation envoyé.', gravite: 'success' })
    } catch {
      setMessage({ texte: "L'e-mail n'a pas pu être envoyé", gravite: 'error' })
    }
  }

  return (
    <Box component="main" sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', p: 2 }}>
      <Paper
        variant="outlined"
        sx={{
          width: '100%',
          maxWidth: 380,
          px: 3,
          py: 3.5,
          borderRadius: 4,
          borderColor: 'primary.dark',
          borderTop: 4,
          borderTopColor: 'primary.main',
        }}
      >
        <Typography
          variant="h1"
          sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.25, fontSize: 40 }}
        >
          <LocalBarIcon sx={{ fontSize: 40, color: 'primary.light' }} />
          KiloCocktail
        </Typography>
        {!navigator.onLine && (
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Connecte-toi à internet pour la première ouverture.
          </Typography>
        )}
        <Stack component="form" onSubmit={soumettre} spacing={2}>
          <TextField
            id="connexion-email"
            label="E-mail"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={champ}
          />
          <TextField
            id="connexion-mot-de-passe"
            label="Mot de passe"
            type="password"
            autoComplete="current-password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            sx={champ}
          />
          <Button type="submit" variant="contained" size="large" loading={enCours} sx={{ mt: 1 }}>
            Se connecter
          </Button>
          <Button type="button" color="inherit" onClick={reinitialiser} sx={{ color: 'text.secondary', fontWeight: 500 }}>
            Mot de passe oublié
          </Button>
        </Stack>
        {message && (
          <Alert severity={message.gravite} variant="outlined" sx={{ mt: 2 }}>
            {message.texte}
          </Alert>
        )}
      </Paper>
    </Box>
  )
}

const champ = {
  '& .MuiOutlinedInput-root': { bgcolor: 'background.default' },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.dark' },
}
