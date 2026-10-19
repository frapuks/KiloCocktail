import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDepots } from '../../data/DepotsContext'
import { useCocktails, useTypes } from '../../data/hooks'
import { dateDuJour } from '../../domain/affichage'
import { deplacerDansGroupe, optionsAbsentes } from '../../domain/lignes'
import { normaliserNom } from '../../domain/noms'
import type { Cocktail, Ligne, TypeEvenement } from '../../domain/types'
import { bouton, champ } from '../../ui/FeuilleModale'
import { ChampType } from './ChampType'
import { SelecteurCocktails } from './SelecteurCocktails'
import { SurLaCarte } from './SurLaCarte'

function fusionner<T extends { id: string }>(base: T[], locaux: T[]): T[] {
  return [...base, ...locaux.filter((l) => !base.some((b) => b.id === l.id))]
}

export function EcranNouvellePresta() {
  const depots = useDepots()
  const navigate = useNavigate()
  const cocktailsHook = useCocktails()
  const typesHook = useTypes()
  const [cocktailsCrees, setCocktailsCrees] = useState<Cocktail[]>([])
  const [typesCrees, setTypesCrees] = useState<TypeEvenement[]>([])
  const [date, setDate] = useState(() => dateDuJour())
  const [client, setClient] = useState('')
  const [typeId, setTypeId] = useState<string | null>(null)
  const [lignes, setLignes] = useState<Ligne[]>([])

  const cocktails = fusionner(cocktailsHook ?? [], cocktailsCrees)
  const types = fusionner(typesHook ?? [], typesCrees)

  function commencer() {
    const id = depots.prestas.creer({ date, client: client.trim() || null, typeId, lignes })
    navigate(`/prestas/${id}`, { replace: true })
  }

  return (
    <main style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 32 }}>
      <h1 style={{ fontFamily: 'var(--police-titre)', margin: 0 }}>Nouvelle presta</h1>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        Date
        <input
          type="date"
          value={date}
          onChange={(e) => {
            // Date effacée : on garde la précédente (jamais de presta sans date).
            if (e.target.value) setDate(e.target.value)
          }}
          style={champ}
        />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        Client
        <input type="text" value={client} onChange={(e) => setClient(e.target.value)} style={champ} />
      </label>
      <ChampType
        types={types}
        valeur={typeId}
        onChange={setTypeId}
        onCreer={(nom) => {
          const id = depots.types.creer(nom)
          setTypesCrees((t) => [...t, { id, nom, nomNormalise: normaliserNom(nom), archive: false }])
          return id
        }}
      />
      <section>
        <h2 style={{ fontFamily: 'var(--police-titre)' }}>Cocktails</h2>
        <SelecteurCocktails
          options={optionsAbsentes(cocktails, [])}
          lignes={lignes}
          onChange={setLignes}
          catalogue={cocktails}
          onCreerCocktail={(d) => {
            const id = depots.cocktails.creer(d)
            setCocktailsCrees((c) => [...c, { id, ...d, nomNormalise: normaliserNom(d.nom), archive: false }])
            return id
          }}
        />
      </section>
      <SurLaCarte
        lignes={lignes}
        cocktails={cocktails}
        onDeplacer={(variante, de, vers) => setLignes((l) => deplacerDansGroupe(l, cocktails, variante, de, vers))}
      />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={commencer}
          style={{ ...bouton, background: 'var(--avec)', borderColor: 'var(--avec)' }}
        >
          Commencer la presta
        </button>
        <button type="button" onClick={() => navigate('/')} style={bouton}>
          Annuler
        </button>
      </div>
    </main>
  )
}
