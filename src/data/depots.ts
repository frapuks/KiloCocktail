import type { Cocktail, Ligne, Presta, StatutPresta, TypeEvenement, Variantes, Verre } from '../domain/types';
import type { EtatSauvegarde } from '../domain/sauvegarde';

export type Desabonner = () => void;
export interface DonneesCocktail { nom: string; variantes: Variantes; nomSansAlcool: string | null }
export interface DonneesPresta { date: string; client: string | null; typeId: string | null; lignes: Ligne[] }
export interface DepotCocktails {
  ecouter(cb: (cocktails: Cocktail[]) => void): Desabonner;  // tous, archivés compris
  creer(d: DonneesCocktail): string;                        // id créé ; écriture en arrière-plan
  modifier(id: string, d: DonneesCocktail): void;
  archiver(id: string, archive: boolean): void;
}
export interface DepotTypes {
  ecouter(cb: (types: TypeEvenement[]) => void): Desabonner;
  creer(nom: string): string;
  renommer(id: string, nom: string): void;
  archiver(id: string, archive: boolean): void;
  initialiserSiVide(): Promise<void>;
}
export interface DepotPrestas {
  ecouterListe(cb: (prestas: Presta[]) => void): Desabonner;
  ecouter(id: string, cb: (presta: Presta | null) => void): Desabonner;
  creer(d: DonneesPresta): string;                          // statut 'en-cours'
  modifier(id: string, d: DonneesPresta, lignesAPurger: string[]): Promise<void>;
  changerStatut(id: string, statut: StatutPresta): void;
  supprimer(id: string): Promise<void>;
  compterServis(id: string): Promise<number | null>;        // null si le serveur est injoignable
}
export interface DepotVerres {
  ecouter(prestaId: string, cb: (verres: Verre[], etat: EtatSauvegarde) => void): Desabonner;
  servir(prestaId: string, ligneId: string): string;          // id du verre créé ; écriture en arrière-plan
  retirer(prestaId: string, verreId: string): void;
}
export interface Depots { cocktails: DepotCocktails; types: DepotTypes; prestas: DepotPrestas; verres: DepotVerres }
