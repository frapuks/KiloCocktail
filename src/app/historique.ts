import type { Location } from 'react-router-dom'

// Marque une navigation faite depuis l'appli (bouton, lien) vers une feuille.
// À la fermeture, la feuille ne revient en arrière (navigate(-1)) que si elle porte cette marque :
// ouverte par un lien direct, un rechargement ou une redirection (<Navigate replace>), l'entrée précédente
// de l'historique n'est pas l'écran du dessous, et la feuille va directement à son écran parent.
export const DEPUIS_APP = { depuisApp: true } as const

export function ouverteDepuisApp(location: Location): boolean {
  return (location.state as { depuisApp?: boolean } | null)?.depuisApp === true
}
