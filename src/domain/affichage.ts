import type { Cocktail } from './types';

export function nomLigne(c: Cocktail): { nom: string; sousTitre: 'sans alcool' | null } {
  return { nom: c.nom, sousTitre: c.alcool ? null : 'sans alcool' };
}

// Nom pour les lecteurs d'écran (libellés des boutons) : distingue les deux versions d'un même nom, que seule
// la pastille ou le groupe séparent à l'œil.
export function nomAccessible(c: Cocktail): string {
  const { nom, sousTitre } = nomLigne(c);
  return sousTitre ? `${nom} ${sousTitre}` : nom;
}

// Ordre alphabétique des listes (cocktails, types) : en français, sans tenir compte de la casse ni des accents.
export function comparerNoms(a: { nom: string }, b: { nom: string }): number {
  return a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' });
}

// Ordre des listes de cocktails : alphabétique ; à nom égal, la version avec alcool d'abord.
export function comparerCocktails(a: { nom: string; alcool: boolean }, b: { nom: string; alcool: boolean }): number {
  return comparerNoms(a, b) || Number(b.alcool) - Number(a.alcool);
}

function decouper(date: string): [number, number, number] {
  const [a, m, j] = date.split('-').map(Number);
  return [a, m, j];
}

// Format unique des dates dans l'appli : JJ/MM/AAAA, sans le jour de la semaine.
export function formatDate(date: string): string {
  const [a, m, j] = decouper(date);
  return `${String(j).padStart(2, '0')}/${String(m).padStart(2, '0')}/${a}`;
}

export function nomPresta(p: { client: string | null; date: string }): string {
  const client = p.client?.trim();
  return client ? client : `Presta du ${formatDate(p.date)}`;
}

export function libelleServis(n: number): 'servi' | 'servis' {
  return n >= 2 ? 'servis' : 'servi';
}

export function dateDuJour(maintenant: Date = new Date()): string {
  const m = String(maintenant.getMonth() + 1).padStart(2, '0');
  const j = String(maintenant.getDate()).padStart(2, '0');
  return `${maintenant.getFullYear()}-${m}-${j}`;
}
