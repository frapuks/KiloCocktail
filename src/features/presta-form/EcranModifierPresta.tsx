import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useDepots } from '../../data/DepotsContext'
import { signalerErreurEcriture } from '../../data/erreurs'
import { useCocktails, usePresta, useTypes, useVerres } from '../../data/hooks'
import { libelleServis, nomLigne, nomPresta } from '../../domain/affichage'
import {
  deplacerDansGroupe,
  masquer,
  optionsAbsentes,
  reafficher,
  retirer,
  typeRetrait,
} from '../../domain/lignes'
import { normaliserNom } from '../../domain/noms'
import type { Cocktail, Ligne, TypeEvenement } from '../../domain/types'
import { totalPresta, totauxParLigne } from '../../domain/verres'
import { Confirmation } from '../../ui/Confirmation'
import { bouton, champ } from '../../ui/FeuilleModale'
import { ChampType } from './ChampType'
import { SelecteurCocktails } from './SelecteurCocktails'
import { SurLaCarte } from './SurLaCarte'

interface Brouillon {
  date: string
  client: string
  typeId: string | null
  lignes: Ligne[]
  lignesAPurger: string[]
}

type Dialogue =
  | { genre: 'retrait'; ligne: Ligne; nom: string; sousTitre: string | null; total: number }
  | { genre: 'abandon' }
  | { genre: 'suppression' }
  | null

function fusionner<T extends { id: string }>(base: T[], locaux: T[]): T[] {
  return [...base, ...locaux.filter((l) => !base.some((b) => b.id === l.id))]
}

