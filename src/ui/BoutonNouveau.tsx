import Add from '@mui/icons-material/Add'
import Button from '@mui/material/Button'
import type { SxProps, Theme } from '@mui/material/styles'

interface Props {
  libelle: string
  onClick(): void
  sx?: SxProps<Theme>
}

// Bouton de création commun (presta, cocktail, type d'événement) : icône +, coins peu arrondis.
export function BoutonNouveau({ libelle, onClick, sx }: Props) {
  return (
    <Button
      variant="contained"
      onClick={onClick}
      startIcon={<Add />}
      sx={[{ minHeight: 48, px: 2.5, borderRadius: 1.5, fontSize: 17, fontWeight: 700 }, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      {libelle}
    </Button>
  )
}
