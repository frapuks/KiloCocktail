import type { Cocktail, Ligne } from './types';

export function nomLigne(ligne: Ligne, cocktail: Cocktail): { nom: string; sousTitre: 'sans alcool' | null } {
  if (ligne.variante === 'avec') return { nom: cocktail.nom, sousTitre: null };
  return { nom: cocktail.nomSansAlcool ?? cocktail.nom, sousTitre: 'sans alcool' };
}

function decouper(date: string): [number, number, number] {
  const [a, m, j] = date.split('-').map(Number);
  return [a, m, j];
}

export function formatDate(date: string): string {
  const [a, m, j] = decouper(date);
  return `${String(j).padStart(2, '0')}/${String(m).padStart(2, '0')}/${a}`;
}

export function formatDateLongue(date: string): string {
  const [a, m, j] = decouper(date);
  const jour = new Date(a, m - 1, j).toLocaleDateString('fr-FR', { weekday: 'long' });
  return `${jour} ${formatDate(date)}`;
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