export function EcranModifierPresta() {
  const { id = '' } = useParams()
  const depots = useDepots()
  const navigate = useNavigate()
  const location = useLocation()
  const presta = usePresta(id)
  const cocktailsHook = useCocktails()
  const typesHook = useTypes()
  const donneesVerres = useVerres(id)
  const [cocktailsCrees, setCocktailsCrees] = useState<Cocktail[]>([])
  const [typesCrees, setTypesCrees] = useState<TypeEvenement[]>([])
  const [initial, setInitial] = useState<Brouillon | null>(null)
  const [brouillon, setBrouillon] = useState<Brouillon | null>(null)
  const [dialogue, setDialogue] = useState<Dialogue>(null)
  const [ajout, setAjout] = useState<Ligne[] | null>(null)
  // Enregistrement ou suppression lancé : évite un second appel (et un double retour) sur un double tap.
  const [enCours, setEnCours] = useState(false)

  useEffect(() => {
    if (presta === null) navigate('/', { replace: true })
  }, [presta, navigate])

  if (presta && !brouillon) {
    const depart: Brouillon = {
      date: presta.date,
      client: presta.client ?? '',
      typeId: presta.typeId,
      lignes: presta.lignes,
      lignesAPurger: [],
    }
    setInitial(depart)
    setBrouillon(depart)
  }

  if (!presta || !brouillon || !initial || !cocktailsHook || !typesHook || !donneesVerres) return null

  const verres = donneesVerres.verres
  const totaux = totauxParLigne(verres)
  const cocktails = fusionner(cocktailsHook, cocktailsCrees)
  const types = fusionner(typesHook, typesCrees)
  const modifie = JSON.stringify(brouillon) !== JSON.stringify(initial)
  const maj = (p: Partial<Brouillon>) => setBrouillon((b) => (b ? { ...b, ...p } : b))
  const masquees = brouillon.lignes.filter((l) => l.masquee)

  function demanderRetrait(ligneId: string) {
    const ligne = brouillon!.lignes.find((l) => l.id === ligneId)
    if (!ligne) return
    const total = totaux.get(ligneId) ?? 0
    if (typeRetrait(total) === 'direct') {
      maj({ lignes: retirer(brouillon!.lignes, ligneId) })
      return
    }
    const cocktail = cocktails.find((c) => c.id === ligne.cocktailId)
    const { nom, sousTitre } = cocktail ? nomLigne(ligne, cocktail) : { nom: '', sousTitre: null }
    setDialogue({ genre: 'retrait', ligne, nom, sousTitre, total })
  }

  async function enregistrer() {
    const b = brouillon!
    setEnCours(true)
    try {
      await depots.prestas.modifier(
        id,
        { date: b.date, client: b.client.trim() || null, typeId: b.typeId, lignes: b.lignes },
        b.lignesAPurger,
      )
    } catch (raison) {
      setEnCours(false)
      signalerErreurEcriture(raison)
      return
    }
    retour()
  }

  // Retour à la page précédente ; ouvert sans historique (lien, rechargement), vers la presta elle-même.
  function retour() {
    if (location.key !== 'default') navigate(-1)
    else navigate(presta!.statut === 'en-cours' ? `/prestas/${id}` : `/prestas/${id}/resultats`, { replace: true })
  }

  function annuler() {
    if (modifie) setDialogue({ genre: 'abandon' })
    else retour()
  }

  async function supprimer() {
    setEnCours(true)
    try {
      await depots.prestas.supprimer(id)
    } catch (raison) {
      setEnCours(false)
      signalerErreurEcriture(raison)
      return
    }
    navigate('/', { replace: true })
  }

  function rendreDialogue() {
    if (!dialogue) return null
    const fermer = () => setDialogue(null)
    if (dialogue.genre === 'retrait') {
      const { ligne, nom, sousTitre, total } = dialogue
      const servis = `${total} ${libelleServis(total)}`
      return (
        <Confirmation
          titre={`Retirer ${nom}${sousTitre ? ` (${sousTitre})` : ''} ?`}
          onFermer={fermer}
          actions={[
            {
              libelle: `Masquer du comptage (garder ${total >= 2 ? 'les' : 'le'} ${servis})`,
              onClick: () => {
                maj({ lignes: masquer(brouillon!.lignes, ligne.id) })
                fermer()
              },
            },
            {
              libelle: `Supprimer avec ${total >= 2 ? 'ses' : 'son'} ${servis}`,
              danger: true,
              onClick: () => {
                maj({
                  lignes: retirer(brouillon!.lignes, ligne.id),
                  lignesAPurger: [...brouillon!.lignesAPurger, ligne.id],
                })
                fermer()
              },
            },
            { libelle: 'Annuler', onClick: fermer },
          ]}
        />
      )
    }
    if (dialogue.genre === 'abandon') {
      return (
        <Confirmation
          titre="Abandonner les modifications ?"
          onFermer={fermer}
          actions={[
            { libelle: 'Abandonner', danger: true, onClick: retour },
            { libelle: 'Continuer à modifier', onClick: fermer },
          ]}
        />
      )
    }
    return (
      <Confirmation
        titre={`Supprimer “${nomPresta(presta!)}” et ses ${totalPresta(verres)} cocktails servis ?`}
        onFermer={fermer}
        actions={[
          { libelle: 'Supprimer', danger: true, desactive: enCours, onClick: () => void supprimer() },
          { libelle: 'Annuler', onClick: fermer },
        ]}
      />
    )
  }

  return (
    <main style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 32 }}>
      <h1 style={{ fontFamily: 'var(--police-titre)', margin: 0 }}>Modifier la presta</h1>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        Date
        <input
          type="date"
          value={brouillon.date}
          onChange={(e) => {
            // Date effacée : on garde la précédente (jamais de presta sans date).
            if (e.target.value) maj({ date: e.target.value })
          }}
          style={champ}
        />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        Client
        <input type="text" value={brouillon.client} onChange={(e) => maj({ client: e.target.value })} style={champ} />
      </label>
      <ChampType
        types={types}
        valeur={brouillon.typeId}
        onChange={(t) => maj({ typeId: t })}
        onCreer={(nom) => {
          const nouveau = depots.types.creer(nom)
          setTypesCrees((t) => [...t, { id: nouveau, nom, nomNormalise: normaliserNom(nom), archive: false }])
          return nouveau
        }}
      />
      <SurLaCarte
        lignes={brouillon.lignes}
        cocktails={cocktails}
        totaux={totaux}
        onDeplacer={(variante, de, vers) => maj({ lignes: deplacerDansGroupe(brouillon.lignes, variante, de, vers) })}
        onRetirer={demanderRetrait}
      />
      {masquees.length > 0 && (
        <section aria-labelledby="titre-masquees">
          <h2 id="titre-masquees" style={{ fontFamily: 'var(--police-titre)' }}>
            Masquées
          </h2>
          <ul style={{ margin: 0, padding: 0 }}>
            {masquees.map((ligne) => {
              const cocktail = cocktails.find((c) => c.id === ligne.cocktailId)
              const noms = cocktail ? nomLigne(ligne, cocktail) : null
              return (
                <li
                  key={ligne.id}
                  style={{ listStyle: 'none', display: 'flex', alignItems: 'center', gap: 8, minHeight: 44 }}
                >
                  <span style={{ flex: 1 }}>
                    {noms ? (noms.sousTitre ? `${noms.nom} · ${noms.sousTitre}` : noms.nom) : ''}
                  </span>
                  <span>{totaux.get(ligne.id) ?? 0}</span>
                  <button
                    type="button"
                    style={bouton}
                    onClick={() => maj({ lignes: reafficher(brouillon.lignes, ligne.id) })}
                  >
                    Réafficher
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}
      <button type="button" style={bouton} onClick={() => setAjout([])}>
        + Ajouter
      </button>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => void enregistrer()}
          disabled={enCours}
          style={{ ...bouton, background: 'var(--avec)', borderColor: 'var(--avec)' }}
        >
          Enregistrer
        </button>
        <button type="button" onClick={annuler} style={bouton}>
          Annuler
        </button>
      </div>
      <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid var(--filet)' }}>
        <button
          type="button"
          onClick={() => setDialogue({ genre: 'suppression' })}
          style={{ ...bouton, background: 'var(--moins)', borderColor: 'var(--moins)', color: '#323232' }}
        >
          Supprimer la presta
        </button>
      </div>
      {ajout && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Ajouter des cocktails"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          <div
            style={{
              background: 'var(--fond)',
              borderTop: '1px solid var(--filet)',
              borderRadius: '12px 12px 0 0',
              padding: 20,
              width: '100%',
              maxWidth: 520,
              maxHeight: '100%',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <SelecteurCocktails
              options={optionsAbsentes(cocktails, brouillon.lignes)}
              lignes={ajout}
              onChange={setAjout}
              catalogue={cocktails}
              onCreerCocktail={(d) => {
                const nouveau = depots.cocktails.creer(d)
                setCocktailsCrees((c) => [
                  ...c,
                  { id: nouveau, ...d, nomNormalise: normaliserNom(d.nom), archive: false },
                ])
                return nouveau
              }}
            />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                style={{ ...bouton, background: 'var(--avec)', borderColor: 'var(--avec)' }}
                onClick={() => {
                  maj({ lignes: [...brouillon.lignes, ...ajout] })
                  setAjout(null)
                }}
              >
                Ajouter
              </button>
              <button type="button" style={bouton} onClick={() => setAjout(null)}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
      {rendreDialogue()}
    </main>
  )
}
