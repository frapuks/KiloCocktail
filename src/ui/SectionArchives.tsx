import { useState, type ReactNode } from 'react'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import UnarchiveIcon from '@mui/icons-material/Unarchive'
import Box from '@mui/material/Box'
import Collapse from '@mui/material/Collapse'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import { ChampNom } from './ChampNom'
import { Confirmation } from './Confirmation'
import { TitreSection } from './TitreSection'

interface Props<T extends { id: string }> {
  elements: T[]
  libelle(e: T): string
  onDesarchiver(e: T): void
  // Icône « Modifier », au choix : renommage sur place (renvoie un message d'erreur, ou null si enregistré),
  // ou ouverture d'une fiche par l'écran.
  onRenommer?(e: T, nom: string): string | null
  onModifier?(e: T): void
  // Présent : icône « Supprimer » sur chaque ligne, avec ce message dans la confirmation
  // (il doit dire ce que la suppression emporte, elle est définitive).
  suppression?: { message(e: T): ReactNode; onSupprimer(e: T): void }
  // Niveau du titre : h2 dans un écran (cocktails), h3 dans une feuille (types d'événement).
  niveau?: 'h2' | 'h3'
}

// Section « Archivés », commune aux cocktails et aux types d'événement : un titre,
// et un interrupteur à côté pour afficher la liste, masquée par défaut.
// Chaque ligne : Désarchiver (et Supprimer si prévu), en icônes, toujours après confirmation.
export function SectionArchives<T extends { id: string }>({
  elements,
  libelle,
  onDesarchiver,
  onRenommer,
  onModifier,
  suppression,
  niveau = 'h2',
}: Props<T>) {
  const [affiches, setAffiches] = useState(false)
  // Élément dont le nom est en cours de modification.
  const [enEdition, setEnEdition] = useState<string | null>(null)
  // Action qui attend confirmation.
  const [aConfirmer, setAConfirmer] = useState<{ action: 'desarchiver' | 'supprimer'; element: T } | null>(null)
  if (elements.length === 0) return null

  const fermer = () => setAConfirmer(null)

  function rendreConfirmation() {
    if (!aConfirmer) return null
    const { action, element } = aConfirmer
    const nom = libelle(element)
    if (action === 'desarchiver') {
      return (
        <Confirmation
          titre={`Désarchiver « ${nom} » ?`}
          message="Il sera de nouveau proposé."
          onFermer={fermer}
          actions={[
            {
              libelle: 'Désarchiver',
              principale: true,
              onClick: () => {
                onDesarchiver(element)
                fermer()
              },
            },
            { libelle: 'Annuler', onClick: fermer },
          ]}
        />
      )
    }
    return (
      <Confirmation
        titre={`Supprimer « ${nom} » ?`}
        message={suppression!.message(element)}
        onFermer={fermer}
        actions={[
          {
            libelle: 'Supprimer définitivement',
            danger: true,
            onClick: () => {
              suppression!.onSupprimer(element)
              fermer()
            },
          },
          { libelle: 'Annuler', onClick: fermer },
        ]}
      />
    )
  }

  return (
    <Box component="section" aria-labelledby="titre-archives">
      {/* Trait gris : les archivés sont en retrait. */}
      <TitreSection
        titre="Archivés"
        id="titre-archives"
        niveau={niveau}
        couleur="divider"
        action={
          <Switch
            checked={affiches}
            onChange={(_, v) => setAffiches(v)}
            slotProps={{ input: { 'aria-label': 'Afficher les archivés' } }}
          />
        }
      />
      <Collapse in={affiches} unmountOnExit>
        {/* Légèrement en retrait sous le titre. */}
        <List disablePadding sx={{ pl: 2 }}>
          {elements.map((e) => (
            <ListItem key={e.id} divider disableGutters sx={{ minHeight: 56, gap: 1 }}>
              {onRenommer && enEdition === e.id ? (
                <ChampNom
                  libelle={`Nouveau nom pour ${libelle(e)}`}
                  valeurInitiale={libelle(e)}
                  onAnnuler={() => setEnEdition(null)}
                  onValider={(nom) => {
                    const erreur = onRenommer(e, nom)
                    if (!erreur) setEnEdition(null)
                    return erreur
                  }}
                />
              ) : (
                <>
                  <Typography color="text.secondary" noWrap sx={{ flex: 1, minWidth: 0 }}>
                    {libelle(e)}
                  </Typography>
                  {(onRenommer || onModifier) && (
                    <IconButton
                      aria-label={`Modifier ${libelle(e)}`}
                      onClick={() => (onModifier ? onModifier(e) : setEnEdition(e.id))}
                    >
                      <EditIcon />
                    </IconButton>
                  )}
                  <IconButton
                    aria-label={`Désarchiver ${libelle(e)}`}
                    onClick={() => setAConfirmer({ action: 'desarchiver', element: e })}
                  >
                    <UnarchiveIcon />
                  </IconButton>
                  {suppression && (
                    <IconButton
                      aria-label={`Supprimer ${libelle(e)}`}
                      color="error"
                      onClick={() => setAConfirmer({ action: 'supprimer', element: e })}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </>
              )}
            </ListItem>
          ))}
        </List>
      </Collapse>
      {rendreConfirmation()}
    </Box>
  )
}
