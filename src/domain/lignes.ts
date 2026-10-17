import type { Cocktail, Ligne, Variante } from './types';

export function variantesDisponibles(c: Cocktail): Variante[] {
  if (c.variantes === 'les-deux') return ['avec', 'sans'];
  return [c.variantes];
}

export function groupes(
  lignes: Ligne[],
  options: { masquees?: boolean } = {},
): { avec: Ligne[]; sans: Ligne[] } {
  const masquees = options.masquees ?? false;
  const retenues = lignes.filter((l) => l.masquee === masquees);
  return {
    avec: retenues.filter((l) => l.variante === 'avec'),
    sans: retenues.filter((l) => l.variante === 'sans'),
  };
}

export function basculerCocktail(
  lignes: Ligne[],
  c: Cocktail,
  genId: () => string,
  variantes: Variante[] = variantesDisponibles(c),
): Ligne[] {
  if (lignes.some((l) => l.cocktailId === c.id)) {
    return lignes.filter((l) => l.cocktailId !== c.id);
  }
  const ajouts = variantes.map<Ligne>((variante) => ({
    id: genId(),
    cocktailId: c.id,
    variante,
    masquee: false,
  }));
  return [...lignes, ...ajouts];
}

export function basculerVariante(
  lignes: Ligne[],
  cocktailId: string,
  variante: Variante,
  genId: () => string,
): Ligne[] {
  const existe = lignes.some((l) => l.cocktailId === cocktailId && l.variante === variante);
  if (existe) return lignes.filter((l) => !(l.cocktailId === cocktailId && l.variante === variante));
  return [...lignes, { id: genId(), cocktailId, variante, masquee: false }];
}

function arrayMove<T>(tableau: T[], de: number, vers: number): T[] {
  const copie = [...tableau];
  const [element] = copie.splice(de, 1);
  copie.splice(vers, 0, element);
  return copie;
}

export function deplacerDansGroupe(
  lignes: Ligne[],
  variante: Variante,
  de: number,
  vers: number,
): Ligne[] {
  const indices: number[] = [];
  lignes.forEach((l, i) => {
    if (l.variante === variante && !l.masquee) indices.push(i);
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

export function optionsAbsentes(
  cocktails: Cocktail[],
  lignes: Ligne[],
): { cocktail: Cocktail; variantes: Variante[] }[] {
  return cocktails
    .filter((c) => !c.archive)
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
    .map((cocktail) => ({
      cocktail,
      variantes: variantesDisponibles(cocktail).filter(
        (v) => !lignes.some((l) => l.cocktailId === cocktail.id && l.variante === v),
      ),
    }))
    .filter((o) => o.variantes.length > 0);
}
