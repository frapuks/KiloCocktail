import { useState } from 'react'
import Alert from '@mui/material/Alert'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import type { DonneesCocktail } from '../../data/depots'
import { FeuilleModale } from '../../ui/FeuilleModale'
import { BoutonsFiche } from '../../ui/BoutonsFiche'
import { messageDoublon, trouverDoublon } from '../../domain/noms'
import type { Cocktail } from '../../domain/types'

interface Props {
  cocktail?: Cocktail
  cocktails: Cocktail[]
  onEnregistrer(d: DonneesCocktail): void
  onAnnuler(): void
  onArchiver?(): void
}

export function FicheCocktail({ cocktail, cocktails, onEnregistrer, onAnnuler, onArchiver }: Props) {
  const [nom, setNom] = useState(cocktail?.nom ?? '')
  const [alcool, setAlcool] = useState(cocktail?.alcool ?? true)
  const [description, setDescription] = useState(cocktail?.description ?? '')
  const [erreur, setErreur] = useState<string | null>(null)

  const renomme = cocktail !== undefined && nom.trim() !== cocktail.nom

  function enregistrer() {
    const nomPropre = nom.trim()
    if (!nomPropre) {
      setErreur('Donne un nom au cocktail')
      return
    }
    const doublon = trouverDoublon(cocktails, nomPropre, cocktail?.id)
    if (doublon) {
      setErreur(messageDoublon('Un cocktail', doublon))
      return
    }
    onEnregistrer({ nom: nomPropre, alcool, description: description.trim() })
  }

  return (
    <FeuilleModale
      libelle={cocktail ? 'Modifier le cocktail' : 'Nouveau cocktail'}
      onSubmit={enregistrer}
      // Tap à côté = Annuler : la saisie en cours est abandonnée.
      onFermer={onAnnuler}
    >
      <Typography variant="h2">{cocktail ? 'Modifier le cocktail' : 'Nouveau cocktail'}</Typography>
      <TextField
        label="Nom"
        value={nom}
        error={erreur !== null}
        onChange={(e) => {
          setNom(e.target.value)
          setErreur(null)
        }}
      />
      {renomme && (
        <Typography variant="body2" color="text.secondary">
          Le nouveau nom s'affichera aussi dans les prestas passées.
        </Typography>
      )}
      <FormControlLabel
        label="Alcool"
        labelPlacement="start"
        control={<Switch checked={alcool} onChange={(_, v) => setAlcool(v)} />}
        sx={{ mx: 0, justifyContent: 'space-between' }}
      />
      <TextField
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        multiline
        minRows={3}
        maxRows={10}
      />
      {erreur && <Alert severity="warning">{erreur}</Alert>}
      <BoutonsFiche onAnnuler={onAnnuler} onArchiver={cocktail ? onArchiver : undefined} />
    </FeuilleModale>
  )
}
