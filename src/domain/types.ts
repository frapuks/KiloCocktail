export type Variante = 'avec' | 'sans';
export type StatutPresta = 'en-cours' | 'terminee';
// description, baseId : absents quand le barman n'en a pas saisi.
export interface Cocktail { id: string; nom: string; nomNormalise: string; alcool: boolean; archive: boolean; description?: string; baseId?: string }
export interface TypeEvenement { id: string; nom: string; nomNormalise: string; archive: boolean }
// Base d'un cocktail (rhum, vodka…), pour filtrer la liste des cocktails.
export interface Base { id: string; nom: string; nomNormalise: string; archive: boolean }
export interface Ligne { id: string; cocktailId: string; masquee: boolean }
export interface Presta { id: string; date: string; client: string | null; typeId: string | null; statut: StatutPresta; lignes: Ligne[] }
export interface Verre { id: string; ligneId: string; creeLe: number }
