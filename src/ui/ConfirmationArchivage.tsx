import { Confirmation } from './Confirmation'

interface Props {
  nom: string
  // Par défaut, celui des cocktails et des types d'événement.
  message?: string
  onArchiver(): void
  onFermer(): void
}

// Confirmation d'archivage, commune aux cocktails, aux types d'événement et aux bases.
export function ConfirmationArchivage({
  nom,
  message = 'Il ne sera plus proposé pour les prestas. Celles qui l’ont déjà le gardent, et tu pourras le désarchiver.',
  onArchiver,
  onFermer,
}: Props) {
  return (
    <Confirmation
      titre={`Archiver « ${nom} » ?`}
      message={message}
      onFermer={onFermer}
      actions={[
        { libelle: 'Archiver', principale: true, onClick: onArchiver },
        { libelle: 'Annuler', onClick: onFermer },
      ]}
    />
  )
}
