import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDepots } from '../../data/DepotsContext'
import { formatDate, libelleServis, nomPresta } from '../../domain/affichage'
import type { Presta, TypeEvenement } from '../../domain/types'

export function CartePresta({ presta, types }: { presta: Presta; types: TypeEvenement[] }) {
  const depots = useDepots()
  const [total, setTotal] = useState<number | null>(null)

  useEffect(() => {
    let actif = true
    setTotal(null)
    depots.prestas.compterServis(presta.id).then((n) => {
      if (actif) setTotal(n)
    })
    return () => {
      actif = false
    }
  }, [depots, presta.id])

  const type = presta.typeId ? types.find((t) => t.id === presta.typeId) : undefined
  const destination = presta.statut === 'en-cours' ? `/prestas/${presta.id}` : `/prestas/${presta.id}/resultats`

  return (
    <Link
      to={destination}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        minHeight: 64,
        padding: '12px 16px',
        border: '1px solid var(--filet)',
        borderRadius: 12,
        color: 'var(--texte)',
        textDecoration: 'none',
      }}
    >
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontWeight: 600 }}>{nomPresta(presta)}</span>
        {type && <span style={{ color: 'var(--texte-2)' }}>{type.nom}</span>}
        <span style={{ color: 'var(--texte-2)' }}>{formatDate(presta.date)}</span>
      </span>
      <span style={{ fontFamily: 'var(--police-titre)', fontWeight: 600, fontSize: 20, whiteSpace: 'nowrap' }}>
        {total === null ? '—' : `${total} ${libelleServis(total)}`}
      </span>
    </Link>
  )
}
