import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { libelleCumul } from '../../domain/cumul'
import type { Variante } from '../../domain/types'
import { CompteurServis } from '../../ui/CompteurServis'
import { useCumul } from './useCumul'

interface Props {
  nom: string
  sousTitre: string | null
  total: number
  variante: Variante
  onPlus(): void
  onAnnulerPlus(): void
  onMoins(): boolean
}

const estValidation = (e: KeyboardEvent) => e.key === 'Enter' || e.key === ' '

export function CarteCocktail({ nom, sousTitre, total, variante, onPlus, onAnnulerPlus, onMoins }: Props) {
  const { cumul, taper, annuler } = useCumul()
  // Pointeur du dernier +1, tant qu'il peut encore être annulé par un pointercancel (défilement).
  const dernierPlus = useRef<{ pointerId: number } | null>(null)
  // Relance l'animation à chaque tap.
  const [impulsion, setImpulsion] = useState<{ signe: 1 | -1; n: number } | null>(null)

  const plus = (pointerId: number | null) => {
    dernierPlus.current = pointerId === null ? null : { pointerId }
    onPlus()
    taper(1)
    setImpulsion((i) => ({ signe: 1, n: (i?.n ?? 0) + 1 }))
  }
  const moins = () => {
    if (total === 0 || !onMoins()) return
    dernierPlus.current = null
    taper(-1)
    setImpulsion((i) => ({ signe: -1, n: (i?.n ?? 0) + 1 }))
  }

  return (
    <div
      className={`carte carte-${variante}`}
      role="button"
      tabIndex={0}
      aria-label={sousTitre ? `${nom}, ${sousTitre}` : nom}
      onPointerDown={(e: PointerEvent) => {
        if ((e.target as Element).closest('button')) return
        plus(e.pointerId)
      }}
      onPointerCancel={(e: PointerEvent) => {
        const dernier = dernierPlus.current
        if (!dernier || dernier.pointerId !== e.pointerId) return
        dernierPlus.current = null
        annuler()
        onAnnulerPlus()
      }}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget || !estValidation(e)) return
        e.preventDefault()
        plus(null)
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
      <CompteurServis total={total} rebond={impulsion?.n} className="carte-servis" />
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
        aria-label={`Retirer un ${nom}${sousTitre ? ` ${sousTitre}` : ''}`}
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
