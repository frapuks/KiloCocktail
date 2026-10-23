import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import { comparerNoms } from '../domain/affichage'
import type { Base, Cocktail } from '../domain/types'

// Valeur du filtre : TOUTES, SANS_BASE, ou l'id d'une base (jamais « * » ni « - »).
export type FiltreBase = string
export const TOUTES = '*'
export const SANS_BASE = '-'

export function gardeBase(filtre: FiltreBase): (c: Cocktail) => boolean {
  if (filtre === TOUTES) return () => true
  if (filtre === SANS_BASE) return (c) => !c.baseId
  return (c) => c.baseId === filtre
}

interface Props {
  valeur: FiltreBase
  onChange(f: FiltreBase): void
  bases: Base[]
}

// Menu « Base » : Toutes, chaque base active (même sans cocktail), puis Sans base.
export function FiltreBase({ valeur, onChange, bases }: Props) {
  const actives = bases.filter((b) => !b.archive).sort(comparerNoms)
  return (
    <TextField
      select
      size="small"
      label="Base"
      value={valeur}
      onChange={(e) => onChange(e.target.value)}
      sx={{ minWidth: 180 }}
    >
      <MenuItem value={TOUTES}>Toutes</MenuItem>
      {actives.map((b) => (
        <MenuItem key={b.id} value={b.id}>
          {b.nom}
        </MenuItem>
      ))}
      <MenuItem value={SANS_BASE}>
        <em>Sans base</em>
      </MenuItem>
    </TextField>
  )
}
