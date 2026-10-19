import { useState, type CSSProperties } from 'react'
import { useDepots } from '../../data/DepotsContext'
import { useCocktails } from '../../data/hooks'
import { comparerCocktails } from '../../domain/affichage'
import type { Cocktail } from '../../domain/types'
import { FicheCocktail } from './FicheCocktail'

const pastille: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  padding: '3px 10px',
  borderRadius: 999,
  color: 'var(--texte)',
  whiteSpace: 'nowrap',
}

// Largeur fixe par colonne : les pastilles restent alignées d'une ligne à l'autre, même quand une colonne est vide.
const LARGEUR_COLONNE = 104

export function EcranCocktails() {
  const depots = useDepots()
  const cocktails = useCocktails()
  // 'nouveau' = création, Cocktail = modification, null = fiche fermée
  const [fiche, setFiche] = useState<'nouveau' | Cocktail | null>(null)

  if (!cocktails) return <p style={{ padding: 16, color: 'var(--texte-2)' }}>Chargement…</p>

  const actifs = cocktails.filter((c) => !c.archive).sort(comparerCocktails)
  const archives = cocktails.filter((c) => c.archive).sort(comparerCocktails)

  return (
    <main style={{ padding: 16, paddingBottom: 96 }}>
      {/* Même en-tête que Prestas : marge haute du h1 par défaut reprise, bouton en marge négative. */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginTop: '1.34em' }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--police-titre)', fontWeight: 800 }}>Cocktails</h1>
        <button
          type="button"
          onClick={() => setFiche('nouveau')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            minHeight: 48,
            margin: '-6px 0',
            padding: '0 20px',
            border: 'none',
            borderRadius: 12,
            background: 'var(--avec)',
            color: 'var(--texte)',
            fontSize: 17,
            fontWeight: 700,
            fontFamily: 'inherit',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nouveau cocktail
        </button>
      </header>

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
                display: 'grid',
                gridTemplateColumns: `1fr ${LARGEUR_COLONNE}px`,
                alignItems: 'center',
                columnGap: 8,
                background: 'transparent',
                border: 'none',
                color: 'var(--texte)',
                font: 'inherit',
                textAlign: 'left',
              }}
            >
              <span style={{ fontWeight: 600, minWidth: 0 }}>{c.nom}</span>
              <span style={{ justifySelf: 'center' }}>
                <span style={{ ...pastille, background: c.alcool ? 'var(--avec)' : 'var(--sans)' }}>
                  {c.alcool ? 'Avec alcool' : 'Sans alcool'}
                </span>
              </span>
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
                <span style={{ color: 'var(--texte-2)' }}>{c.alcool ? c.nom : `${c.nom} · sans alcool`}</span>
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
