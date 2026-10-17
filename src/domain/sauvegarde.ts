export type EtatSauvegarde = { ecrituresEnAttente: boolean; verresEnAttente: number };

export const DELAI_ATTENTE_MS = 2000;

export function libelleSauvegarde(e: EtatSauvegarde): string {
  if (!e.ecrituresEnAttente) return 'Sauvegardé';
  return e.verresEnAttente > 0
    ? `Hors connexion · ${e.verresEnAttente} en attente`
    : 'Hors connexion · modifications en attente';
}
