import LocalBarIcon from '@mui/icons-material/LocalBar'
import Box from '@mui/material/Box'
import { keyframes, type SxProps, type Theme } from '@mui/material/styles'
import { libelleServis } from '../domain/affichage'
import { policeTitre } from './themeMui'

const rebondir = keyframes`
  40% { transform: scale(1.35); }
`

// Texte lu par les lecteurs d'écran mais invisible.
const masque = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
} as const

// Verre simple, sans dessin à l'intérieur ; taille relative au texte : l'icône suit la taille du compteur.
const IconeVerre = () => <LocalBarIcon sx={{ flex: 'none', fontSize: '1.45em' }} />
interface Props {
  // null : total pas encore connu (ou indisponible).
  total: number | null
  // Change à chaque tap pour relancer l'animation du nombre ; absent = pas d'animation.
  rebond?: number
  // Taille du texte (le nombre et l'icône suivent) : 15 px par défaut.
  sx?: SxProps<Theme>
}

// Nombre de cocktails servis, avec une icône de verre (liste des prestas, cartes de comptage).
export function CompteurServis({ total, rebond, sx }: Props) {
  const nombre = { fontFamily: policeTitre, fontWeight: 800, fontSize: '1.6em', lineHeight: 1 }
  return (
    <Box
      component="span"
      sx={[
        // Toujours sur une ligne, sans se tasser : c'est le reste de la carte qui cède la place.
        { display: 'flex', flexWrap: 'nowrap', flexShrink: 0, alignItems: 'center', gap: '8px', fontSize: 15, whiteSpace: 'nowrap' },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <IconeVerre />
      {total === null ? (
        <Box component="span" sx={nombre}>
          —
        </Box>
      ) : (
        <>
          <Box
            component="span"
            key={rebond ?? 0}
            sx={[
              nombre,
              !!rebond && {
                display: 'inline-block',
                animation: `${rebondir} 260ms ease-out`,
                '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
              },
            ]}
          >
            {total}
          </Box>{' '}
          {/* Masqué à l'écran (l'icône de verre suffit), lu par VoiceOver : « 14 servis ». */}
          <Box component="span" sx={masque}>
            {libelleServis(total)}
          </Box>
        </>
      )}
    </Box>
  )
}
