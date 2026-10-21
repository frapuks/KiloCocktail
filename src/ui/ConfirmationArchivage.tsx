import { Confirmation } from './Confirmation'

interface Props {
  nom: string
  onArchiver(): void
  onFermer(): void
}

// Confirmation d'archivage, commune aux cocktails et aux types d'événement.
export function ConfirmationArchivage({ nom, onArchiver, onFermer }: Props) {
  return (
    <Confirmation
      titre={`Archiver « ${nom} » ?`}
      message="Il ne sera plus proposé pour les prestas. Celles qui l’ont déjà le gardent, et tu pourras le désarchiver."
      onFermer={onFermer}
      actions={[
        { libelle: 'Archiver', principale: true, onClick: onArchiver },
        { libelle: 'Annuler', onClick: onFermer },
      ]}
    />
  )
}
