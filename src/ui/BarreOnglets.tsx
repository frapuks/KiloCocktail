import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

function Icone({ children }: { children: ReactNode }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}

const ONGLETS = [
  {
    vers: '/',
    libelle: 'Prestas',
    icone: (
      <Icone>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 3v4M16 3v4" />
      </Icone>
    ),
  },
  {
    vers: '/cocktails',
    libelle: 'Cocktails',
    icone: (
      <Icone>
        <path d="M4 4h16l-8 9-8-9zM12 13v7M8 20h8" />
      </Icone>
    ),
  },
  {
    vers: '/reglages',
    libelle: 'Réglages',
    icone: (
      <Icone>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </Icone>
    ),
  },
]

export function BarreOnglets() {
  return (
    <nav
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        background: 'var(--fond-barre)',
        borderTop: '1px solid var(--filet)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {ONGLETS.map((o) => (
        <NavLink
          key={o.vers}
          to={o.vers}
          end
          style={({ isActive }) => ({
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            padding: '10px 8px',
            // Trait actif posé sur le filet de la barre ; transparent sinon pour garder la même hauteur.
            marginTop: -1,
            borderTop: `3px solid ${isActive ? 'var(--avec-flash)' : 'transparent'}`,
            textDecoration: 'none',
            fontSize: 12,
            fontWeight: 600,
            color: isActive ? 'var(--avec-flash)' : 'var(--texte-2)',
          })}
        >
          {o.icone}
          {o.libelle}
        </NavLink>
      ))}
    </nav>
  )
}
