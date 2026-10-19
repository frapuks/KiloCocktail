import { useState, type CSSProperties, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { envoyerReinitialisation, seConnecter } from '../../data/auth'
import { bouton, champ } from '../../ui/FeuilleModale'

const MESSAGES_ERREUR: Record<string, string> = {
  identifiants: 'E-mail ou mot de passe incorrect',
  reseau: 'Pas de connexion internet, réessaie dans un instant',
}

export function EcranConnexion() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)

  async function soumettre(e: FormEvent) {
    e.preventDefault()
    setMessage(null)
    setEnCours(true)
    try {
      await seConnecter(email, motDePasse)
      navigate('/')
    } catch (err) {
      setMessage(MESSAGES_ERREUR[(err as Error).message] ?? 'Connexion impossible, réessaie')
    } finally {
      setEnCours(false)
    }
  }

  async function reinitialiser() {
    if (!email.trim()) {
      setMessage("Saisis ton e-mail d'abord.")
      return
    }
    try {
      await envoyerReinitialisation(email.trim())
      setMessage('E-mail de réinitialisation envoyé.')
    } catch {
      setMessage("L'e-mail n'a pas pu être envoyé")
    }
  }

  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 380,
          padding: '1.75rem 1.5rem',
          borderRadius: 16,
          background: 'var(--fond-barre)',
          border: '1px solid var(--avec-creux)',
          borderTop: '4px solid var(--avec)',
        }}
      >
        <h1
          style={{
            margin: '0 0 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            fontFamily: 'var(--police-titre)',
            fontWeight: 800,
            fontSize: 40,
          }}
        >
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="none"
            stroke="var(--avec-flash)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 4h16l-8 9-8-9zM12 13v7M8 20h8" />
          </svg>
          KiloCocktail
        </h1>
        {!navigator.onLine && (
          <p style={{ margin: '0 0 1rem', color: 'var(--texte-2)' }}>Connecte-toi à internet pour la première ouverture.</p>
        )}
        <form onSubmit={soumettre} style={{ display: 'grid', gap: '1rem' }}>
          <label style={etiquette}>
            E-mail
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={champConnexion}
            />
          </label>
          <label style={etiquette}>
            Mot de passe
            <input
              type="password"
              autoComplete="current-password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              style={champConnexion}
            />
          </label>
          <button
            type="submit"
            disabled={enCours}
            style={{
              ...bouton,
              marginTop: 8,
              background: 'var(--avec)',
              borderColor: 'var(--avec)',
              opacity: enCours ? 0.6 : 1,
            }}
          >
            Se connecter
          </button>
          <button
            type="button"
            onClick={reinitialiser}
            style={{ ...bouton, border: 'none', color: 'var(--texte-2)', fontWeight: 500 }}
          >
            Mot de passe oublié
          </button>
        </form>
        {message && (
          <p role="alert" style={{ margin: '1rem 0 0', textAlign: 'center', color: 'var(--moins)' }}>
            {message}
          </p>
        )}
      </div>
    </main>
  )
}

const etiquette: CSSProperties = {
  display: 'grid',
  gap: 6,
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--texte-2)',
}

const champConnexion: CSSProperties = {
  ...champ,
  background: 'var(--fond)',
  borderColor: 'var(--avec-creux)',
  fontSize: 16,
}
