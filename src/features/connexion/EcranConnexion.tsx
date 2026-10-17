import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { envoyerReinitialisation, seConnecter } from '../../data/auth'

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
    <main style={{ maxWidth: 360, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ fontFamily: 'var(--police-titre)', fontWeight: 800 }}>KiloCocktail</h1>
      {!navigator.onLine && <p>Connecte-toi à internet pour la première ouverture.</p>}
      <form onSubmit={soumettre} style={{ display: 'grid', gap: '1rem' }}>
        <label style={{ display: 'grid', gap: 4 }}>
          E-mail
          <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label style={{ display: 'grid', gap: 4 }}>
          Mot de passe
          <input
            type="password"
            autoComplete="current-password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
          />
        </label>
        <button type="submit" disabled={enCours}>
          Se connecter
        </button>
        <button type="button" onClick={reinitialiser}>
          Mot de passe oublié
        </button>
      </form>
      {message && <p role="alert">{message}</p>}
    </main>
  )
}
