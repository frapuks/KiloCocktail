import { useState } from 'react'
import type { DonneesCocktail } from '../../data/depots'
import { basculerCocktail, basculerVariante } from '../../domain/lignes'
import { normaliserNom } from '../../domain/noms'
import type { Cocktail, Ligne, Variante } from '../../domain/types'
import { bouton } from '../../ui/FeuilleModale'
import { FicheCocktail } from '../cocktails/FicheCocktail'

interface Props {
  options: { cocktail: Cocktail; variantes: Variante[] }[]
  lignes: Ligne[]
  onChange(lignes: Ligne[]): void
  onCreerCocktail(d: DonneesCocktail): string
  catalogue?: Cocktail[]
}

const LIBELLES: Record<Variante, string> = { avec: 'Avec alcool', sans: 'Sans alcool' }
const genId = () => crypto.randomUUID()

export function SelecteurCocktails({ options, lignes, onChange, onCreerCocktail, catalogue }: Props) {
  const [fiche, setFiche] = useState(false)

  return (
    <>
      <ul style={{ margin: 0, padding: 0 }}>
        {options.map(({ cocktail, variantes }) => (
          <li
            key={cocktail.id}
            style={{ listStyle: 'none', display: 'flex', alignItems: 'center', gap: 8, minHeight: 44, flexWrap: 'wrap' }}
          >
            <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minHeight: 44 }}>
              <input
                type="checkbox"
                checked={lignes.some((l) => l.cocktailId === cocktail.id)}
                onChange={() => onChange(basculerCocktail(lignes, cocktail, genId, variantes))}
              />
              {cocktail.nom}
            </label>
            {variantes.map((v) => {
              const active = lignes.some((l) => l.cocktailId === cocktail.id && l.variante === v)
              return (
                <button
                  key={v}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onChange(basculerVariante(lignes, cocktail.id, v, genId))}
                  style={{
                    ...bouton,
                    background: active ? (v === 'avec' ? 'var(--avec)' : 'var(--sans)') : 'transparent',
                  }}
                >
                  {LIBELLES[v]}
                </button>
              )
            })}
          </li>
        ))}
      </ul>
      <button type="button" style={bouton} onClick={() => setFiche(true)}>
        + Créer un cocktail
      </button>
      {fiche && (
        <FicheCocktail
          cocktails={catalogue ?? options.map((o) => o.cocktail)}
          onAnnuler={() => setFiche(false)}
          onEnregistrer={(d) => {
            const id = onCreerCocktail(d)
            const cree: Cocktail = { id, ...d, nomNormalise: normaliserNom(d.nom), archive: false }
            onChange(basculerCocktail(lignes, cree, genId))
            setFiche(false)
          }}
        />
      )}
    </>
  )
}
