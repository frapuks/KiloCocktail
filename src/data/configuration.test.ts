import { describe, expect, it } from 'vitest';
import { uidDonnees, verifierConfiguration } from './configuration';

describe('espace de données ouvert après connexion', () => {
  it('ouvre l’espace fixé par VITE_UID_DONNEES, quel que soit le compte connecté', () => {
    expect(uidDonnees('admin', 'barman')).toBe('barman');
    expect(uidDonnees('barman', ' barman ')).toBe('barman');
  });

  it('ouvre l’espace du compte connecté sans VITE_UID_DONNEES', () => {
    expect(uidDonnees('u1', undefined)).toBe('u1');
    expect(uidDonnees('u1', '')).toBe('u1');
  });
});

describe('vérification de la configuration Firebase', () => {
  it('refuse les émulateurs dans un build de production', () => {
    expect(() =>
      verifierConfiguration({ PROD: true, VITE_USE_EMULATORS: 'true', VITE_FIREBASE_PROJECT_ID: 'demo-kilococktail' }),
    ).toThrow('VITE_USE_EMULATORS ne doit pas être actif en production');
  });

  it('exige un projet Firebase hors émulateurs', () => {
    expect(() => verifierConfiguration({ PROD: true, VITE_FIREBASE_PROJECT_ID: '' })).toThrow(
      'Configuration Firebase manquante : renseigne .env.local (voir README)',
    );
    expect(() => verifierConfiguration({ PROD: false })).toThrow('Configuration Firebase manquante');
  });

  it('accepte les émulateurs en développement et un projet renseigné en production', () => {
    expect(verifierConfiguration({ PROD: false, VITE_USE_EMULATORS: 'true' })).toEqual({ utiliseEmulateurs: true });
    expect(verifierConfiguration({ PROD: true, VITE_FIREBASE_PROJECT_ID: 'kilococktail' })).toEqual({
      utiliseEmulateurs: false,
    });
  });
});
