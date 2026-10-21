import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import Typography from '@mui/material/Typography'
import { useDepots } from '../../data/DepotsContext'
import { formatDate, nomPresta } from '../../domain/affichage'
import type { Presta, TypeEvenement } from '../../domain/types'
import { CompteurServis } from '../../ui/CompteurServis'
import { PastilleType } from '../../ui/PastilleType'

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
    <Card
      variant="outlined"
      sx={{
        borderRadius: 3,
        // Terminée : fond plus sombre que le fond de page, sans ombre, pour la mettre en retrait.
        bgcolor: terminee ? 'background.paper' : 'background.carte',
        boxShadow: terminee ? 'none' : '0 2px 6px rgba(0, 0, 0, 0.25)',
      }}
    >
      <CardActionArea
        component={Link}
        to={destination}
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 1.5,
          minHeight: 72,
          px: 2.25,
          py: 1.75,
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, minWidth: 0 }}>
          <Typography component="span" sx={{ fontWeight: 700, fontSize: 18 }}>
            {nomPresta(presta)}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            {type && <PastilleType nom={type.nom} />}
            <Typography component="span" color="text.secondary" sx={{ fontSize: 14 }}>
              {formatDate(presta.date)}
            </Typography>
          </Box>
        </Box>
        <CompteurServis total={total} />
      </CardActionArea>
    </Card>
  )
}
