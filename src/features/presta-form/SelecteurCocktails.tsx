import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import { basculerCocktail } from '../../domain/lignes'
import type { Cocktail, Ligne } from '../../domain/types'
import { PastilleAlcool } from '../../ui/PastilleAlcool'

interface Props {
  options: Cocktail[]
  lignes: Ligne[]
  onChange(lignes: Ligne[]): void
}

const genId = () => crypto.randomUUID()

// Liste à cocher. Les cocktails se créent dans l'onglet Cocktails, pas ici.
export function SelecteurCocktails({ options, lignes, onChange }: Props) {
  return (
    <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }}>
      {options.map((cocktail) => (
        <Box component="li" key={cocktail.id} sx={{ minHeight: 44 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={lignes.some((l) => l.cocktailId === cocktail.id)}
                onChange={() => onChange(basculerCocktail(lignes, cocktail, genId))}
              />
            }
            label={
              <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {cocktail.nom}
                <PastilleAlcool alcool={cocktail.alcool} />
              </Box>
            }
          />
        </Box>
      ))}
    </Box>
  )
}
