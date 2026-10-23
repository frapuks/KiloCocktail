import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import type { Base, Cocktail } from '../../domain/types'
import { FeuilleModale, useFermerFeuille } from '../../ui/FeuilleModale'
import { PastilleAlcool } from '../../ui/PastilleAlcool'

interface Props {
  cocktail: Cocktail
  base?: Base
  onModifier(): void
  onFermer(): void
}

// Dans la feuille : les deux boutons la font redescendre ; « Modifier » note la suite à donner.
function Boutons({ onModifier }: { onModifier(): void }) {
  const fermer = useFermerFeuille()
  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Button
        variant="contained"
        onClick={() => {
          onModifier()
          fermer()
        }}
      >
        Modifier
      </Button>
      <Button variant="outlined" color="inherit" onClick={fermer}>
        Fermer
      </Button>
    </Box>
  )
}

// Fiche en lecture seule d'un cocktail ; « Modifier » ouvre la fiche de saisie une fois celle-ci redescendue.
export function InfosCocktail({ cocktail, base, onModifier, onFermer }: Props) {
  const [modifier, setModifier] = useState(false)
  return (
    <FeuilleModale libelle={cocktail.nom} onFermer={modifier ? onModifier : onFermer}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Typography variant="h2">{cocktail.nom}</Typography>
        {!cocktail.alcool && <PastilleAlcool alcool={false} />}
      </Box>
      {base && <Typography color="text.secondary">Base : {base.nom}</Typography>}
      {/* pre-wrap : les retours à la ligne saisis sont gardés. */}
      <Typography sx={{ whiteSpace: 'pre-wrap' }}>{cocktail.description}</Typography>
      <Boutons onModifier={() => setModifier(true)} />
    </FeuilleModale>
  )
}
