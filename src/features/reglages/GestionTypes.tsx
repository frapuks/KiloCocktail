import { useState } from 'react'
import ArchiveIcon from '@mui/icons-material/Archive'
import EditIcon from '@mui/icons-material/Edit'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Typography from '@mui/material/Typography'
import { useDepots } from '../../data/DepotsContext'
import { usePrestas } from '../../data/hooks'
import { comparerNoms } from '../../domain/affichage'
import { messageDoublon, trouverDoublon } from '../../domain/noms'
import type { TypeEvenement } from '../../domain/types'
import { ChampNom } from '../../ui/ChampNom'
import { ConfirmationArchivage } from '../../ui/ConfirmationArchivage'
import { BoutonAnnulerFeuille, FeuilleModale } from '../../ui/FeuilleModale'
import { SectionArchives } from '../../ui/SectionArchives'

// Message d'erreur pour un nom de type (déjà nettoyé), ou null s'il est accepté.
function erreurNomType(types: TypeEvenement[], nom: string, idExclu?: string): string | null {
  if (!nom) return 'Donne un nom au type'
  const doublon = trouverDoublon(types, nom, idExclu)
  return doublon ? messageDoublon('Un type', doublon) : null
}

// Confirmation de suppression : dit combien de prestas perdent leur type (prestas terminées comprises).
export function messageSuppression(nbPrestas: number): string {
  const impact =
    nbPrestas === 0
      ? 'Aucune presta ne l’utilise.'
      : nbPrestas === 1
        ? '1 presta l’utilise : elle n’aura plus de type.'
        : `${nbPrestas} prestas l’utilisent : elles n’auront plus de type.`
  return `Le type sera supprimé de l’appli. ${impact} C’est définitif.`
}


// Renommage d'un type (actif ou archivé) : null si accepté et enregistré, sinon le message d'erreur.
function renommerType(depots: ReturnType<typeof useDepots>, types: TypeEvenement[], type: TypeEvenement, nom: string) {
  if (nom === type.nom) return null
  const erreur = erreurNomType(types, nom, type.id)
  if (erreur) return erreur
  depots.types.renommer(type.id, nom)
  return null
}

// Un type actif : son nom, puis « Modifier » (le nom devient un champ) et « Archiver » (avec confirmation).
function LigneType({ type, types }: { type: TypeEvenement; types: TypeEvenement[] }) {
  const depots = useDepots()
  const [edition, setEdition] = useState(false)
  const [confirmation, setConfirmation] = useState(false)

  return (
    <ListItem divider disableGutters sx={{ gap: 1, minHeight: 56 }}>
      {edition ? (
        <ChampNom
          libelle={`Nouveau nom pour ${type.nom}`}
          valeurInitiale={type.nom}
          onAnnuler={() => setEdition(false)}
          onValider={(nom) => {
            const erreur = renommerType(depots, types, type, nom)
            if (!erreur) setEdition(false)
            return erreur
          }}
        />
      ) : (
        <>
          {/* Une seule ligne : « … » si le nom ne rentre pas, les icônes restent visibles. */}
          <Typography noWrap sx={{ flex: 1, minWidth: 0, fontWeight: 600 }}>
            {type.nom}
          </Typography>
          <IconButton aria-label={`Modifier ${type.nom}`} onClick={() => setEdition(true)}>
            <EditIcon />
          </IconButton>
          <IconButton aria-label={`Archiver ${type.nom}`} color="error" onClick={() => setConfirmation(true)}>
            <ArchiveIcon />
          </IconButton>
        </>
      )}
      {confirmation && (
        <ConfirmationArchivage
          nom={type.nom}
          onFermer={() => setConfirmation(false)}
          onArchiver={() => {
            depots.types.archiver(type.id, true)
            setConfirmation(false)
          }}
        />
      )}
    </ListItem>
  )
}

// Modale de gestion des types d'événement : ajouter (en haut), renommer, archiver, désarchiver.
// Chaque action est enregistrée tout de suite ; « Annuler » ou un tap à côté ne font que refermer.
export function GestionTypes({ types, onFermer }: { types: TypeEvenement[]; onFermer(): void }) {
  const depots = useDepots()
  const prestas = usePrestas()
  const [ajout, setAjout] = useState(false)
  const actifs = types.filter((t) => !t.archive).sort(comparerNoms)
  const archives = types.filter((t) => t.archive).sort(comparerNoms)

  return (
    <FeuilleModale libelle="Types d'événement" onFermer={onFermer}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Typography variant="h2">Types d'événement</Typography>
        {!ajout && (
          <Button variant="contained" onClick={() => setAjout(true)}>
            + Ajouter un type
          </Button>
        )}
      </Box>
      {ajout && (
        <Box sx={{ pl: 2 }}>
          <ChampNom
          libelle="Nom du nouveau type"
          valeurInitiale=""
          onAnnuler={() => setAjout(false)}
          onValider={(nom) => {
            const erreur = erreurNomType(types, nom)
            if (erreur) return erreur
            depots.types.creer(nom)
            setAjout(false)
            return null
          }}
          />
        </Box>
      )}
      {/* Légèrement en retrait sous le titre, comme la saisie d'un nouveau type au-dessus. */}
      {actifs.length > 0 ? (
        <List disablePadding sx={{ pl: 2 }}>
          {actifs.map((t) => (
            <LigneType key={t.id} type={t} types={types} />
          ))}
        </List>
      ) : (
        <Typography color="text.secondary" sx={{ pl: 2 }}>
          Aucun type actif.
        </Typography>
      )}
      <SectionArchives
        elements={archives}
        libelle={(t) => t.nom}
        onDesarchiver={(t) => depots.types.archiver(t.id, false)}
        onRenommer={(t, nom) => renommerType(depots, types, t, nom)}
        suppression={{
          message: (t) => messageSuppression((prestas ?? []).filter((p) => p.typeId === t.id).length),
          onSupprimer: (t) => depots.types.supprimer(t.id),
        }}
        niveau="h3"
      />
      <BoutonAnnulerFeuille sx={{ alignSelf: 'flex-start' }} />
    </FeuilleModale>
  )
}
