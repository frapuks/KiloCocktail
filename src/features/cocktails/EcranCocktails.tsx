import { useState, type CSSProperties } from 'react'
import { useDepots } from '../../data/DepotsContext'
import { useCocktails } from '../../data/hooks'
import type { Cocktail } from '../../domain/types'
import { FicheCocktail } from './FicheCocktail'

const pastille: CSSProperties = { fontSize: 12, padding: '2px 8px', borderRadius: 999, color: 'var(--texte)' }

function Pastilles({ cocktail }: { cocktail: Cocktail }) {
  const avec = cocktail.variantes !== 'sans'
  const sans = cocktail.variantes !== 'avec'
  return (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
      {avec && <span style={{ ...pastille, background: 'var(--avec)' }}>Avec alcool</span>}
      {sans && <span style={{ ...pastille, background: 'var(--sans)' }}>Sans alcool</span>}
      {cocktail.variantes === 'les-deux' && cocktail.nomSansAlcool && (
        <span style={{ color: 'var(--texte-2)' }}>→ {cocktail.nomSansAlcool}</span>
      )}
    </span>
  )
}

export function EcranCocktails() {
  const depots = useDepots()
  const cocktails = useCocktails()
  // 'nouveau' = création, Cocktail = modification, null = fiche fermée
  const [fiche, setFiche] = useState<'nouveau' | Cocktail | null>(null)

  if (!cocktails) return <p style={{ padding: 16, color: 'var(--texte-2)' }}>Chargement…</p>

  const trier = (a: Cocktail, b: Cocktail) => a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' })
  const actifs = cocktails.filter((c) => !c.archive).sort(trier)
  const archives = cocktails.filter((c) => c.archive).sort(trier)

  return (
    <main style={{ padding: 16, paddingBottom: 96 }}>
      <h1 style={{ fontFamily: 'var(--police-titre)', fontWeight: 800 }}>Cocktails</h1>
      <button
        type="button"
        onClick={() => setFiche('nouveau')}
        style={{
          minHeight: 44,
          padding: '0 16px',
          borderRadius: 8,
          border: 'none',
          background: 'var(--avec)',
          color: 'var(--texte)',
          font: 'inherit',
          fontWeight: 600,
        }}
      >
        + Nouveau cocktail
      </button>

      <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0' }}>
        {actifs.map((c) => (
          <li key={c.id} style={{ borderBottom: '1px solid var(--filet)' }}>
            <button
              type="button"
              onClick={() => setFiche(c)}
              style={{
                width: '100%',
                minHeight: 56,
                padding: '8px 0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 4,
                background: 'transparent',
                border: 'none',
                color: 'var(--texte)',
                font: 'inherit',
                textAlign: 'left',
              }}
            >
              <span style={{ fontWeight: 600 }}>{c.nom}</span>
              <Pastilles cocktail={c} />
            </button>
          </li>
        ))}
      </ul>

      {archives.length > 0 && (
        <details>
          <summary style={{ minHeight: 44, display: 'flex', alignItems: 'center', color: 'var(--texte-2)' }}>
            Archivés
          </summary>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {archives.map((c) => (
              <li
                key={c.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  minHeight: 56,
                  borderBottom: '1px solid var(--filet)',
                }}
              >
                <span style={{ color: 'var(--texte-2)' }}>{c.nom}</span>
                <button
                  type="button"
                  onClick={() => depots.cocktails.archiver(c.id, false)}
                  style={{
                    minHeight: 44,
                    padding: '0 16px',
                    borderRadius: 8,
                    border: '1px solid var(--filet)',
                    background: 'transparent',
                    color: 'var(--texte)',
                    font: 'inherit',
                  }}
                >
                  Désarchiver
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}

      {fiche && (
        <FicheCocktail
          key={fiche === 'nouveau' ? 'nouveau' : fiche.id}
          cocktail={fiche === 'nouveau' ? undefined : fiche}
          cocktails={cocktails}
          onAnnuler={() => setFiche(null)}
          onEnregistrer={(d) => {
            if (fiche === 'nouveau') depots.cocktails.creer(d)
            else depots.cocktails.modifier(fiche.id, d)
            setFiche(null)
          }}
          onArchiver={
            fiche === 'nouveau'
              ? undefined
              : () => {
                  depots.cocktails.archiver(fiche.id, true)
                  setFiche(null)
                }
          }
        />
      )}
    </main>
  )
}
