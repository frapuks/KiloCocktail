import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { ecouterUtilisateur, seDeconnecter } from '../../data/auth'
import { useBases, useTypes } from '../../data/hooks'
import { EnTeteEcran } from '../../ui/EnTeteEcran'
import { TitreSection } from '../../ui/TitreSection'
import { FicheMotDePasse } from './FicheMotDePasse'
import { GestionBases } from './GestionBases'
import { GestionTypes } from './GestionTypes'

const MESSAGE_EN_ATTENTE =
  'Des cocktails ne sont pas encore sauvegardés. Reconnecte-toi à internet avant de te déconnecter.'

function Compte() {
  const [email, setEmail] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)
  const [bloque, setBloque] = useState(false)
  const [echec, setEchec] = useState(false)
  const [ficheMotDePasse, setFicheMotDePasse] = useState(false)
  const [motDePasseModifie, setMotDePasseModifie] = useState(false)

  useEffect(() => ecouterUtilisateur((u) => setEmail(u?.email ?? null)), [])

  async function deconnecter() {
    setEnCours(true)
    setBloque(false)
    setEchec(false)
    try {
      // Sur 'ok', l'écouteur d'authentification de RouteProtegee redirige vers /connexion.
      if ((await seDeconnecter()) === 'en-attente') setBloque(true)
    } catch (raison) {
      console.error('Déconnexion impossible :', raison)
      setEchec(true)
    } finally {
      setEnCours(false)
    }
  }

  return (
    <Stack component="section" spacing={1.5} sx={{ mt: 4, alignItems: 'flex-start' }}>
      <TitreSection titre="Compte" />
      {email && <Typography color="text.secondary">{email}</Typography>}
      <Button
        variant="outlined"
        color="inherit"
        onClick={() => {
          setMotDePasseModifie(false)
          setFicheMotDePasse(true)
        }}
      >
        Modifier le mot de passe
      </Button>
      {motDePasseModifie && <Alert severity="success">Mot de passe modifié</Alert>}
      <Button variant="outlined" color="error" onClick={deconnecter} loading={enCours}>
        Se déconnecter
      </Button>
      {bloque && <Alert severity="warning">{MESSAGE_EN_ATTENTE}</Alert>}
      {echec && <Alert severity="error">La déconnexion a échoué. Réessaie.</Alert>}

      {ficheMotDePasse && (
        <FicheMotDePasse
          email={email}
          onAnnuler={() => setFicheMotDePasse(false)}
          onModifie={() => {
            setFicheMotDePasse(false)
            setMotDePasseModifie(true)
          }}
        />
      )}
    </Stack>
  )
}

export function EcranReglages() {
  const types = useTypes()
  const bases = useBases()
  const [gestion, setGestion] = useState<'types' | 'bases' | null>(null)

  if (!types || !bases) return <Typography sx={{ p: 2 }} color="text.secondary">Chargement…</Typography>

  return (
    <Box component="main" sx={{ p: 2, pb: 12 }}>
      <EnTeteEcran titre="Réglages" />

      <Stack component="section" spacing={1.5} sx={{ mt: 3, alignItems: 'flex-start' }}>
        <TitreSection titre="Types d'événement" />
        <Button variant="outlined" color="inherit" onClick={() => setGestion('types')}>
          Modifier les types
        </Button>
      </Stack>

      <Stack component="section" spacing={1.5} sx={{ mt: 4, alignItems: 'flex-start' }}>
        <TitreSection titre="Bases des cocktails" />
        <Button variant="outlined" color="inherit" onClick={() => setGestion('bases')}>
          Modifier les bases
        </Button>
      </Stack>

      <Compte />

      {gestion === 'types' && <GestionTypes types={types} onFermer={() => setGestion(null)} />}
      {gestion === 'bases' && <GestionBases bases={bases} onFermer={() => setGestion(null)} />}
    </Box>
  )
}
