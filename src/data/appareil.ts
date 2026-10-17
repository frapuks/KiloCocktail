const CLE = 'kilococktail.appareil';
let enMemoire: string | null = null;

function nouvelIdentifiant(): string {
  return `appareil-${crypto.randomUUID()}`;
}

export function identifiantAppareil(): string {
  const stockage = (globalThis as { localStorage?: Storage }).localStorage;
  if (!stockage) {
    enMemoire ??= nouvelIdentifiant();
    return enMemoire;
  }
  try {
    const existant = stockage.getItem(CLE);
    if (existant) return existant;
    const cree = nouvelIdentifiant();
    stockage.setItem(CLE, cree);
    return cree;
  } catch {
    enMemoire ??= nouvelIdentifiant();
    return enMemoire;
  }
}
