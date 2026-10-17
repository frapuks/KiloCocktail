import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { surErreurEcriture } from '../data/erreurs'

const styleBandeau = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '1rem',
  padding: '10px 16px',
  color: '#323232',
} as const

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
        <div role="alert" style={{ ...styleBandeau, background: 'var(--moins)' }}>
          <span>Une modification n'a pas pu être sauvegardée</span>
          <button type="button" onClick={() => setErreurEcriture(false)}>
            Fermer
          </button>
        </div>
      )}
      {nouvelleVersion && (
        <div role="status" style={{ ...styleBandeau, background: 'var(--avec)' }}>
          <span>Nouvelle version disponible</span>
          <button type="button" onClick={() => void updateServiceWorker(true)}>
            Recharger
          </button>
        </div>
      )}
    </>
  )
}
