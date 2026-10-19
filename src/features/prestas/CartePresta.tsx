import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDepots } from '../../data/DepotsContext'
import { formatDate, nomPresta } from '../../domain/affichage'
import type { Presta, TypeEvenement } from '../../domain/types'
import { CompteurServis } from '../../ui/CompteurServis'

export function CartePresta({ presta, types }: { presta: Presta; types: TypeEvenement[] }) {
  const depots = useDepots()
  const [total, setTotal] = useState<number | null>(() => depots.prestas.dernierTotalServis(presta.id))

  useEffect(() => {
    let actif = true
    // Dernier total connu affiché tout de suite, remplacé par le compte du serveur dès qu'il arrive.
    setTotal(depots.prestas.dernierTotalServis(presta.id))
    depots.prestas.compterServis(presta.id).then((n) => {
      if (actif) setTotal(n)
    })
    return () => {
      actif = false
    }
  }, [depots, presta.id])

  const type = presta.typeId ? types.find((t) => t.id === presta.typeId) : undefined
  const terminee = presta.statut === 'terminee'
  const destination = terminee ? `/prestas/${presta.id}/resultats` : `/prestas/${presta.id}`

  return (
    <Link
      to={destination}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        minHeight: 72,
        padding: '14px 18px',
        border: '1px solid var(--filet)',
        borderRadius: 12,
        // Terminée : fond plus sombre que le fond de page, sans ombre, pour la mettre en retrait.
        background: terminee ? 'var(--fond-barre)' : 'var(--fond-carte)',
        boxShadow: terminee ? 'none' : '0 2px 6px rgba(0, 0, 0, 0.25)',
        color: 'var(--texte)',
        textDecoration: 'none',
      }}
    >
      <span style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
        <span style={{ fontWeight: 700, fontSize: 18 }}>{nomPresta(presta)}</span>
        <span style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          {type && (
            <span
              style={{
                padding: '2px 10px',
                borderRadius: 999,
                background: 'var(--avec-creux)',
                color: 'var(--texte)',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {type.nom}
            </span>
          )}
          <span style={{ color: 'var(--texte-2)', fontSize: 14 }}>{formatDate(presta.date)}</span>
        </span>
      </span>
      <CompteurServis total={total} />
    </Link>
  )
}
