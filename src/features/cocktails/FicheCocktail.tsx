import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import type { DonneesCocktail } from '../../data/depots'
import { FeuilleModale } from '../../ui/FeuilleModale'
import { BoutonsFiche } from '../../ui/BoutonsFiche'
import { messageDoublon, trouverDoublon } from '../../domain/noms'
import type { Base, Cocktail, Variante } from '../../domain/types'
import { ChampChoix } from '../../ui/ChampChoix'

// « les-deux » (création seulement) : deux cocktails du même nom, un avec et un sans alcool.
type Versions = Variante | 'les-deux'

interface Props {
  cocktail?: Cocktail
  cocktails: Cocktail[]
  bases: Base[]
  // Un cocktail, ou deux en création « Les deux » (avec alcool d'abord).
  onEnregistrer(d: DonneesCocktail[]): void
  onAnnuler(): void
  onArchiver?(): void
}

function ChampDescription({ label, valeur, onChange }: { label: string; valeur: string; onChange(v: string): void }) {
  return <TextField label={label} value={valeur} onChange={(e) => onChange(e.target.value)} multiline minRows={3} maxRows={10} />
}

export function FicheCocktail({ cocktail, cocktails, bases, onEnregistrer, onAnnuler, onArchiver }: Props) {
  const [nom, setNom] = useState(cocktail?.nom ?? '')
  const [versions, setVersions] = useState<Versions>(cocktail && !cocktail.alcool ? 'sans' : 'avec')
  const [baseId, setBaseId] = useState<string | null>(cocktail?.baseId ?? null)
  const [description, setDescription] = useState(cocktail?.description ?? '')
  // Base et description de la version sans alcool, en création « Les deux ».
  const [baseIdSans, setBaseIdSans] = useState<string | null>(null)
  const [descriptionSans, setDescriptionSans] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)

  const renomme = cocktail !== undefined && nom.trim() !== cocktail.nom
  const lesDeux = versions === 'les-deux'

  function choisir(v: Versions) {
    setVersions(v)
    setErreur(null)
  }

  function enregistrer() {
    const nomPropre = nom.trim()
    if (!nomPropre) {
      setErreur('Donne un nom au cocktail')
      return
    }
    const donnees: DonneesCocktail[] = lesDeux
      ? [
          { nom: nomPropre, alcool: true, description: description.trim(), baseId },
          { nom: nomPropre, alcool: false, description: descriptionSans.trim(), baseId: baseIdSans },
        ]
      : [{ nom: nomPropre, alcool: versions === 'avec', description: description.trim(), baseId }]
    // Le nom est unique par version : un « Mojito » avec alcool et un « Mojito » sans alcool peuvent coexister.
    for (const { alcool } of donnees) {
      const doublon = trouverDoublon(cocktails.filter((c) => c.alcool === alcool), nomPropre, cocktail?.id)
      if (doublon) {
        setErreur(messageDoublon(alcool ? 'Un cocktail avec alcool' : 'Un cocktail sans alcool', doublon))
        return
      }
    }
    onEnregistrer(donnees)
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
      {cocktail ? (
        <FormControlLabel
          label="Alcool"
          labelPlacement="start"
          control={<Switch checked={versions === 'avec'} onChange={(_, v) => choisir(v ? 'avec' : 'sans')} />}
          sx={{ mx: 0, justifyContent: 'space-between' }}
        />
      ) : (
        <ToggleButtonGroup
          exclusive
          fullWidth
          size="small"
          value={versions}
          // null quand on retouche le bouton déjà choisi : le choix reste en place.
          onChange={(_, v: Versions | null) => v && choisir(v)}
          aria-label="Versions à créer"
        >
          <ToggleButton value="avec">Avec alcool</ToggleButton>
          <ToggleButton value="sans">Sans alcool</ToggleButton>
          <ToggleButton value="les-deux">Les deux</ToggleButton>
        </ToggleButtonGroup>
      )}
      {lesDeux ? (
        <>
          <ChampChoix label="Base avec alcool" libelleAucun="Aucune" elements={bases} valeur={baseId} onChange={setBaseId} />
          <ChampDescription label="Description avec alcool" valeur={description} onChange={setDescription} />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              size="small"
              disabled={!description.trim() && baseId === null}
              onClick={() => {
                setBaseIdSans(baseId)
                setDescriptionSans(description)
              }}
            >
              Copier vers la version sans alcool
            </Button>
          </Box>
          <ChampChoix label="Base sans alcool" libelleAucun="Aucune" elements={bases} valeur={baseIdSans} onChange={setBaseIdSans} />
          <ChampDescription label="Description sans alcool" valeur={descriptionSans} onChange={setDescriptionSans} />
        </>
      ) : (
        <>
          <ChampChoix label="Base" libelleAucun="Aucune" elements={bases} valeur={baseId} onChange={setBaseId} />
          <ChampDescription label="Description" valeur={description} onChange={setDescription} />
        </>
      )}
      {erreur && <Alert severity="warning">{erreur}</Alert>}
      <BoutonsFiche onAnnuler={onAnnuler} onArchiver={cocktail ? onArchiver : undefined} />
    </FeuilleModale>
  )
}
