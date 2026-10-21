import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import type { Cocktail } from '../domain/types'

export type FiltreAlcool = 'tous' | 'avec' | 'sans'

export const gardeAlcool: Record<FiltreAlcool, (c: Cocktail) => boolean> = {
  tous: () => true,
  avec: (c) => c.alcool,
  sans: (c) => !c.alcool,
}

interface Props {
  valeur: FiltreAlcool
  onChange(f: FiltreAlcool): void
  // Cocktails comptés dans chaque bouton.
  cocktails: Cocktail[]
}

// Filtre « Tous / Avec alcool / Sans alcool », avec le nombre de cocktails de chaque groupe.
export function FiltreAlcool({ valeur, onChange, cocktails }: Props) {
  const nombre = (f: FiltreAlcool) => cocktails.filter(gardeAlcool[f]).length
  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={valeur}
      // null quand on retouche le bouton déjà choisi : le filtre reste en place.
      onChange={(_, v: FiltreAlcool | null) => v && onChange(v)}
      aria-label="Filtrer les cocktails"
    >
      <ToggleButton value="tous">Tous ({nombre('tous')})</ToggleButton>
      <ToggleButton value="avec">Avec alcool ({nombre('avec')})</ToggleButton>
      <ToggleButton value="sans">Sans alcool ({nombre('sans')})</ToggleButton>
    </ToggleButtonGroup>
  )
}
