import type { TypeEvenement } from '../../domain/types'
import { ChampChoix } from '../../ui/ChampChoix'

interface Props {
  types: TypeEvenement[]
  valeur: string | null
  onChange(id: string | null): void
}

// Les types se créent et se renomment dans Réglages, pas ici.
export function ChampType({ types, valeur, onChange }: Props) {
  return <ChampChoix label="Type" libelleAucun="Aucun" elements={types} valeur={valeur} onChange={onChange} />
}
