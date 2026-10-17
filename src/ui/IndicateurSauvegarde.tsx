import { useEffect, useState } from 'react'
import { DELAI_ATTENTE_MS, libelleSauvegarde, type EtatSauvegarde } from '../domain/sauvegarde'

const SAUVEGARDE: EtatSauvegarde = { ecrituresEnAttente: false, verresEnAttente: 0 }

// N'affiche l'attente qu'après DELAI_ATTENTE_MS d'écritures en attente ; revient aussitôt à « Sauvegardé ».
export function IndicateurSauvegarde({ etat }: { etat: EtatSauvegarde }) {
  const [attenteConfirmee, setAttenteConfirmee] = useState(false)
  const enAttente = etat.ecrituresEnAttente

  useEffect(() => {
    if (!enAttente) {
      setAttenteConfirmee(false)
      return
    }
    const minuteur = setTimeout(() => setAttenteConfirmee(true), DELAI_ATTENTE_MS)
    return () => clearTimeout(minuteur)
  }, [enAttente])

  const affiche = enAttente && attenteConfirmee ? etat : SAUVEGARDE
  return (
    <span
      role="status"
      style={{ fontSize: 13, color: affiche.ecrituresEnAttente ? 'var(--moins)' : 'var(--texte-2)' }}
    >
      {libelleSauvegarde(affiche)}
    </span>
  )
}
