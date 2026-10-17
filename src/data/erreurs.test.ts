import { describe, expect, it, vi } from 'vitest';
import { suivreEcriture, surErreurEcriture } from './erreurs';

describe('erreurs d’écriture', () => {
  it('notifie quand une écriture suivie est rejetée', async () => {
    const abonne = vi.fn();
    const desabonner = surErreurEcriture(abonne);
    suivreEcriture(Promise.reject(new Error('refusée')));
    await new Promise((r) => setTimeout(r, 0));
    expect(abonne).toHaveBeenCalledTimes(1);
    desabonner();
  });

  it('ne notifie pas une écriture réussie', async () => {
    const abonne = vi.fn();
    const desabonner = surErreurEcriture(abonne);
    suivreEcriture(Promise.resolve());
    await new Promise((r) => setTimeout(r, 0));
    expect(abonne).not.toHaveBeenCalled();
    desabonner();
  });
});
