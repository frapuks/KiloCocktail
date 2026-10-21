import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { Variante } from '../domain/types'

interface Props {
  titre: string
  // Couleur du trait sous le titre (chemin de la palette du thème).
  couleur?: string
  // Niveau de titre : h2 sous le titre d'un écran, h3 sous celui d'une feuille, h4 en dessous.
  niveau?: 'h2' | 'h3' | 'h4'
  // Pour aria-labelledby de la section.
  id?: string
  // Élément à droite du titre, sur la même ligne et au-dessus du même trait (bouton, interrupteur).
  action?: ReactNode
}

// Titre de section souligné d'un trait de couleur, partout dans l'appli (écrans et feuilles).
// alignSelf : le trait couvre toute la largeur, même dans une colonne alignée à gauche.
export function TitreSection({ titre, couleur = 'primary.main', niveau = 'h2', id, action }: Props) {
  return (
    <Box
      sx={{
        alignSelf: 'stretch',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1,
        pb: 0.5,
        borderBottom: 2,
        borderColor: couleur,
      }}
    >
      <Typography id={id} variant="h2" component={niveau} sx={{ fontWeight: 600 }}>
        {titre}
      </Typography>
      {action}
    </Box>
  )
}

// Couleur du trait d'un groupe « Avec alcool » / « Sans alcool ».
export const couleurGroupe = (variante: Variante) => (variante === 'avec' ? 'primary.main' : 'secondary.main')
