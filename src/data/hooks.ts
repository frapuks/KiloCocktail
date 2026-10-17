import { useEffect, useState } from 'react'
import type { Cocktail, Presta, TypeEvenement, Verre } from '../domain/types'
import type { EtatSauvegarde } from '../domain/sauvegarde'
import { useDepots } from './DepotsContext'

// undefined = chargement (aucun retour reçu pour l'instant).

export function useCocktails(): Cocktail[] | undefined {
  const depots = useDepots()
  const [valeur, setValeur] = useState<Cocktail[]>()
  useEffect(() => depots.cocktails.ecouter(setValeur), [depots])
  return valeur
}

export function useTypes(): TypeEvenement[] | undefined {
  const depots = useDepots()
  const [valeur, setValeur] = useState<TypeEvenement[]>()
  useEffect(() => depots.types.ecouter(setValeur), [depots])
  return valeur
}

export function usePrestas(): Presta[] | undefined {
  const depots = useDepots()
  const [valeur, setValeur] = useState<Presta[]>()
  useEffect(() => depots.prestas.ecouterListe(setValeur), [depots])
  return valeur
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

export function useVerres(prestaId: string): { verres: Verre[]; etat: EtatSauvegarde } | undefined {
  const depots = useDepots()
  const [valeur, setValeur] = useState<{ verres: Verre[]; etat: EtatSauvegarde }>()
  useEffect(() => {
    setValeur(undefined)
    return depots.verres.ecouter(prestaId, (verres, etat) => setValeur({ verres, etat }))
  }, [depots, prestaId])
  return valeur
}
