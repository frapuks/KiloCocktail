import { useState } from 'react'
import type { DonneesCocktail } from '../../data/depots'
import { bouton, champ, FeuilleModale } from '../../ui/FeuilleModale'
import { messageDoublon, trouverDoublon } from '../../domain/noms'
import type { Cocktail } from '../../domain/types'

interface Props {
  cocktail?: Cocktail
  cocktails: Cocktail[]
  onEnregistrer(d: DonneesCocktail): void
  onAnnuler(): void
  onArchiver?(): void
}

const OPTIONS: { valeur: boolean; libelle: string }[] = [
  { valeur: true, libelle: 'Avec alcool' },
  { valeur: false, libelle: 'Sans alcool' },
]

export function FicheCocktail({ cocktail, cocktails, onEnregistrer, onAnnuler, onArchiver }: Props) {
  const [nom, setNom] = useState(cocktail?.nom ?? '')
  const [alcool, setAlcool] = useState(cocktail?.alcool ?? true)
  const [erreur, setErreur] = useState<string | null>(null)

  const renomme = cocktail !== undefined && nom.trim() !== cocktail.nom

  function enregistrer() {
    const nomPropre = nom.trim()
    if (!nomPropre) {
      setErreur('Donne un nom au cocktail')
      return
    }
    const doublon = trouverDoublon(cocktails, nomPropre, cocktail?.id)
    if (doublon) {
      setErreur(messageDoublon('Un cocktail', doublon))
      return
    }
    onEnregistrer({ nom: nomPropre, alcool })
  }

  return (
    <FeuilleModale libelle={cocktail ? 'Modifier le cocktail' : 'Nouveau cocktail'} onSubmit={enregistrer}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        Nom
        <input
          value={nom}
          onChange={(e) => {
            setNom(e.target.value)
            setErreur(null)
          }}
          style={champ}
        />
      </label>
      {renomme && (
        <p style={{ margin: 0, color: 'var(--texte-2)' }}>Le nouveau nom s'affichera aussi dans les prestas passées.</p>
      )}
      <fieldset style={{ border: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <legend style={{ padding: 0, marginBottom: 4 }}>Alcool</legend>
        {OPTIONS.map((o) => (
          <label key={String(o.valeur)} style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 44 }}>
            <input
              type="radio"
              name="alcool"
              checked={alcool === o.valeur}
              onChange={() => setAlcool(o.valeur)}
            />
            {o.libelle}
          </label>
        ))}
      </fieldset>
      {erreur && (
        <p role="alert" style={{ margin: 0, color: 'var(--moins)' }}>
          {erreur}
        </p>
      )}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="submit" style={{ ...bouton, background: 'var(--avec)', borderColor: 'var(--avec)' }}>
          Enregistrer
        </button>
        <button type="button" onClick={onAnnuler} style={bouton}>
          Annuler
        </button>
        {cocktail && onArchiver && (
          <button type="button" onClick={onArchiver} style={{ ...bouton, marginLeft: 'auto' }}>
            Archiver
          </button>
        )}
      </div>
    </FeuilleModale>
  )
}
