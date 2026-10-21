import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import { surErreurEcriture } from '../data/erreurs'

const styleBandeau = { borderRadius: 0, alignItems: 'center', px: 2 } as const

export function Bandeaux() {
  const [erreurEcriture, setErreurEcriture] = useState(false)
  useEffect(() => surErreurEcriture(() => setErreurEcriture(true)), [])
  // registerType 'prompt' : jamais de rechargement sans clic sur « Recharger ».
  const {
    needRefresh: [nouvelleVersion],
    updateServiceWorker,
  } = useRegisterSW()

  return (
    <>
      {erreurEcriture && (
        <Alert
          severity="warning"
          variant="filled"
          sx={styleBandeau}
          action={
            <Button color="inherit" onClick={() => setErreurEcriture(false)}>
              Fermer
            </Button>
          }
        >
          Une modification n'a pas pu être sauvegardée
        </Alert>
      )}
      {nouvelleVersion && (
        <Alert
          role="status"
          severity="success"
          variant="filled"
          sx={styleBandeau}
          action={
            <Button color="inherit" onClick={() => void updateServiceWorker(true)}>
              Recharger
            </Button>
          }
        >
          Nouvelle version disponible
        </Alert>
      )}
    </>
  )
}
