import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { BoutonNouveau } from './BoutonNouveau'

interface Props {
  titre: string
  action?: { libelle: string; onClick(): void }
}

// En-tête commun aux écrans à onglets : le titre tombe au même endroit qu'il y ait un bouton ou non.
export function EnTeteEcran({ titre, action }: Props) {
  return (
    // Marge haute du h1 par défaut (0,67 × 2em) reprise ici, et bouton en marge négative.
    <Box
      component="header"
      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mt: '1.34em', minHeight: 36 }}
    >
      <Typography variant="h1">{titre}</Typography>
      {action && <BoutonNouveau libelle={action.libelle} onClick={action.onClick} sx={{ my: '-6px' }} />}
    </Box>
  )
}
