import { Outlet, useNavigate } from 'react-router-dom'
import Stack from '@mui/material/Stack'
import { usePrestas, useTypes } from '../../data/hooks'
import type { Presta } from '../../domain/types'
import { EnTeteEcran } from '../../ui/EnTeteEcran'
import { TitreSection } from '../../ui/TitreSection'
import { CartePresta } from './CartePresta'

// Array.sort est stable : à date égale, l'ordre du dépôt est conservé.
const parDateDecroissante = (a: Presta, b: Presta) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)

export function EcranPrestas() {
  const navigate = useNavigate()
  const prestas = usePrestas()
  const types = useTypes()

  const triees = [...(prestas ?? [])].sort(parDateDecroissante)
  const sections = [
    { titre: 'En cours', couleur: 'primary.main', liste: triees.filter((p) => p.statut === 'en-cours') },
    // Trait gris : les terminées sont en retrait, comme leurs cartes.
    { titre: 'Terminées', couleur: 'divider', liste: triees.filter((p) => p.statut === 'terminee') },
  ]

  return (
    <Stack spacing={3} sx={{ p: 2 }}>
      <EnTeteEcran titre="Prestas" action={{ libelle: 'Nouvelle presta', onClick: () => navigate('/prestas/nouvelle') }} />
      {sections
        .filter((s) => s.liste.length > 0)
        .map((s) => (
          <Stack key={s.titre} component="section" aria-label={s.titre} spacing={1.5}>
            <TitreSection titre={s.titre} couleur={s.couleur} />
            {s.liste.map((p) => (
              <CartePresta key={p.id} presta={p} types={types ?? []} />
            ))}
          </Stack>
        ))}
      <Outlet />
    </Stack>
  )
}
