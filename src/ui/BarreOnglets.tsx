import { NavLink, useLocation } from 'react-router-dom'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import LocalBarIcon from '@mui/icons-material/LocalBar'
import SettingsIcon from '@mui/icons-material/Settings'
import BottomNavigation from '@mui/material/BottomNavigation'
import BottomNavigationAction from '@mui/material/BottomNavigationAction'
import Paper from '@mui/material/Paper'

const ONGLETS = [
  { vers: '/', libelle: 'Prestas', icone: <CalendarMonthIcon /> },
  { vers: '/cocktails', libelle: 'Cocktails', icone: <LocalBarIcon /> },
  { vers: '/reglages', libelle: 'Réglages', icone: <SettingsIcon /> },
]

export function BarreOnglets() {
  const { pathname } = useLocation()
  // Les feuilles ouvertes par-dessus la liste (/prestas/nouvelle, /prestas/:id/resultats) restent sous l'onglet
  // Prestas ; le comptage (/prestas/:id) n'a pas de barre d'onglets.
  const actif = pathname.startsWith('/prestas/') ? '/' : (ONGLETS.find((o) => o.vers === pathname)?.vers ?? false)

  return (
    <Paper
      component="nav"
      square
      sx={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        borderTop: 1,
        borderColor: 'divider',
        pb: 'env(safe-area-inset-bottom)',
      }}
    >
      <BottomNavigation showLabels value={actif} sx={{ height: 'auto', bgcolor: 'transparent' }}>
        {ONGLETS.map((o) => (
          <BottomNavigationAction
            key={o.vers}
            component={NavLink}
            to={o.vers}
            end
            value={o.vers}
            label={o.libelle}
            icon={o.icone}
            sx={{
              gap: 0.5,
              py: 1.25,
              color: 'text.secondary',
              // Trait actif posé sur le filet de la barre ; transparent sinon pour garder la même hauteur.
              mt: '-1px',
              borderTop: 3,
              borderColor: 'transparent',
              '&.Mui-selected': { color: 'primary.light', borderColor: 'primary.light' },
              '& .MuiBottomNavigationAction-label, & .MuiBottomNavigationAction-label.Mui-selected': {
                fontSize: 12,
                fontWeight: 600,
              },
            }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  )
}
