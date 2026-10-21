import Chip from '@mui/material/Chip'

export function PastilleAlcool({ alcool }: { alcool: boolean }) {
  return (
    <Chip
      label={alcool ? 'Avec alcool' : 'Sans alcool'}
      size="small"
      color={alcool ? 'primary' : 'secondary'}
      sx={{ fontSize: 12, fontWeight: 600 }}
    />
  )
}
