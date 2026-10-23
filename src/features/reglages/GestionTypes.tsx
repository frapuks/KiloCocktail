import { useDepots } from '../../data/DepotsContext'
import { usePrestas } from '../../data/hooks'
import type { TypeEvenement } from '../../domain/types'
import { GestionListe, type TextesListe } from './GestionListe'

// Confirmation de suppression : dit combien de prestas perdent leur type (prestas terminées comprises) ;
// null tant que les prestas ne sont pas chargées.
export function messageSuppression(nbPrestas: number | null): string {
  const impact =
    nbPrestas === null
      ? 'Les prestas qui l’utilisent n’auront plus de type.'
      : nbPrestas === 0
      ? 'Aucune presta ne l’utilise.'
      : nbPrestas === 1
        ? '1 presta l’utilise : elle n’aura plus de type.'
        : `${nbPrestas} prestas l’utilisent : elles n’auront plus de type.`
  return `Le type sera supprimé de l’appli. ${impact} C’est définitif.`
}

const TEXTES: TextesListe = {
  titre: "Types d'événement",
  ajouter: '+ Ajouter un type',
  nomNouveau: 'Nom du nouveau type',
  nomVide: 'Donne un nom au type',
  article: 'Un type',
  aucunActif: 'Aucun type actif.',
}

export function GestionTypes({ types, onFermer }: { types: TypeEvenement[]; onFermer(): void }) {
  const depots = useDepots()
  const prestas = usePrestas()
  return (
    <GestionListe
      elements={types}
      depot={depots.types}
      textes={TEXTES}
      messageSuppression={(t) => messageSuppression(prestas ? prestas.filter((p) => p.typeId === t.id).length : null)}
      onFermer={onFermer}
    />
  )
}
