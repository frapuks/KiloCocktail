import Drawer from '@mui/material/Drawer'
import Stack from '@mui/material/Stack'
import { createContext, useContext, useEffect, useState, type FormEvent, type ReactNode } from 'react'

interface Props {
  libelle: string
  // Absent : simple panneau (pas de formulaire), les boutons gèrent eux-mêmes leurs actions.
  onSubmit?(): void
  // Présent : un tap sur le fond (ou Échap) referme la feuille, appelé une fois la glissade de sortie finie.
  // Absent : seuls les boutons de la feuille la ferment.
  onFermer?(): void
  // Présent : un tap sur le fond (ou Échap) appelle ceci au lieu de fermer (ex. confirmer l'abandon d'une saisie).
  onDemandeFermeture?(): void
  // Passé à true par le parent : la feuille redescend, puis onFermer est appelé.
  fermee?: boolean
  children: ReactNode
}

const FermerFeuille = createContext<() => void>(() => {})

// Referme la feuille englobante en jouant la glissade de sortie (feuilles avec onFermer).
export const useFermerFeuille = () => useContext(FermerFeuille)

// Feuille qui monte du bas de l'écran.
export function FeuilleModale({ libelle, onSubmit, onFermer, onDemandeFermeture, fermee = false, children }: Props) {
  // Ouverte juste après le montage : le Drawer ne joue la glissade d'entrée que sur un passage de open à true.
  const [ouverte, setOuverte] = useState(false)
  useEffect(() => setOuverte(true), [])
  const fermer = () => setOuverte(false)

  return (
    <Drawer
      open={ouverte && !fermee}
      anchor="bottom"
      onClose={onDemandeFermeture ?? (onFermer && fermer)}
      slotProps={{
        transition: { onExited: onFermer },
        paper: {
          sx: {
            mx: 'auto',
            width: '100%',
            maxWidth: 520,
            maxHeight: '100%',
            borderTop: 1,
            borderColor: 'divider',
            borderRadius: '12px 12px 0 0',
            bgcolor: 'background.default',
          },
        },
      }}
    >
      <FermerFeuille.Provider value={fermer}>
        <Stack
          component={onSubmit ? 'form' : 'div'}
          role="dialog"
          aria-modal="true"
          aria-label={libelle}
          onSubmit={
            onSubmit &&
            ((e: FormEvent) => {
              e.preventDefault()
              onSubmit()
            })
          }
          spacing={1.5}
          sx={{ p: 2.5, pb: 'calc(20px + env(safe-area-inset-bottom))' }}
        >
          {children}
        </Stack>
      </FermerFeuille.Provider>
    </Drawer>
  )
}
