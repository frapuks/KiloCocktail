import { useNavigate } from 'react-router-dom'
import { usePrestas, useTypes } from '../../data/hooks'
import type { Presta } from '../../domain/types'
import { CartePresta } from './CartePresta'

// Array.sort est stable : à date égale, l'ordre du dépôt est conservé.
const parDateDecroissante = (a: Presta, b: Presta) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)

export function EcranPrestas() {
  const navigate = useNavigate()
  const prestas = usePrestas()
  const types = useTypes()

  const triees = [...(prestas ?? [])].sort(parDateDecroissante)
  const sections = [
    { titre: 'En cours', liste: triees.filter((p) => p.statut === 'en-cours') },
    { titre: 'Terminées', liste: triees.filter((p) => p.statut === 'terminee') },
  ]

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <button
        type="button"
        onClick={() => navigate('/prestas/nouvelle')}
        style={{
          minHeight: 48,
          border: 'none',
          borderRadius: 12,
          background: 'var(--avec)',
          color: 'var(--texte)',
          fontSize: 18,
          fontWeight: 700,
          fontFamily: 'inherit',
        }}
      >
        Nouvelle presta
      </button>
      {sections
        .filter((s) => s.liste.length > 0)
        .map((s) => (
          <section key={s.titre} aria-label={s.titre} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 style={{ margin: 0, fontFamily: 'var(--police-titre)', fontWeight: 800 }}>{s.titre}</h2>
            {s.liste.map((p) => (
              <CartePresta key={p.id} presta={p} types={types ?? []} />
            ))}
          </section>
        ))}
    </div>
  )
}
