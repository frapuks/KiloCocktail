import { useEffect, useState } from 'react'
import type { Base, Cocktail, Presta, TypeEvenement, Verre } from '../domain/types'
import type { Depots, Desabonner } from './depots'
import { useDepots } from './DepotsContext'

// undefined = chargement (aucun retour reçu pour l'instant).

// Dernière liste reçue, gardée pour la session : un écran qui revient l'affiche tout de suite,
// sans attendre le premier retour de l'écoute, qui la remet ensuite à jour.
const memoire = new WeakMap<Depots, Map<string, unknown>>()

function useListeMemorisee<T>(cle: string, ecouter: (depots: Depots, cb: (v: T) => void) => Desabonner): T | undefined {
  const depots = useDepots()
  const [valeur, setValeur] = useState(() => memoire.get(depots)?.get(cle) as T | undefined)
  useEffect(() => {
    let connues = memoire.get(depots)
    if (!connues) memoire.set(depots, (connues = new Map()))
    setValeur(connues.get(cle) as T | undefined)
    return ecouter(depots, (v) => {
      connues.set(cle, v)
      setValeur(v)
    })
    // ecouter est une fonction littérale, la même pour une clé donnée : la clé suffit.
  }, [depots, cle])
  return valeur
}

export function useCocktails(): Cocktail[] | undefined {
  return useListeMemorisee('cocktails', (d, cb) => d.cocktails.ecouter(cb))
}

export function useTypes(): TypeEvenement[] | undefined {
  return useListeMemorisee('types', (d, cb) => d.types.ecouter(cb))
}

export function useBases(): Base[] | undefined {
  return useListeMemorisee('bases', (d, cb) => d.bases.ecouter(cb))
}

export function usePrestas(): Presta[] | undefined {
  return useListeMemorisee('prestas', (d, cb) => d.prestas.ecouterListe(cb))
}

export function usePresta(id: string): Presta | null | undefined {
  const depots = useDepots()
  const [valeur, setValeur] = useState<Presta | null>()
  useEffect(() => {
    setValeur(undefined)
    return depots.prestas.ecouter(id, setValeur)
  }, [depots, id])
  return valeur
}

export function useVerres(prestaId: string): { verres: Verre[] } | undefined {
  const depots = useDepots()
  const [valeur, setValeur] = useState<{ verres: Verre[] }>()
  useEffect(() => {
    setValeur(undefined)
    return depots.verres.ecouter(prestaId, (verres) => setValeur({ verres }))
  }, [depots, prestaId])
  return valeur
}
