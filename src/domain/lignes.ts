import type { Cocktail, Ligne, Variante } from './types';
import { comparerCocktails } from './affichage';

export function varianteDe(c: Cocktail): Variante {
  return c.alcool ? 'avec' : 'sans';
}

export function groupes(
  lignes: Ligne[],
  cocktails: Cocktail[],
  options: { masquees?: boolean } = {},
): { avec: Ligne[]; sans: Ligne[] } {
  const masquees = options.masquees ?? false;
  const parId = new Map(cocktails.map((c) => [c.id, c]));
  const retenues = lignes.filter((l) => l.masquee === masquees);
  const dans = (v: Variante) =>
    retenues.filter((l) => {
      const c = parId.get(l.cocktailId);
      return c !== undefined && varianteDe(c) === v;
    });
  return { avec: dans('avec'), sans: dans('sans') };
}

export function basculerCocktail(lignes: Ligne[], c: Cocktail, genId: () => string): Ligne[] {
  if (lignes.some((l) => l.cocktailId === c.id)) {
    return lignes.filter((l) => l.cocktailId !== c.id);
  }
  return [...lignes, { id: genId(), cocktailId: c.id, masquee: false }];
}

function arrayMove<T>(tableau: T[], de: number, vers: number): T[] {
  const copie = [...tableau];
  const [element] = copie.splice(de, 1);
  copie.splice(vers, 0, element);
  return copie;
}

export function deplacerDansGroupe(
  lignes: Ligne[],
  cocktails: Cocktail[],
  variante: Variante,
  de: number,
  vers: number,
): Ligne[] {
  const parId = new Map(cocktails.map((c) => [c.id, c]));
  const indices: number[] = [];
  lignes.forEach((l, i) => {
    const c = parId.get(l.cocktailId);
    if (c && varianteDe(c) === variante && !l.masquee) indices.push(i);
  });
  const reordonnees = arrayMove(indices.map((i) => lignes[i]), de, vers);
  const resultat = [...lignes];
  indices.forEach((indice, k) => {
    resultat[indice] = reordonnees[k];
  });
  return resultat;
}

export function masquer(lignes: Ligne[], ligneId: string): Ligne[] {
  return lignes.map((l) => (l.id === ligneId ? { ...l, masquee: true } : l));
}

export function reafficher(lignes: Ligne[], ligneId: string): Ligne[] {
  const cible = lignes.find((l) => l.id === ligneId);
  if (!cible) return lignes;
  return [...lignes.filter((l) => l.id !== ligneId), { ...cible, masquee: false }];
}

export function retirer(lignes: Ligne[], ligneId: string): Ligne[] {
  return lignes.filter((l) => l.id !== ligneId);
}

export function typeRetrait(total: number): 'direct' | 'choix' {
  return total === 0 ? 'direct' : 'choix';
}

export function optionsAbsentes(cocktails: Cocktail[], lignes: Ligne[]): Cocktail[] {
  return cocktails
    .filter((c) => !c.archive && !lignes.some((l) => l.cocktailId === c.id))
    .sort(comparerCocktails);
}
