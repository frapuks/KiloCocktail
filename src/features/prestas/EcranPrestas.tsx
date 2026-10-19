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
      {/* Marge haute du h1 par défaut (0,67 × 2em) reprise ici, et bouton en marge négative, pour que le titre
          tombe au même endroit que sur Cocktails et Réglages. */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginTop: '1.34em' }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--police-titre)', fontWeight: 800 }}>Prestas</h1>
        <button
          type="button"
          onClick={() => navigate('/prestas/nouvelle')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            minHeight: 48,
            margin: '-6px 0',
            padding: '0 20px',
            border: 'none',
            borderRadius: 12,
            background: 'var(--avec)',
            color: 'var(--texte)',
            fontSize: 17,
            fontWeight: 700,
            fontFamily: 'inherit',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nouvelle presta
        </button>
      </header>
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
