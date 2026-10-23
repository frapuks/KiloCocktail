import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import type { Cocktail } from '../../domain/types'
import { FeuilleModale, useFermerFeuille } from '../../ui/FeuilleModale'
import { PastilleAlcool } from '../../ui/PastilleAlcool'

interface Props {
  cocktail: Cocktail
  onModifier(): void
  onFermer(): void
}

// Dans la feuille : « Fermer » la fait redescendre avant d'appeler onFermer.
function Boutons({ onModifier }: { onModifier(): void }) {
  const fermer = useFermerFeuille()
  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Button variant="contained" onClick={onModifier}>
        Modifier
      </Button>
      <Button variant="outlined" color="inherit" onClick={fermer}>
        Fermer
      </Button>
    </Box>
  )
}

// Fiche en lecture seule d'un cocktail ; « Modifier » ouvre la fiche de saisie.
export function InfosCocktail({ cocktail, onModifier, onFermer }: Props) {
  return (
    <FeuilleModale libelle={cocktail.nom} onFermer={onFermer}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Typography variant="h2">{cocktail.nom}</Typography>
        {!cocktail.alcool && <PastilleAlcool alcool={false} />}
      </Box>
      {/* pre-wrap : les retours à la ligne saisis sont gardés. */}
      <Typography sx={{ whiteSpace: 'pre-wrap' }}>{cocktail.description}</Typography>
      <Boutons onModifier={onModifier} />
    </FeuilleModale>
  )
}
