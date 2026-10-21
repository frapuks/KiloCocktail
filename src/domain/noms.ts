// Forme de comparaison d'un nom : espaces réduits, minuscules, sans accents, et apostrophes unifiées
// (le clavier de l'iPad tape « ’ », un autre appareil « ' » : « Soirée d’entreprise » = « Soirée d'entreprise »).
export function normaliserNom(nom: string): string {
  return nom
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[’‘ʼ`´]/g, "'")
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

// Compare au nom affiché, renormalisé : les noms enregistrés avant une évolution de normaliserNom
// (ex. apostrophes) restent détectés comme doublons.
export function trouverDoublon<T extends { id: string; nom: string; archive: boolean }>(
  elements: T[],
  nom: string,
  idExclu?: string,
): T | null {
  const cible = normaliserNom(nom);
  return elements.find((e) => e.id !== idExclu && normaliserNom(e.nom) === cible) ?? null;
}

export function messageDoublon(article: 'Un cocktail' | 'Un type', doublon: { nom: string; archive: boolean }): string {
  return doublon.archive
    ? `${article} “${doublon.nom}” existe déjà dans les archivés. Désarchive-le plutôt.`
    : `${article} “${doublon.nom}” existe déjà`;
}
