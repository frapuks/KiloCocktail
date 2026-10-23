import { useDepots } from '../../data/DepotsContext'
import { useCocktails } from '../../data/hooks'
import type { Base } from '../../domain/types'
import { GestionListe, type TextesListe } from './GestionListe'

// Confirmation de suppression : dit combien de cocktails perdent leur base (archivés compris) ;
// null tant que les cocktails ne sont pas chargés.
export function messageSuppressionBase(nbCocktails: number | null): string {
  const impact =
    nbCocktails === null
      ? 'Les cocktails qui l’utilisent n’auront plus de base.'
      : nbCocktails === 0
      ? 'Aucun cocktail ne l’utilise.'
      : nbCocktails === 1
        ? '1 cocktail l’utilise : il n’aura plus de base.'
        : `${nbCocktails} cocktails l’utilisent : ils n’auront plus de base.`
  return `La base sera supprimée de l’appli. ${impact} C’est définitif.`
}

const TEXTES: TextesListe = {
  titre: 'Bases',
  ajouter: '+ Ajouter une base',
  nomNouveau: 'Nom de la nouvelle base',
  nomVide: 'Donne un nom à la base',
  article: 'Une base',
  aucunActif: 'Aucune base active.',
  archivage: 'Elle ne sera plus proposée pour les cocktails. Ceux qui l’ont déjà la gardent, et tu pourras la désarchiver.',
  desarchivage: 'Elle sera de nouveau proposée.',
}

export function GestionBases({ bases, onFermer }: { bases: Base[]; onFermer(): void }) {
  const depots = useDepots()
  const cocktails = useCocktails()
  return (
    <GestionListe
      elements={bases}
      depot={depots.bases}
      textes={TEXTES}
      messageSuppression={(b) => messageSuppressionBase(cocktails ? cocktails.filter((c) => c.baseId === b.id).length : null)}
      onFermer={onFermer}
    />
  )
}
