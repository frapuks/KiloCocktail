// Limites Firestore : 500 opérations par lot d'écriture, 30 valeurs dans une requête « in ».
export const TAILLE_LOT = 500;
export const TAILLE_IN = 30;

export function decouper<T>(liste: T[], taille: number): T[][] {
  const lots: T[][] = [];
  for (let i = 0; i < liste.length; i += taille) lots.push(liste.slice(i, i + taille));
  return lots;
}
