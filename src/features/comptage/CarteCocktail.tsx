import { useState, type KeyboardEvent, type PointerEvent } from 'react'
import { libelleCumul } from '../../domain/cumul'
import type { Variante } from '../../domain/types'
import { libelleServis } from '../../domain/affichage'
import { useCumul } from './useCumul'

interface Props {
  nom: string
  sousTitre: string | null
  total: number
  variante: Variante
  onPlus(): void
  onMoins(): boolean
}

const estValidation = (e: KeyboardEvent) => e.key === 'Enter' || e.key === ' '

function IconeVerre() {
  return (
    <svg className="carte-verre" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
      <path d="M5 3h14l-2 17a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L5 3z" />
    </svg>
  )
}

export function CarteCocktail({ nom, sousTitre, total, variante, onPlus, onMoins }: Props) {
  const { cumul, taper } = useCumul()
  // Relance l'animation à chaque tap.
  const [impulsion, setImpulsion] = useState<{ signe: 1 | -1; n: number } | null>(null)

  const plus = () => {
    onPlus()
    taper(1)
    setImpulsion((i) => ({ signe: 1, n: (i?.n ?? 0) + 1 }))
  }
  const moins = () => {
    if (total === 0 || !onMoins()) return
    taper(-1)
    setImpulsion((i) => ({ signe: -1, n: (i?.n ?? 0) + 1 }))
  }

  return (
    <div
      className={`carte carte-${variante}`}
      role="button"
      tabIndex={0}
      aria-label={nom}
      onPointerDown={(e: PointerEvent) => {
        if ((e.target as Element).closest('button')) return
        plus()
      }}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget || !estValidation(e)) return
        e.preventDefault()
        plus()
      }}
    >
      {impulsion && (
        <span
          key={impulsion.n}
          className={`carte-flash ${impulsion.signe === 1 ? 'carte-flash-plus' : 'carte-flash-moins'}`}
          aria-hidden="true"
        />
      )}
      <span className="carte-titre">
        <span className="carte-nom">{nom}</span>
        {sousTitre && <span className="carte-sous-titre">{sousTitre}</span>}
      </span>
      <span className="carte-servis">
        <IconeVerre />
        <span key={impulsion?.n ?? 0} className={impulsion ? 'carte-rebond' : undefined}>{total}</span>
        {' '}
        <span>{libelleServis(total)}</span>
      </span>
      <span
        className={`carte-cumul ${cumul?.signe === -1 ? 'carte-cumul-moins' : ''}`}
        style={{ opacity: cumul ? 1 : 0 }}
        aria-hidden="true"
      >
        {cumul ? libelleCumul(cumul) : ''}
      </span>
      <button
        type="button"
        className="carte-moins"
        aria-label={`Retirer un ${nom}`}
        disabled={total === 0}
        onPointerDown={(e) => {
          e.stopPropagation()
          moins()
        }}
        onKeyDown={(e) => {
          if (!estValidation(e)) return
          e.preventDefault()
          e.stopPropagation()
          moins()
        }}
      >
        −
      </button>
    </div>
  )
}
