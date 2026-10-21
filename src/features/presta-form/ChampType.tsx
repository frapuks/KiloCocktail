import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import { comparerNoms } from '../../domain/affichage'
import type { TypeEvenement } from '../../domain/types'

interface Props {
  types: TypeEvenement[]
  valeur: string | null
  onChange(id: string | null): void
}

const AUCUN = ''

// Menu aux couleurs de l'appli. Les types se créent et se renomment dans Réglages, pas ici.
export function ChampType({ types, valeur, onChange }: Props) {
  // Un type archivé reste proposé s'il est déjà celui de la presta, pour ne pas le perdre en silence.
  const proposes = types.filter((t) => !t.archive || t.id === valeur).sort(comparerNoms)

  return (
    <TextField
      select
      label="Type"
      value={valeur ?? AUCUN}
      onChange={(e) => onChange(e.target.value === AUCUN ? null : e.target.value)}
      slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
    >
      <MenuItem value={AUCUN}>
        <em>Aucun</em>
      </MenuItem>
      {proposes.map((t) => (
        <MenuItem key={t.id} value={t.id}>
          {t.nom}
        </MenuItem>
      ))}
    </TextField>
  )
}
