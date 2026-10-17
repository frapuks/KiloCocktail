import { useEffect, useState } from 'react'
import { surErreurEcriture } from '../data/erreurs'

// Le bandeau « Nouvelle version disponible » est ajouté en Task 16.
export function Bandeaux() {
  const [erreurEcriture, setErreurEcriture] = useState(false)
  useEffect(() => surErreurEcriture(() => setErreurEcriture(true)), [])

  if (!erreurEcriture) return null
  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        padding: '10px 16px',
        background: 'var(--moins)',
        color: '#323232',
      }}
    >
      <span>Une modification n'a pas pu être sauvegardée</span>
      <button type="button" onClick={() => setErreurEcriture(false)}>
        Fermer
      </button>
    </div>
  )
}
