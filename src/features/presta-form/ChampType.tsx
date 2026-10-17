import { useState } from 'react'
import type { TypeEvenement } from '../../domain/types'
import { champ } from '../../ui/FeuilleModale'
import { FicheType } from '../reglages/EcranReglages'

interface Props {
  types: TypeEvenement[]
  valeur: string | null
  onChange(id: string | null): void
  onCreer(nom: string): string
}

const AJOUTER = '__ajouter__'

export function ChampType({ types, valeur, onChange, onCreer }: Props) {
  const [fiche, setFiche] = useState(false)
  const actifs = types.filter((t) => !t.archive || t.id === valeur).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))

  return (
    <>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        Type
        <select
          value={valeur ?? ''}
          onChange={(e) => {
            if (e.target.value === AJOUTER) setFiche(true)
            else onChange(e.target.value === '' ? null : e.target.value)
          }}
          style={champ}
        >
          <option value="">—</option>
          {actifs.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nom}
            </option>
          ))}
          <option value={AJOUTER}>+ Ajouter un type</option>
        </select>
      </label>
      {fiche && (
        <FicheType
          types={types}
          onAnnuler={() => setFiche(false)}
          onEnregistrer={(nom) => {
            onChange(onCreer(nom))
            setFiche(false)
          }}
        />
      )}
    </>
  )
}
