import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import { comparerNoms } from '../domain/affichage'
import type { Base, Cocktail } from '../domain/types'

// Valeur du filtre : TOUTES, SANS_BASE, ou l'id d'une base (jamais « * » ni « - »).
export type FiltreBase = string
export const TOUTES = '*'
export const SANS_BASE = '-'

// Bases du menu : toutes les actives (même sans cocktail), et les archivées qu'ont encore des cocktails,
// sans quoi ces cocktails ne se retrouveraient que sous « Toutes ».
export function basesProposees(bases: Base[], cocktails: Cocktail[]): Base[] {
  return bases.filter((b) => !b.archive || cocktails.some((c) => c.baseId === b.id)).sort(comparerNoms)
}

// Filtre appliqué : une base sortie du menu entre-temps (archivée, supprimée) revient à « Toutes ».
export function filtreApplique(filtre: FiltreBase, proposees: Base[]): FiltreBase {
  return filtre === TOUTES || filtre === SANS_BASE || proposees.some((b) => b.id === filtre) ? filtre : TOUTES
}

export function gardeBase(filtre: FiltreBase): (c: Cocktail) => boolean {
  if (filtre === TOUTES) return () => true
  if (filtre === SANS_BASE) return (c) => !c.baseId
  return (c) => c.baseId === filtre
}

interface Props {
  // Déjà passée par filtreApplique.
  valeur: FiltreBase
  onChange(f: FiltreBase): void
  // basesProposees.
  bases: Base[]
}

// Menu « Base » : Toutes, chaque base proposée, puis Sans base.
export function FiltreBase({ valeur, onChange, bases }: Props) {
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
      {bases.map((b) => (
        <MenuItem key={b.id} value={b.id}>
          {b.archive ? `${b.nom} (archivée)` : b.nom}
        </MenuItem>
      ))}
      <MenuItem value={SANS_BASE}>
        <em>Sans base</em>
      </MenuItem>
    </TextField>
  )
}
