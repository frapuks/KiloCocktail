import { useState, type FormEvent } from 'react'
import Check from '@mui/icons-material/Check'
import Close from '@mui/icons-material/Close'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'

interface Props {
  libelle: string
  valeurInitiale: string
  // Renvoie un message d'erreur pour refuser le nom, ou null s'il est enregistré.
  onValider(nom: string): string | null
  onAnnuler(): void
}

// Saisie d'un nom sur une ligne de liste (ajout ou renommage) : Entrée ou ✓ valide, Échap ou ✕ annule.
export function ChampNom({ libelle, valeurInitiale, onValider, onAnnuler }: Props) {
  const [nom, setNom] = useState(valeurInitiale)
  const [erreur, setErreur] = useState<string | null>(null)

  function valider(e: FormEvent) {
    e.preventDefault()
    setErreur(onValider(nom.trim()))
  }

  return (
    <Box component="form" onSubmit={valider} sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, flex: 1 }}>
      <TextField
        autoFocus
        value={nom}
        size="small"
        fullWidth
        error={erreur !== null}
        helperText={erreur}
        slotProps={{ htmlInput: { 'aria-label': libelle } }}
        onChange={(e) => {
          setNom(e.target.value)
          setErreur(null)
        }}
        onKeyDown={(e) => {
          if (e.key !== 'Escape') return
          // Échap annule la saisie sans fermer la feuille.
          e.stopPropagation()
          onAnnuler()
        }}
      />
      <IconButton type="submit" aria-label="Valider" color="primary">
        <Check />
      </IconButton>
      {/* « Annuler la saisie » : distinct du bouton « Annuler » qui referme la feuille. */}
      <IconButton aria-label="Annuler la saisie" onClick={onAnnuler}>
        <Close />
      </IconButton>
    </Box>
  )
}
