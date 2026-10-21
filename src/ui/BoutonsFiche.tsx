import Box from '@mui/material/Box'
import Button from '@mui/material/Button'

interface Props {
  onAnnuler(): void
  // Absent : pas de bouton « Archiver » (création, ou élément déjà archivé).
  onArchiver?(): void
}

// Pied des fiches en feuille modale : « Enregistrer » soumet le formulaire ; « Archiver » à droite, en rouge.
// Hors des listes, les boutons sont en texte (les icônes sont réservées aux lignes de liste).
export function BoutonsFiche({ onAnnuler, onArchiver }: Props) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Button type="submit" variant="contained">
        Enregistrer
      </Button>
      <Button variant="outlined" color="inherit" onClick={onAnnuler}>
        Annuler
      </Button>
      {onArchiver && (
        <Button variant="outlined" color="error" onClick={onArchiver} sx={{ ml: 'auto' }}>
          Archiver
        </Button>
      )}
    </Box>
  )
}
