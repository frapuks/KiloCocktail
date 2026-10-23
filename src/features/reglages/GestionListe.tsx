import { useState } from 'react'
import ArchiveIcon from '@mui/icons-material/Archive'
import EditIcon from '@mui/icons-material/Edit'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Typography from '@mui/material/Typography'
import { comparerNoms } from '../../domain/affichage'
import { messageDoublon, trouverDoublon } from '../../domain/noms'
import { ChampNom } from '../../ui/ChampNom'
import { ConfirmationArchivage } from '../../ui/ConfirmationArchivage'
import { BoutonAnnulerFeuille, FeuilleModale } from '../../ui/FeuilleModale'
import { SectionArchives } from '../../ui/SectionArchives'

export interface ElementListe { id: string; nom: string; archive: boolean }

export interface DepotListe {
  creer(nom: string): string
  renommer(id: string, nom: string): void
  archiver(id: string, archive: boolean): void
  supprimer(id: string): Promise<void>
}

// Libellés d'une liste (types d'événement, bases), accordés en genre.
export interface TextesListe {
  titre: string
  ajouter: string
  nomNouveau: string
  nomVide: string
  article: 'Un type' | 'Une base'
  aucunActif: string
  // Confirmations d'archivage et de désarchivage ; absentes : textes par défaut (masculin, prestas).
  archivage?: string
  desarchivage?: string
}

interface Props<T extends ElementListe> {
  elements: T[]
  depot: DepotListe
  textes: TextesListe
  // Message de confirmation de suppression : doit dire ce que la suppression emporte.
  messageSuppression(e: T): string
  onFermer(): void
}

// Message d'erreur pour un nom (déjà nettoyé), ou null s'il est accepté.
function erreurNom(elements: ElementListe[], textes: TextesListe, nom: string, idExclu?: string): string | null {
  if (!nom) return textes.nomVide
  const doublon = trouverDoublon(elements, nom, idExclu)
  return doublon ? messageDoublon(textes.article, doublon) : null
}

// Renommage (actif ou archivé) : null si accepté et enregistré, sinon le message d'erreur.
function renommer(depot: DepotListe, elements: ElementListe[], textes: TextesListe, e: ElementListe, nom: string) {
  if (nom === e.nom) return null
  const erreur = erreurNom(elements, textes, nom, e.id)
  if (erreur) return erreur
  depot.renommer(e.id, nom)
  return null
}

// Un élément actif : son nom, puis « Modifier » (le nom devient un champ) et « Archiver » (avec confirmation).
function LigneElement({ element, elements, depot, textes }: { element: ElementListe; elements: ElementListe[]; depot: DepotListe; textes: TextesListe }) {
  const [edition, setEdition] = useState(false)
  const [confirmation, setConfirmation] = useState(false)

  return (
    <ListItem divider disableGutters sx={{ gap: 1, minHeight: 56 }}>
      {edition ? (
        <ChampNom
          libelle={`Nouveau nom pour ${element.nom}`}
          valeurInitiale={element.nom}
          onAnnuler={() => setEdition(false)}
          onValider={(nom) => {
            const erreur = renommer(depot, elements, textes, element, nom)
            if (!erreur) setEdition(false)
            return erreur
          }}
        />
      ) : (
        <>
          {/* Une seule ligne : « … » si le nom ne rentre pas, les icônes restent visibles. */}
          <Typography noWrap sx={{ flex: 1, minWidth: 0, fontWeight: 600 }}>
            {element.nom}
          </Typography>
          <IconButton aria-label={`Modifier ${element.nom}`} onClick={() => setEdition(true)}>
            <EditIcon />
          </IconButton>
          <IconButton aria-label={`Archiver ${element.nom}`} color="error" onClick={() => setConfirmation(true)}>
            <ArchiveIcon />
          </IconButton>
        </>
      )}
      {confirmation && (
        <ConfirmationArchivage
          nom={element.nom}
          message={textes.archivage}
          onFermer={() => setConfirmation(false)}
          onArchiver={() => {
            depot.archiver(element.id, true)
            setConfirmation(false)
          }}
        />
      )}
    </ListItem>
  )
}

// Modale de gestion d'une liste de noms (types d'événement, bases) : ajouter (en haut), renommer, archiver,
// désarchiver, supprimer. Chaque action est enregistrée tout de suite ; « Annuler » ou un tap à côté ne font
// que refermer.
export function GestionListe<T extends ElementListe>({ elements, depot, textes, messageSuppression, onFermer }: Props<T>) {
  const [ajout, setAjout] = useState(false)
  const actifs = elements.filter((e) => !e.archive).sort(comparerNoms)
  const archives = elements.filter((e) => e.archive).sort(comparerNoms)

  return (
    <FeuilleModale libelle={textes.titre} onFermer={onFermer}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Typography variant="h2">{textes.titre}</Typography>
        {!ajout && (
          <Button variant="contained" onClick={() => setAjout(true)}>
            {textes.ajouter}
          </Button>
        )}
      </Box>
      {ajout && (
        <Box sx={{ pl: 2 }}>
          <ChampNom
            libelle={textes.nomNouveau}
            valeurInitiale=""
            onAnnuler={() => setAjout(false)}
            onValider={(nom) => {
              const erreur = erreurNom(elements, textes, nom)
              if (erreur) return erreur
              depot.creer(nom)
              setAjout(false)
              return null
            }}
          />
        </Box>
      )}
      {/* Légèrement en retrait sous le titre, comme la saisie d'un nouvel élément au-dessus. */}
      {actifs.length > 0 ? (
        <List disablePadding sx={{ pl: 2 }}>
          {actifs.map((e) => (
            <LigneElement key={e.id} element={e} elements={elements} depot={depot} textes={textes} />
          ))}
        </List>
      ) : (
        <Typography color="text.secondary" sx={{ pl: 2 }}>
          {textes.aucunActif}
        </Typography>
      )}
      <SectionArchives
        elements={archives}
        libelle={(e) => e.nom}
        onDesarchiver={(e) => depot.archiver(e.id, false)}
        onRenommer={(e, nom) => renommer(depot, elements, textes, e, nom)}
        suppression={{
          message: messageSuppression,
          onSupprimer: (e) => depot.supprimer(e.id),
        }}
        niveau="h3"
        messageDesarchivage={textes.desarchivage}
      />
      <BoutonAnnulerFeuille sx={{ alignSelf: 'flex-start' }} />
    </FeuilleModale>
  )
}
