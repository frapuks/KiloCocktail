import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import { comparerNoms } from '../domain/affichage'

interface Props {
  label: string
  // Première option, pour « aucun élément » (valeur null).
  libelleAucun: string
  elements: { id: string; nom: string; archive: boolean }[]
  valeur: string | null
  onChange(id: string | null): void
}

const AUCUN = ''

// Menu aux couleurs de l'appli, sur une liste gérée dans Réglages (types d'événement, bases).
export function ChampChoix({ label, libelleAucun, elements, valeur, onChange }: Props) {
  // Un élément archivé reste proposé s'il est déjà celui choisi, pour ne pas le perdre en silence.
  const proposes = elements.filter((e) => !e.archive || e.id === valeur).sort(comparerNoms)

  return (
    <TextField
      select
      label={label}
      value={valeur ?? AUCUN}
      onChange={(e) => onChange(e.target.value === AUCUN ? null : e.target.value)}
      slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
    >
      <MenuItem value={AUCUN}>
        <em>{libelleAucun}</em>
      </MenuItem>
      {proposes.map((e) => (
        <MenuItem key={e.id} value={e.id}>
          {e.nom}
        </MenuItem>
      ))}
    </TextField>
  )
}
