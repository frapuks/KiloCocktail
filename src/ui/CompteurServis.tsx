import { libelleServis } from '../domain/affichage'
import './compteur-servis.css'

function IconeVerre() {
  return (
    <svg className="servis-verre" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
      <path d="M5 3h14l-2 17a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L5 3z" />
    </svg>
  )
}

interface Props {
  // null : total pas encore connu (ou indisponible).
  total: number | null
  // Change à chaque tap pour relancer l'animation du nombre ; absent = pas d'animation.
  rebond?: number
  className?: string
}

export function CompteurServis({ total, rebond, className }: Props) {
  return (
    <span className={`servis ${className ?? ''}`}>
      <IconeVerre />
      {total === null ? (
        <span className="servis-nombre">—</span>
      ) : (
        <>
          <span key={rebond ?? 0} className={`servis-nombre ${rebond ? 'servis-rebond' : ''}`}>
            {total}
          </span>{' '}
          <span>{libelleServis(total)}</span>
        </>
      )}
    </span>
  )
}
