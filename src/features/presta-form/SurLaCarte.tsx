import { groupes } from '../../domain/lignes'
import { nomLigne } from '../../domain/affichage'
import type { Cocktail, Ligne, Variante } from '../../domain/types'
import { bouton } from '../../ui/FeuilleModale'
import { ListeReordonnable } from '../../ui/ListeReordonnable'

interface Props {
  lignes: Ligne[]
  cocktails: Cocktail[]
  totaux?: Map<string, number>
  onDeplacer(variante: Variante, de: number, vers: number): void
  onRetirer?(ligneId: string): void
}

const GROUPES: { variante: Variante; titre: string }[] = [
  { variante: 'avec', titre: 'Avec alcool' },
  { variante: 'sans', titre: 'Sans alcool' },
]

export function SurLaCarte({ lignes, cocktails, totaux, onDeplacer, onRetirer }: Props) {
  const parGroupe = groupes(lignes)
  return (
    <section aria-labelledby="titre-sur-la-carte">
      <h2 id="titre-sur-la-carte" style={{ fontFamily: 'var(--police-titre)' }}>
        Sur la carte
      </h2>
      {GROUPES.map(({ variante, titre }) => {
        const groupe = parGroupe[variante]
        if (groupe.length === 0) return null
        return (
          <div key={variante}>
            <h3 style={{ color: 'var(--texte-2)', fontSize: 16 }}>{titre}</h3>
            <ListeReordonnable
              libelle={titre}
              elements={groupe}
              onDeplacer={(de, vers) => onDeplacer(variante, de, vers)}
              rendre={(ligne) => {
                const cocktail = cocktails.find((c) => c.id === ligne.cocktailId)
                if (!cocktail) return null
                const { nom, sousTitre } = nomLigne(ligne, cocktail)
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div>{nom}</div>
                      {sousTitre && <div style={{ color: 'var(--texte-2)', fontSize: 14 }}>{sousTitre}</div>}
                    </div>
                    {totaux && <span>{totaux.get(ligne.id) ?? 0}</span>}
                    {onRetirer && (
                      <button type="button" style={bouton} onClick={() => onRetirer(ligne.id)}>
                        Retirer
                      </button>
                    )}
                  </div>
                )
              }}
            />
          </div>
        )
      })}
    </section>
  )
}
