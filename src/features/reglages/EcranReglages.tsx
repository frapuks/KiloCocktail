import { useEffect, useState, type CSSProperties } from 'react'
import { ecouterUtilisateur, seDeconnecter } from '../../data/auth'
import { useDepots } from '../../data/DepotsContext'
import { useTypes } from '../../data/hooks'
import { trouverDoublon } from '../../domain/noms'
import type { TypeEvenement } from '../../domain/types'

interface PropsFicheType {
  type?: TypeEvenement
  types: TypeEvenement[]
  onEnregistrer(nom: string): void
  onAnnuler(): void
  onArchiver?(): void
}

const champ: CSSProperties = {
  minHeight: 44,
  padding: '0 12px',
  borderRadius: 8,
  border: '1px solid var(--filet)',
  background: 'transparent',
  color: 'var(--texte)',
  font: 'inherit',
}
const bouton: CSSProperties = {
  minHeight: 44,
  padding: '0 16px',
  borderRadius: 8,
  border: '1px solid var(--filet)',
  background: 'transparent',
  color: 'var(--texte)',
  font: 'inherit',
  fontWeight: 600,
}

export function FicheType({ type, types, onEnregistrer, onAnnuler, onArchiver }: PropsFicheType) {
  const [nom, setNom] = useState(type?.nom ?? '')
  const [erreur, setErreur] = useState<string | null>(null)

  function enregistrer() {
    const nomPropre = nom.trim()
    if (!nomPropre) {
      setErreur('Donne un nom au type')
      return
    }
    const doublon = trouverDoublon(types, nomPropre, type?.id)
    if (doublon) {
      setErreur(
        doublon.archive
          ? `Un type “${doublon.nom}” existe déjà dans les archivés. Désarchive-le plutôt.`
          : `Un type “${doublon.nom}” existe déjà`,
      )
      return
    }
    onEnregistrer(nomPropre)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 20,
      }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-label={type ? 'Modifier le type' : 'Nouveau type'}
        onSubmit={(e) => {
          e.preventDefault()
          enregistrer()
        }}
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
          {type && onArchiver && (
            <button type="button" onClick={onArchiver} style={{ ...bouton, marginLeft: 'auto' }}>
              Archiver
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

const MESSAGE_EN_ATTENTE =
  'Des cocktails ne sont pas encore sauvegardés. Reconnecte-toi à internet avant de te déconnecter.'

function Compte() {
  const [email, setEmail] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)
  const [bloque, setBloque] = useState(false)

  useEffect(() => ecouterUtilisateur((u) => setEmail(u?.email ?? null)), [])

  async function deconnecter() {
    setEnCours(true)
    setBloque(false)
    try {
      // Sur 'ok', l'écouteur d'authentification de RouteProtegee redirige vers /connexion.
      if ((await seDeconnecter()) === 'en-attente') setBloque(true)
    } finally {
      setEnCours(false)
    }
  }

  return (
    <section>
      <h2 style={{ fontFamily: 'var(--police-titre)', fontWeight: 600 }}>Compte</h2>
      {email && <p style={{ color: 'var(--texte-2)' }}>{email}</p>}
      <button type="button" onClick={deconnecter} disabled={enCours} style={bouton}>
        Se déconnecter
      </button>
      {bloque && (
        <p role="alert" style={{ color: 'var(--moins)' }}>
          {MESSAGE_EN_ATTENTE}
        </p>
      )}
    </section>
  )
}

export function EcranReglages() {
  const depots = useDepots()
  const types = useTypes()
  // 'nouveau' = création, TypeEvenement = renommage, null = fiche fermée
  const [fiche, setFiche] = useState<'nouveau' | TypeEvenement | null>(null)

  if (!types) return <p style={{ padding: 16, color: 'var(--texte-2)' }}>Chargement…</p>

  const trier = (a: TypeEvenement, b: TypeEvenement) => a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' })
  const actifs = types.filter((t) => !t.archive).sort(trier)
  const archives = types.filter((t) => t.archive).sort(trier)

  return (
    <main style={{ padding: 16, paddingBottom: 96 }}>
      <h1 style={{ fontFamily: 'var(--police-titre)', fontWeight: 800 }}>Réglages</h1>

      <section>
        <h2 style={{ fontFamily: 'var(--police-titre)', fontWeight: 600 }}>Types d'événement</h2>
        <button
          type="button"
          onClick={() => setFiche('nouveau')}
          style={{ ...bouton, background: 'var(--avec)', borderColor: 'var(--avec)' }}
        >
          + Ajouter un type
        </button>

        <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0' }}>
          {actifs.map((t) => (
            <li key={t.id} style={{ borderBottom: '1px solid var(--filet)' }}>
              <button
                type="button"
                onClick={() => setFiche(t)}
                style={{
                  width: '100%',
                  minHeight: 48,
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--texte)',
                  font: 'inherit',
                  fontWeight: 600,
                  textAlign: 'left',
                }}
              >
                {t.nom}
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
              {archives.map((t) => (
                <li
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    minHeight: 56,
                    borderBottom: '1px solid var(--filet)',
                  }}
                >
                  <span style={{ color: 'var(--texte-2)' }}>{t.nom}</span>
                  <button type="button" onClick={() => depots.types.archiver(t.id, false)} style={bouton}>
                    Désarchiver
                  </button>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <Compte />

      {fiche && (
        <FicheType
          key={fiche === 'nouveau' ? 'nouveau' : fiche.id}
          type={fiche === 'nouveau' ? undefined : fiche}
          types={types}
          onAnnuler={() => setFiche(null)}
          onEnregistrer={(nom) => {
            if (fiche === 'nouveau') depots.types.creer(nom)
            else depots.types.renommer(fiche.id, nom)
            setFiche(null)
          }}
          onArchiver={
            fiche === 'nouveau'
              ? undefined
              : () => {
                  depots.types.archiver(fiche.id, true)
                  setFiche(null)
                }
          }
        />
      )}
    </main>
  )
}
