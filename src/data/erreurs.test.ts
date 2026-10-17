import { afterEach, describe, expect, it, vi } from 'vitest';
import { signalerErreurEcriture, suivreEcriture, surErreurEcriture } from './erreurs';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('erreurs d’écriture', () => {
  it('notifie quand une écriture suivie est rejetée, et journalise la raison', async () => {
    const journal = vi.spyOn(console, 'error').mockImplementation(() => {});
    const abonne = vi.fn();
    const desabonner = surErreurEcriture(abonne);
    const raison = new Error('refusée');
    suivreEcriture(Promise.reject(raison));
    await new Promise((r) => setTimeout(r, 0));
    expect(abonne).toHaveBeenCalledTimes(1);
    expect(journal).toHaveBeenCalledWith(expect.anything(), raison);
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

  it('signale directement une erreur aux mêmes abonnés', () => {
    const abonne = vi.fn();
    const desabonner = surErreurEcriture(abonne);
    signalerErreurEcriture();
    expect(abonne).toHaveBeenCalledTimes(1);
    desabonner();
  });
});
