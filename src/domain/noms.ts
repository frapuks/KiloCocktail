export function normaliserNom(nom: string): string {
  return nom.trim().replace(/\s+/g, ' ').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
}

export function trouverDoublon<T extends { id: string; nomNormalise: string; archive: boolean }>(
  elements: T[],
  nom: string,
  idExclu?: string,
): T | null {
  const cible = normaliserNom(nom);
  return elements.find((e) => e.id !== idExclu && e.nomNormalise === cible) ?? null;
}
