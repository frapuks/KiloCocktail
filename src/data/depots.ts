import type { Cocktail, Ligne, Presta, StatutPresta, TypeEvenement, Verre } from '../domain/types';

export type Desabonner = () => void;
export interface DonneesCocktail { nom: string; alcool: boolean }
export interface DonneesPresta { date: string; client: string | null; typeId: string | null; lignes: Ligne[] }
export interface DepotCocktails {
  ecouter(cb: (cocktails: Cocktail[]) => void): Desabonner;  // tous, archivés compris
  creer(d: DonneesCocktail): string;                        // id créé ; écriture en arrière-plan
  modifier(id: string, d: DonneesCocktail): void;
  archiver(id: string, archive: boolean): void;
  // Ce que la suppression emporterait : prestas qui l'ont à leur carte, verres comptés pour lui.
  impactSuppression(id: string): Promise<{ prestas: number; verres: number }>;
  // Supprime le cocktail, le retire de la carte des prestas et efface les verres comptés pour lui.
  supprimer(id: string): Promise<void>;
}
export interface DepotTypes {
  ecouter(cb: (types: TypeEvenement[]) => void): Desabonner;
  creer(nom: string): string;
  renommer(id: string, nom: string): void;
  archiver(id: string, archive: boolean): void;
  // Supprime le type ; les prestas qui l'avaient n'ont plus de type (typeId à null).
  supprimer(id: string): Promise<void>;
  initialiserSiVide(): Promise<void>;
}
export interface DepotPrestas {
  ecouterListe(cb: (prestas: Presta[]) => void): Desabonner;
  ecouter(id: string, cb: (presta: Presta | null) => void): Desabonner;
  creer(d: DonneesPresta): string;                          // statut 'en-cours'
  modifier(id: string, d: DonneesPresta, lignesAPurger: string[]): Promise<void>;
  changerStatut(id: string, statut: StatutPresta): void;
  supprimer(id: string): Promise<void>;
  compterServis(id: string): Promise<number | null>;        // dernier total connu, ou null, si le serveur est injoignable
  dernierTotalServis(id: string): number | null;            // total en cache local, sans attendre le serveur
}
export interface DepotVerres {
  ecouter(prestaId: string, cb: (verres: Verre[]) => void): Desabonner;
  servir(prestaId: string, ligneId: string): string;          // id du verre créé ; écriture en arrière-plan
  // Rejette si le serveur refuse le retrait (le bandeau d'erreur est déjà affiché) ; reste en attente hors connexion.
  retirer(prestaId: string, verreId: string): Promise<void>;
}
export interface Depots { cocktails: DepotCocktails; types: DepotTypes; prestas: DepotPrestas; verres: DepotVerres }
