import { useState } from 'react'
import type { DonneesCocktail } from '../../data/depots'
import { basculerCocktail } from '../../domain/lignes'
import { normaliserNom } from '../../domain/noms'
import type { Cocktail, Ligne } from '../../domain/types'
import { bouton } from '../../ui/FeuilleModale'
import { FicheCocktail } from '../cocktails/FicheCocktail'

interface Props {
  options: Cocktail[]
  lignes: Ligne[]
  onChange(lignes: Ligne[]): void
  onCreerCocktail(d: DonneesCocktail): string
  catalogue?: Cocktail[]
}

const pastille = { fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 999, color: 'var(--texte)', whiteSpace: 'nowrap' } as const
const genId = () => crypto.randomUUID()

export function SelecteurCocktails({ options, lignes, onChange, onCreerCocktail, catalogue }: Props) {
  const [fiche, setFiche] = useState(false)

  return (
    <>
      <ul style={{ margin: 0, padding: 0 }}>
        {options.map((cocktail) => (
          <li key={cocktail.id} style={{ listStyle: 'none', minHeight: 44 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 44 }}>
              <input
                type="checkbox"
                checked={lignes.some((l) => l.cocktailId === cocktail.id)}
                onChange={() => onChange(basculerCocktail(lignes, cocktail, genId))}
              />
              {cocktail.nom}
              <span style={{ ...pastille, background: cocktail.alcool ? 'var(--avec)' : 'var(--sans)' }}>
                {cocktail.alcool ? 'Avec alcool' : 'Sans alcool'}
              </span>
            </label>
          </li>
        ))}
      </ul>
      <button type="button" style={bouton} onClick={() => setFiche(true)}>
        + Créer un cocktail
      </button>
      {fiche && (
        <FicheCocktail
          cocktails={catalogue ?? options}
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
