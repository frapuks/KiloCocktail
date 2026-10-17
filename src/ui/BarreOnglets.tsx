import { NavLink } from 'react-router-dom'

const ONGLETS = [
  { vers: '/', libelle: 'Prestas' },
  { vers: '/cocktails', libelle: 'Cocktails' },
  { vers: '/reglages', libelle: 'Réglages' },
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
        background: 'var(--fond)',
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
            padding: '14px 8px',
            textAlign: 'center',
            textDecoration: 'none',
            fontWeight: 600,
            color: isActive ? 'var(--texte)' : 'var(--texte-2)',
          })}
        >
          {o.libelle}
        </NavLink>
      ))}
    </nav>
  )
}
