import { Outlet, useNavigate } from 'react-router-dom'
import Stack from '@mui/material/Stack'
import { DEPUIS_APP } from '../../app/historique'
import { usePrestas, useTypes } from '../../data/hooks'
import type { Presta } from '../../domain/types'
import { EnTeteEcran } from '../../ui/EnTeteEcran'
import { TitreSection } from '../../ui/TitreSection'
import { CartePresta } from './CartePresta'

// Array.sort est stable : à date égale, l'ordre du dépôt est conservé.
const parDateCroissante = (a: Presta, b: Presta) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)
const parDateDecroissante = (a: Presta, b: Presta) => parDateCroissante(b, a)

export function EcranPrestas() {
  const navigate = useNavigate()
  const prestas = usePrestas()
  const types = useTypes()

  const toutes = prestas ?? []
  // La plus proche d'aujourd'hui en premier : la prochaine pour les en cours, la dernière pour les terminées.
  const sections = [
    { titre: 'En cours', couleur: 'primary.main', liste: toutes.filter((p) => p.statut === 'en-cours').sort(parDateCroissante) },
    // Trait gris : les terminées sont en retrait, comme leurs cartes.
    { titre: 'Terminées', couleur: 'divider', liste: toutes.filter((p) => p.statut === 'terminee').sort(parDateDecroissante) },
  ]

  return (
    <Stack spacing={3} sx={{ p: 2 }}>
      <EnTeteEcran titre="Prestas" action={{ libelle: 'Nouvelle presta', onClick: () => navigate('/prestas/nouvelle', { state: DEPUIS_APP }) }} />
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
