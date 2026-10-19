export type Variante = 'avec' | 'sans';
export type StatutPresta = 'en-cours' | 'terminee';
export interface Cocktail { id: string; nom: string; nomNormalise: string; alcool: boolean; archive: boolean }
export interface TypeEvenement { id: string; nom: string; nomNormalise: string; archive: boolean }
export interface Ligne { id: string; cocktailId: string; masquee: boolean }
export interface Presta { id: string; date: string; client: string | null; typeId: string | null; statut: StatutPresta; lignes: Ligne[] }
export interface Verre { id: string; ligneId: string; creeLe: number; enAttente: boolean }
