import type { Cocktail } from './types';

export function nomLigne(c: Cocktail): { nom: string; sousTitre: 'sans alcool' | null } {
  return { nom: c.nom, sousTitre: c.alcool ? null : 'sans alcool' };
}

export function comparerCocktails(a: Cocktail, b: Cocktail): number {
  return a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' });
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
