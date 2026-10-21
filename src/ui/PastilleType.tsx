import Chip from '@mui/material/Chip'

// Type d'événement d'une presta, en pastille (liste des prestas, comptage).
export function PastilleType({ nom }: { nom: string }) {
  return <Chip label={nom} size="small" sx={{ bgcolor: 'primary.dark', fontSize: 13, fontWeight: 600 }} />
}
