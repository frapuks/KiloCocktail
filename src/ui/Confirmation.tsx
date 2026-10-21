import { useId, type ReactNode } from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import { policeTitre } from './themeMui'

interface Props {
  titre: string
  message?: ReactNode
  // danger : action destructrice, suppression comprise (rouge plein) ; principale : action attendue, réversible (vert plein).
  actions: { libelle: string; onClick(): void; danger?: boolean; principale?: boolean; desactive?: boolean }[]
  onFermer(): void
}

export function Confirmation({ titre, message, actions, onFermer }: Props) {
  const idTitre = useId()

  return (
    <Dialog
      open
      onClose={onFermer}
      aria-labelledby={idTitre}
      fullWidth
      maxWidth="xs"
      slotProps={{ paper: { variant: 'outlined', sx: { bgcolor: 'background.default', borderRadius: 3 } } }}
    >
      <DialogTitle id={idTitre} sx={{ fontFamily: policeTitre, fontWeight: 600, fontSize: 24, lineHeight: 1.2 }}>
        {titre}
      </DialogTitle>
      <DialogContent>
        {message && <DialogContentText sx={{ mb: 1.5 }}>{message}</DialogContentText>}
        <Stack spacing={1.5}>
          {actions.map((a, i) => (
            <Button
              key={a.libelle}
              autoFocus={i === 0}
              variant={a.danger || a.principale ? 'contained' : 'outlined'}
              color={a.danger ? 'error' : a.principale ? 'primary' : 'inherit'}
              disabled={a.desactive}
              onClick={a.onClick}
            >
              {a.libelle}
            </Button>
          ))}
        </Stack>
      </DialogContent>
    </Dialog>
  )
}
