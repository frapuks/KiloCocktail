import { vi } from 'vitest'
import type { Depots } from '../data/depots'
import type { Cocktail, Presta, TypeEvenement, Verre } from '../domain/types'

interface Donnees {
  cocktails?: Cocktail[]
  types?: TypeEvenement[]
  prestas?: Presta[]
  verres?: Record<string, Verre[]>
}

export type DepotsFactices = Depots & {
  emettre: {
    verres(prestaId: string, v: Verre[]): void
    presta(p: Presta): void
  }
}

export function creerDepotsFactices(donnees: Donnees = {}): DepotsFactices {
  const cocktails = donnees.cocktails ?? []
  const types = donnees.types ?? []
  const prestas = donnees.prestas ?? []
  const verres = donnees.verres ?? {}
  let verresServis = 0

  const ecouteursVerres = new Map<string, Set<(v: Verre[]) => void>>()
  const ecouteursPresta = new Map<string, Set<(p: Presta | null) => void>>()
  const ajouter = <T>(m: Map<string, Set<T>>, cle: string, cb: T) => {
    if (!m.has(cle)) m.set(cle, new Set())
    m.get(cle)!.add(cb)
    return () => {
      m.get(cle)!.delete(cb)
    }
  }

  return {
    cocktails: {
      ecouter: vi.fn((cb) => {
        cb(cocktails)
        return () => {}
      }),
      creer: vi.fn(() => 'nouvel-id'),
      modifier: vi.fn(),
      archiver: vi.fn(),
      impactSuppression: vi.fn(() => Promise.resolve({ prestas: 0, verres: 0 })),
      supprimer: vi.fn(() => Promise.resolve()),
    },
    types: {
      ecouter: vi.fn((cb) => {
        cb(types)
        return () => {}
      }),
      creer: vi.fn(() => 'nouvel-id'),
      renommer: vi.fn(),
      archiver: vi.fn(),
      supprimer: vi.fn(() => Promise.resolve()),
      initialiserSiVide: vi.fn(() => Promise.resolve()),
    },
    prestas: {
      ecouterListe: vi.fn((cb) => {
        cb(prestas)
        return () => {}
      }),
      ecouter: vi.fn((id, cb) => {
        cb(prestas.find((p) => p.id === id) ?? null)
        return ajouter(ecouteursPresta, id, cb)
      }),
      creer: vi.fn(() => 'nouvel-id'),
      modifier: vi.fn(() => Promise.resolve()),
      changerStatut: vi.fn(),
      supprimer: vi.fn(() => Promise.resolve()),
      compterServis: vi.fn(() => Promise.resolve(0)),
      dernierTotalServis: vi.fn(() => null),
    },
    verres: {
      ecouter: vi.fn((prestaId, cb) => {
        cb(verres[prestaId] ?? [])
        return ajouter(ecouteursVerres, prestaId, cb)
      }),
      servir: vi.fn(() => `verre-${++verresServis}`),
      retirer: vi.fn(() => Promise.resolve()),
    },
    emettre: {
      verres: (prestaId, v) => ecouteursVerres.get(prestaId)?.forEach((cb) => cb(v)),
      presta: (p) => ecouteursPresta.get(p.id)?.forEach((cb) => cb(p)),
    },
  }
}
